import "dotenv/config";
import express from "express";
import compression from "compression";
import { financialReportsCache } from "../utils/reportsCache";
import { invalidateLookupReadCache } from "../routes/account-lookups/shared";
import { invalidateEnrichmentLookupCache } from "../utils/transactionEnrichment";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import apiRoutes from "../apiRoutes";
import {
  apiBodyParserErrorMiddleware,
  apiSecurityMiddleware,
} from "./apiSecurity";
import { securityHeadersMiddleware } from "./securityHeaders";
import { closeDb } from "../db/db";
import { initCacheLayer, shutdownCacheLayer } from "./cacheInit";
import { parseTrustProxySetting } from "./trustProxy";
import { logSystemError } from "./logger";

// Capture unhandled exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  void logSystemError("Uncaught Exception", error);
});

// Capture unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  void logSystemError("Unhandled Rejection", reason);
});

const API_BODY_LIMIT = process.env.API_BODY_LIMIT || "25mb";
const URLENCODED_PARAMETER_LIMIT = 250;

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const host =
    process.env.HOST ||
    (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

  app.set("trust proxy", parseTrustProxySetting(process.env.TRUST_PROXY));
  app.disable("x-powered-by");

  // ── Performance: gzip/brotli compression for all responses ──
  app.use(compression({
    level: 6,
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  }));

  app.use(securityHeadersMiddleware);
  // Keep payloads bounded while allowing administrative backup imports.
  app.use(express.json({ limit: API_BODY_LIMIT }));
  app.use(
    express.urlencoded({
      limit: API_BODY_LIMIT,
      extended: false,
      parameterLimit: URLENCODED_PARAMETER_LIMIT,
    })
  );
  app.use(apiBodyParserErrorMiddleware);
  app.use("/api", apiSecurityMiddleware);
  app.get("/healthz", (_req, res) => {
    res.status(200).json({
      ok: true,
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    });
  });

  // Cache Invalidation Middleware — clears both reports and lookup caches
  app.use((req, res, next) => {
    res.on("finish", () => {
      if (
        ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
        res.statusCode >= 200 &&
        res.statusCode < 400
      ) {
        // If a modifying request succeeds, wipe caches to ensure data is fresh
        financialReportsCache.clear();
        // Also invalidate lookup cache if the mutation touches lookup data
        const url = req.originalUrl || req.url;
        if (
          url.includes("/accounts") ||
          url.includes("/drivers") ||
          url.includes("/vehicles") ||
          url.includes("/companies") ||
          url.includes("/goods-types") ||
          url.includes("/governorates") ||
          url.includes("/ports")
        ) {
          invalidateLookupReadCache();
          invalidateEnrichmentLookupCache();
        }
      }
    });
    next();
  });

  // REST API routes for the business app
  app.use("/api", apiRoutes);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Global Error Handler for Express
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    void logSystemError(`Express Error: ${req.method} ${req.url}`, err, {
      body: req.body,
      query: req.query,
      ip: req.ip,
    });
    
    // Don't leak error details to client in production
    res.status(500).json({ error: "Internal Server Error" });
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Initialize cache layer (Redis or in-memory fallback)
  await initCacheLayer();

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, host, () => {
    const publicHost = host === "0.0.0.0" ? "localhost" : host;
    console.log(`Server running on http://${publicHost}:${port}/`);
  });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Server] Received ${signal}, shutting down gracefully...`);

    const forceExitTimer = setTimeout(() => {
      console.error("[Server] Forced shutdown after timeout");
      process.exit(1);
    }, 10_000);
    forceExitTimer.unref();

    server.close(async error => {
      clearTimeout(forceExitTimer);

      try {
        await shutdownCacheLayer();
        await closeDb();
      } catch (closeError) {
        console.error("[Server] Failed to close database pool", closeError);
      }

      if (error) {
        console.error("[Server] Shutdown failed", error);
        process.exit(1);
      }

      process.exit(0);
    });
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

startServer().catch(console.error);

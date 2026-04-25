import "dotenv/config";
import express from "express";
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
import { parseTrustProxySetting } from "./trustProxy";

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
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

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

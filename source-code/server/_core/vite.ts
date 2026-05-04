import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const configuredServer =
    typeof viteConfig.server === "object" && viteConfig.server !== null
      ? viteConfig.server
      : {};
  const serverOptions = {
    ...configuredServer,
    middlewareMode: true,
    hmr: {
      ...(typeof configuredServer.hmr === "object" &&
      configuredServer.hmr !== null
        ? configuredServer.hmr
        : {}),
      server,
    },
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = injectClientEntryVersion(template);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

function injectClientEntryVersion(template: string) {
  const supportedEntries = ["main.jsx"];

  for (const entry of supportedEntries) {
    const source = `src="/src/${entry}"`;
    if (template.includes(source)) {
      return template.replace(source, `src="/src/${entry}?v=${nanoid()}"`);
    }
  }

  return template;
}

// ── Production static file serving with aggressive caching ──
const ONE_YEAR_SECONDS = 31_536_000;
const ONE_DAY_SECONDS = 86_400;

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Hashed assets (Vite output in /assets/) — immutable, cache forever
  app.use(
    "/assets",
    express.static(path.join(distPath, "assets"), {
      maxAge: ONE_YEAR_SECONDS * 1000,
      immutable: true,
      etag: true,
      lastModified: false,
    })
  );

  // Other static files — moderate caching
  app.use(
    express.static(distPath, {
      maxAge: ONE_DAY_SECONDS * 1000,
      etag: true,
      lastModified: true,
    })
  );

  // fall through to index.html if the file doesn't exist (SPA routing)
  app.use("*", (_req, res) => {
    // HTML should not be cached aggressively — always revalidate
    res.setHeader("Cache-Control", "no-cache, must-revalidate");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

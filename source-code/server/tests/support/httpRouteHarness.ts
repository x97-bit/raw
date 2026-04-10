import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import express, { Router } from "express";

type JsonRequestOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
};

export async function createRouteHarness(registerRoutes: (router: Router) => void) {
  const app = express();
  app.use(express.json());

  const router = Router();
  registerRoutes(router);
  app.use(router);

  const server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    async request(path: string, options: JsonRequestOptions = {}) {
      const headers = new Headers(options.headers ?? {});
      let body: BodyInit | undefined;

      if (Object.prototype.hasOwnProperty.call(options, "json")) {
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json");
        }
        body = options.json === undefined ? undefined : JSON.stringify(options.json);
      }

      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
        body,
      });
      const text = await response.text();

      let json: unknown = undefined;
      if (text) {
        try {
          json = JSON.parse(text);
        } catch {
          json = text;
        }
      }

      return {
        response,
        status: response.status,
        headers: response.headers,
        text,
        json,
      };
    },
    async close() {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
  };
}

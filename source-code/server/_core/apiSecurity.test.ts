import { describe, expect, it, vi } from "vitest";
import {
  INVALID_HOST_ERROR,
  apiBodyParserErrorMiddleware,
  apiSecurityMiddleware,
} from "./apiSecurity";

function createRequest(overrides: Record<string, unknown> = {}) {
  const headers = Object.fromEntries(
    Object.entries(
      (overrides.headers as Record<string, string> | undefined) || {}
    ).map(([key, value]) => [key.toLowerCase(), value])
  );

  return {
    method: "GET",
    protocol: "http",
    body: undefined,
    get(name: string) {
      return headers[name.toLowerCase()];
    },
    ...overrides,
  } as any;
}

function createResponse() {
  return {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;
}

describe("apiSecurityMiddleware", () => {
  it("marks api responses as non-cacheable", () => {
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn();

    apiSecurityMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "no-store, max-age=0"
    );
    expect(res.setHeader).toHaveBeenCalledWith("Pragma", "no-cache");
    expect(res.setHeader).toHaveBeenCalledWith("Expires", "0");
  });

  it("blocks mutating requests from a different origin", () => {
    const req = createRequest({
      method: "POST",
      body: { ok: true },
      headers: {
        host: "localhost:3000",
        origin: "https://evil.example",
        "content-type": "application/json",
      },
    });
    const res = createResponse();
    const next = vi.fn();

    apiSecurityMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Cross-site requests are not allowed.",
    });
  });

  it("requires json payloads for mutating requests with a body", () => {
    const req = createRequest({
      method: "POST",
      body: { ok: true },
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "content-type": "text/plain",
      },
    });
    const res = createResponse();
    const next = vi.fn();

    apiSecurityMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.json).toHaveBeenCalledWith({
      error: "Requests with a body must use application/json.",
    });
  });

  it("rejects suspicious host headers before handling api requests", () => {
    const req = createRequest({
      headers: {
        host: "localhost:3000/evil",
      },
    });
    const res = createResponse();
    const next = vi.fn();

    apiSecurityMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: INVALID_HOST_ERROR });
  });

  it("allows same-origin json mutations", () => {
    const req = createRequest({
      method: "POST",
      body: { ok: true },
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "content-type": "application/json; charset=utf-8",
      },
    });
    const res = createResponse();
    const next = vi.fn();

    apiSecurityMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("apiBodyParserErrorMiddleware", () => {
  it("returns 400 for malformed json payloads", () => {
    const error = Object.assign(new SyntaxError("Unexpected token"), {
      status: 400,
      body: "{bad json",
    });
    const res = createResponse();
    const next = vi.fn();

    apiBodyParserErrorMiddleware(error, {} as any, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Malformed JSON payload." });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 413 for oversized payloads", () => {
    const error = {
      type: "entity.too.large",
    };
    const res = createResponse();
    const next = vi.fn();

    apiBodyParserErrorMiddleware(error as any, {} as any, res, next);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      error: "Request payload is too large.",
    });
    expect(next).not.toHaveBeenCalled();
  });
});

import type { ErrorRequestHandler, Request, RequestHandler } from "express";
import { buildRateLimitGuard } from "./rateLimit";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const BODY_METHODS = new Set(["POST", "PUT", "PATCH"]);
const API_CACHE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;
const INVALID_HOST_ERROR = "Invalid Host header.";

const mutationRateLimitGuard = buildRateLimitGuard({
  keyPrefix: "api-mutation",
  windowMs: 60 * 1000,
  max: 180,
  message: "Too many API write requests. Please try again shortly.",
});

function normalizeOriginHeader(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return null;

  try {
    return new URL(rawValue).origin.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeConfiguredOrigin(value?: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}

export function normalizeHostHeader(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return null;

  const normalized = rawValue.trim().toLowerCase();
  if (!normalized) return null;

  try {
    const parsed = new URL(`http://${normalized}`);
    const hasUnsafeParts = Boolean(parsed.username || parsed.password || parsed.search || parsed.hash);
    const hasUnexpectedPath = parsed.pathname !== "/" && parsed.pathname !== "";

    if (hasUnsafeParts || hasUnexpectedPath) {
      return null;
    }

    return parsed.host.toLowerCase();
  } catch {
    return null;
  }
}

function resolveConfiguredAllowedOrigins() {
  const configuredOrigins = [
    process.env.APP_BASE_URL,
    process.env.PUBLIC_BASE_URL,
    process.env.SITE_URL,
    ...(process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  ];

  return Array.from(
    new Set(
      configuredOrigins
        .map((value) => normalizeConfiguredOrigin(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

export function hasValidHostHeader(req: Request) {
  const host = req.get("host");
  if (!host) return true;
  return Boolean(normalizeHostHeader(host));
}

export function isMutatingRequest(req: Pick<Request, "method">) {
  return MUTATING_METHODS.has(req.method.toUpperCase());
}

export function hasRequestBody(req: Request) {
  const contentLength = Number.parseInt(String(req.get("content-length") || ""), 10);
  if (Number.isFinite(contentLength)) {
    return contentLength > 0;
  }

  if (req.get("transfer-encoding")) {
    return true;
  }

  if (req.body === undefined || req.body === null) {
    return false;
  }

  if (typeof req.body !== "object") {
    return true;
  }

  return Object.keys(req.body).length > 0;
}

export function isJsonContentType(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return false;

  const mediaType = rawValue.split(";")[0]?.trim().toLowerCase();
  return mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"));
}

export function resolveRequestOrigin(req: Request) {
  const host = normalizeHostHeader(req.get("host"));
  if (!host) return null;
  return `${req.protocol}://${host}`.toLowerCase();
}

export function isAllowedMutationOrigin(req: Request) {
  const configuredAllowedOrigins = resolveConfiguredAllowedOrigins();
  const allowedOrigins = configuredAllowedOrigins.length > 0
    ? configuredAllowedOrigins
    : [resolveRequestOrigin(req)].filter((value): value is string => Boolean(value));

  if (allowedOrigins.length === 0) {
    return !req.get("origin") && !req.get("referer");
  }

  const origin = normalizeOriginHeader(req.get("origin"));
  if (origin) {
    return allowedOrigins.includes(origin);
  }

  const refererOrigin = normalizeOriginHeader(req.get("referer"));
  if (refererOrigin) {
    return allowedOrigins.includes(refererOrigin);
  }

  return req.get("sec-fetch-site")?.toLowerCase() !== "cross-site";
}

export const apiSecurityMiddleware: RequestHandler = (req, res, next) => {
  for (const [header, value] of Object.entries(API_CACHE_HEADERS)) {
    res.setHeader(header, value);
  }

  if (!hasValidHostHeader(req)) {
    return res.status(400).json({ error: INVALID_HOST_ERROR });
  }

  if (!isMutatingRequest(req)) {
    return next();
  }

  if (!isAllowedMutationOrigin(req)) {
    return res.status(403).json({ error: "Cross-site requests are not allowed." });
  }

  if (BODY_METHODS.has(req.method.toUpperCase()) && hasRequestBody(req) && !isJsonContentType(req.get("content-type"))) {
    return res.status(415).json({ error: "Requests with a body must use application/json." });
  }

  return mutationRateLimitGuard.middleware(req, res, next);
};

export const apiBodyParserErrorMiddleware: ErrorRequestHandler = (error, _req, res, next) => {
  const details = error as { status?: number; type?: string; body?: unknown } | undefined;

  if (details?.type === "entity.too.large") {
    return res.status(413).json({ error: "Request payload is too large." });
  }

  if (error instanceof SyntaxError && details?.status === 400 && "body" in details) {
    return res.status(400).json({ error: "Malformed JSON payload." });
  }

  return next(error);
};

export { INVALID_HOST_ERROR };

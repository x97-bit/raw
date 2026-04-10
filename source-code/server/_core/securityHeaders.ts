import type { Request, RequestHandler } from "express";

const DEFAULT_FORGE_ORIGIN = "https://forge.butterfly-effect.dev";
const DEFAULT_MAP_SCRIPT_ORIGINS = [
  DEFAULT_FORGE_ORIGIN,
  "https://maps.googleapis.com",
  "https://maps.gstatic.com",
];

export const SECURITY_HEADERS = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Origin-Agent-Cluster": "?1",
  "X-DNS-Prefetch-Control": "off",
} as const;

function resolveOrigin(rawValue?: string) {
  if (!rawValue) return null;

  try {
    return new URL(rawValue).origin;
  } catch {
    return null;
  }
}

function buildUniqueSourceList(...groups: Array<Array<string | null | undefined>>) {
  return Array.from(new Set(groups.flat().filter((value): value is string => Boolean(value))));
}

export function buildContentSecurityPolicy() {
  const runtimeOrigins = buildUniqueSourceList(
    [resolveOrigin(process.env.VITE_ANALYTICS_ENDPOINT)],
    [resolveOrigin(process.env.VITE_FRONTEND_FORGE_API_URL)],
    [resolveOrigin(process.env.BUILT_IN_FORGE_API_URL)],
  );
  const scriptSources = buildUniqueSourceList(
    ["'self'"],
    DEFAULT_MAP_SCRIPT_ORIGINS,
    runtimeOrigins,
    process.env.NODE_ENV === "development" ? ["'unsafe-inline'"] : [],
  );
  const connectSources = buildUniqueSourceList(
    ["'self'", "https:", "ws:", "wss:"],
    runtimeOrigins,
    [DEFAULT_FORGE_ORIGIN],
  );

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src ${connectSources.join(" ")}`,
    "frame-src 'self' https:",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function buildSecurityHeaders(req: Request) {
  const headers: Record<string, string> = {
    ...SECURITY_HEADERS,
    "Content-Security-Policy": buildContentSecurityPolicy(),
  };

  if (process.env.NODE_ENV === "production" && (req.secure || req.protocol === "https")) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  }

  return headers;
}

export const securityHeadersMiddleware: RequestHandler = (req, res, next) => {
  for (const [header, value] of Object.entries(buildSecurityHeaders(req))) {
    res.setHeader(header, value);
  }

  next();
};

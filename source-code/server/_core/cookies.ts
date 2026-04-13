import type { CookieOptions, Request } from "express";
import { APP_REFRESH_TOKEN_TTL_MS } from "@shared/const";

function isSecureRequest(req: Request) {
  return Boolean(req.secure) || req.protocol === "https";
}

function getBaseCookieOptions(
  req: Request,
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);

  return {
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure,
  };
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  return getBaseCookieOptions(req);
}

export function getAppRefreshCookieOptions(
  req: Request,
): Pick<CookieOptions, "domain" | "httpOnly" | "maxAge" | "path" | "sameSite" | "secure"> {
  return {
    ...getBaseCookieOptions(req),
    maxAge: APP_REFRESH_TOKEN_TTL_MS,
  };
}

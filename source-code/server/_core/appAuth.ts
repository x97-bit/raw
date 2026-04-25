import type { NextFunction, Request, Response } from "express";
import {
  APP_ACCESS_TOKEN_TTL_SECONDS,
  APP_REFRESH_COOKIE_NAME,
  APP_REFRESH_TOKEN_TTL_MS,
} from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { appUsers } from "../../drizzle/schema";
import type { AppUserRecord } from "../db/schema/dbTypes";
import { getDb } from "../db/db";
import {
  getAppAccessTokenSecret,
  getAppRefreshTokenSecret,
} from "./sessionSecret";

export interface AuthRequest extends Request {
  appUser?: AppUserRecord;
}

const getAccessTokenSecret = () => getAppAccessTokenSecret();
const getRefreshTokenSecret = () => getAppRefreshTokenSecret();

const authTokenSubjectSchema = z.object({
  userId: z.number().int().positive(),
  role: z.string().min(1).max(64).optional(),
});

const accessTokenPayloadSchema = authTokenSubjectSchema.extend({
  tokenType: z.literal("access"),
});

const refreshTokenPayloadSchema = authTokenSubjectSchema.extend({
  tokenType: z.literal("refresh"),
});

type AuthTokenPayload = z.infer<typeof accessTokenPayloadSchema>;
type RefreshTokenPayload = z.infer<typeof refreshTokenPayloadSchema>;

export function extractBearerToken(value?: string | string[]): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return null;

  const match = rawValue.trim().match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token || null;
}

export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessTokenSecret(), {
      algorithms: ["HS256"],
    });
    const result = accessTokenPayloadSchema.safeParse(payload);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshTokenSecret(), {
      algorithms: ["HS256"],
    });
    const result = refreshTokenPayloadSchema.safeParse(payload);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function signToken(
  payload: Record<string, unknown>
): Promise<string> {
  const normalizedPayload = authTokenSubjectSchema.parse(payload);

  return new SignJWT({
    ...normalizedPayload,
    tokenType: "access",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setSubject(String(normalizedPayload.userId))
    .setExpirationTime(`${APP_ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(getAccessTokenSecret());
}

export async function signRefreshToken(
  payload: Record<string, unknown>
): Promise<string> {
  const normalizedPayload = authTokenSubjectSchema.parse(payload);
  const expirationSeconds = Math.floor(
    (Date.now() + APP_REFRESH_TOKEN_TTL_MS) / 1000
  );

  return new SignJWT({
    ...normalizedPayload,
    tokenType: "refresh",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setSubject(String(normalizedPayload.userId))
    .setExpirationTime(expirationSeconds)
    .sign(getRefreshTokenSecret());
}

export function getRefreshTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return null;
  }

  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies[APP_REFRESH_COOKIE_NAME];
  return typeof token === "string" && token.trim() ? token.trim() : null;
}

export async function loadAuthenticatedAppUser(
  userId: number
): Promise<AppUserRecord | null | undefined> {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const [user] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.id, userId))
    .limit(1);
  if (!user || !user.active) {
    return null;
  }

  return user;
}

export function requireAppUser(req: AuthRequest): AppUserRecord {
  if (!req.appUser) {
    throw new Error("Authenticated app user was missing from the request.");
  }

  return req.appUser;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "غير مصرح" });
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "انتهت الجلسة" });
  }

  const user = await loadAuthenticatedAppUser(payload.userId);
  if (user === undefined) {
    return res.status(500).json({ error: "Database unavailable" });
  }
  if (!user) {
    return res.status(401).json({ error: "المستخدم غير نشط" });
  }

  req.appUser = user;
  next();
}

export function isAdminUser(req: AuthRequest) {
  return req.appUser?.role === "admin";
}

export function hasPermission(req: AuthRequest, permission: string) {
  if (isAdminUser(req)) return true;
  return req.appUser?.permissions?.includes(permission) ?? false;
}

export function requirePermission(
  req: AuthRequest,
  res: Response,
  permission: string
) {
  if (!hasPermission(req, permission)) {
    res.status(403).json({ error: "غير مصرح لك بإجراء هذه العملية" });
    return false;
  }
  return true;
}

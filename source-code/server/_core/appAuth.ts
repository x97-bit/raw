import type { NextFunction, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { appUsers } from "../../drizzle/schema";
import { getDb } from "../db";
import { getSessionSecret } from "./sessionSecret";

export interface AuthRequest extends Request {
  appUser?: any;
}

const getSecret = () => getSessionSecret();

const authTokenPayloadSchema = z.object({
  userId: z.number().int().positive(),
  role: z.string().min(1).max(64).optional(),
});

type AuthTokenPayload = z.infer<typeof authTokenPayloadSchema>;

async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    const result = authTokenPayloadSchema.safeParse(payload);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  const normalizedPayload = authTokenPayloadSchema.parse(payload);

  return new SignJWT(normalizedPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setSubject(String(normalizedPayload.userId))
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "غير مصرح" });
  }

  const token = authHeader.split(" ")[1];
  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "انتهت الجلسة" });
  }

  const db = await getDb();
  if (!db) return res.status(500).json({ error: "Database unavailable" });

  const [user] = await db.select().from(appUsers).where(eq(appUsers.id, payload.userId as number)).limit(1);
  if (!user || !user.active) {
    return res.status(401).json({ error: "المستخدم غير نشط" });
  }

  req.appUser = user;
  next();
}

export function isAdminUser(req: AuthRequest) {
  return req.appUser?.role === "admin";
}

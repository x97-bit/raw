import {
  APP_ACCESS_TOKEN_TTL_SECONDS,
  MERCHANT_REFRESH_COOKIE_NAME,
} from "@shared/const";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Request, Response, Router } from "express";
import { merchantUsers, merchantLoginLog } from "../../../drizzle/schema";
import {
  signRefreshToken,
  signToken,
  verifyRefreshToken,
  verifyToken,
} from "../../_core/appAuth";
import { getAppRefreshCookieOptions } from "../../_core/cookies";
import { respondRouteError } from "../../_core/routeResponses";
import { validateInput } from "../../_core/requestValidation";
import { getDb } from "../../db/db";
import type { MerchantUserRecord } from "../../db/schema/dbTypes";
import {
  authRateLimit,
  loginSchema,
  LOGIN_VALIDATION_MESSAGE,
} from "../auth-users/shared";

const INVALID_CREDENTIALS_ERROR = "اسم المستخدم أو كلمة المرور غير صحيحة";
const ACCOUNT_DISABLED_ERROR = "الحساب معطل";
const SESSION_EXPIRED_ERROR = "انتهت الجلسة";

export interface MerchantAuthRequest extends Request {
  merchantUser?: MerchantUserRecord;
}

export async function loadAuthenticatedMerchantUser(
  userId: number
): Promise<MerchantUserRecord | null | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [user] = await db
    .select()
    .from(merchantUsers)
    .where(eq(merchantUsers.id, userId))
    .limit(1);

  if (!user || !user.active) return null;

  return user;
}

export async function merchantAuthMiddleware(
  req: MerchantAuthRequest,
  res: Response,
  next: any
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "غير مصرح" });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "merchant") {
      return res.status(401).json({ error: "غير مصرح" });
    }

    const user = await loadAuthenticatedMerchantUser(payload.userId);
    if (user === undefined) {
      return res.status(500).json({ error: "Database unavailable" });
    }
    if (!user) {
      return res.status(401).json({ error: "المستخدم غير نشط" });
    }

    req.merchantUser = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "انتهت الجلسة" });
  }
}

export function requireMerchantUser(req: MerchantAuthRequest): MerchantUserRecord {
  if (!req.merchantUser) {
    throw new Error("Authenticated merchant user was missing from the request.");
  }
  return req.merchantUser;
}

function clearRefreshTokenCookie(req: Request, res: Response) {
  res.clearCookie(MERCHANT_REFRESH_COOKIE_NAME, {
    ...getAppRefreshCookieOptions(req),
    maxAge: 0,
  });
}

async function issueAuthSession(req: Request, res: Response, user: MerchantUserRecord) {
  // Use "merchant" as a strict role so we can identify them
  const token = await signToken({ userId: user.id, role: "merchant" });
  const refreshToken = await signRefreshToken({
    userId: user.id,
    role: "merchant",
  });

  res.cookie(
    MERCHANT_REFRESH_COOKIE_NAME,
    refreshToken,
    getAppRefreshCookieOptions(req)
  );

  const { password: _password, ...safeUser } = user;
  return {
    token,
    expiresInSeconds: APP_ACCESS_TOKEN_TTL_SECONDS,
    user: {
      id: safeUser.id,
      username: safeUser.username,
      fullName: safeUser.fullName,
      accountId: safeUser.accountId,
      role: "merchant",
    },
  };
}

export function registerMerchantAuthRoutes(router: Router) {
  router.post(
    "/merchant-auth/login",
    authRateLimit,
    async (req: Request, res: Response) => {
      try {
        const { username, password } = validateInput(
          loginSchema,
          req.body,
          LOGIN_VALIDATION_MESSAGE
        );
        const normalizedUsername = username.trim();

        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const [user] = await db
          .select()
          .from(merchantUsers)
          .where(eq(merchantUsers.username, normalizedUsername))
          .limit(1);

        const clientIp = req.ip || req.socket.remoteAddress || "unknown";
        const userAgent = (req.headers["user-agent"] || "").slice(0, 500);

        if (!user) {
          return res.status(401).json({ error: INVALID_CREDENTIALS_ERROR });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          // Log failed attempt
          try {
            await db.insert(merchantLoginLog).values({
              merchantUserId: user.id,
              ipAddress: clientIp,
              userAgent,
              status: "failed",
            });
          } catch (_) { /* ignore logging errors */ }
          return res.status(401).json({ error: INVALID_CREDENTIALS_ERROR });
        }

        if (!user.active) {
          return res.status(403).json({ error: ACCOUNT_DISABLED_ERROR });
        }

        // Log successful login
        try {
          await db.insert(merchantLoginLog).values({
            merchantUserId: user.id,
            ipAddress: clientIp,
            userAgent,
            status: "success",
          });
        } catch (_) { /* ignore logging errors */ }

        return res.json(await issueAuthSession(req, res, user));
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.post("/merchant-auth/refresh", async (req: Request, res: Response) => {
    try {
      const { parse: parseCookies } = await import("cookie");
      const cookies = parseCookies(req.headers.cookie || "");
      const refreshToken = cookies[MERCHANT_REFRESH_COOKIE_NAME] || null;
      if (!refreshToken) {
        clearRefreshTokenCookie(req, res);
        return res.status(401).json({ error: SESSION_EXPIRED_ERROR });
      }

      const payload = await verifyRefreshToken(refreshToken);
      if (!payload || payload.role !== "merchant") {
        clearRefreshTokenCookie(req, res);
        return res.status(401).json({ error: SESSION_EXPIRED_ERROR });
      }

      const user = await loadAuthenticatedMerchantUser(payload.userId);
      if (user === undefined) {
        return res.status(500).json({ error: "Database unavailable" });
      }

      if (!user) {
        clearRefreshTokenCookie(req, res);
        return res.status(401).json({ error: SESSION_EXPIRED_ERROR });
      }

      return res.json(await issueAuthSession(req, res, user));
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.post("/merchant-auth/logout", (req: Request, res: Response) => {
    clearRefreshTokenCookie(req, res);
    return res.json({ success: true });
  });

  router.get("/merchant-auth/me", merchantAuthMiddleware, (req: MerchantAuthRequest, res: Response) => {
    const user = requireMerchantUser(req);
    const { password: _password, ...safeUser } = user;
    return res.json({
      id: safeUser.id,
      username: safeUser.username,
      fullName: safeUser.fullName,
      accountId: safeUser.accountId,
      role: "merchant",
    });
  });
}

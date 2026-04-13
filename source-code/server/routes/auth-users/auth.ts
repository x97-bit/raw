import { APP_ACCESS_TOKEN_TTL_SECONDS, APP_REFRESH_COOKIE_NAME } from "@shared/const";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Request, Response, Router } from "express";
import { appUsers } from "../../../drizzle/schema";
import {
  AuthRequest,
  authMiddleware,
  getRefreshTokenFromRequest,
  loadAuthenticatedAppUser,
  requireAppUser,
  signRefreshToken,
  signToken,
  verifyRefreshToken,
} from "../../_core/appAuth";
import { getAppRefreshCookieOptions } from "../../_core/cookies";
import { respondRouteError } from "../../_core/routeResponses";
import { validateInput } from "../../_core/requestValidation";
import { getDb } from "../../db";
import type { AppUserRecord } from "../../dbTypes";
import {
  authRateLimit,
  CHANGE_PASSWORD_VALIDATION_MESSAGE,
  changePasswordSchema,
  LOGIN_VALIDATION_MESSAGE,
  loginSchema,
  passwordRateLimit,
  PROFILE_UPDATE_VALIDATION_MESSAGE,
  profileUpdateSchema,
  toLegacyUserShape,
} from "./shared";

const INVALID_CREDENTIALS_ERROR = "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629";
const ACCOUNT_DISABLED_ERROR = "\u0627\u0644\u062d\u0633\u0627\u0628 \u0645\u0639\u0637\u0644";
const SESSION_EXPIRED_ERROR = "\u0627\u0646\u062a\u0647\u062a \u0627\u0644\u062c\u0644\u0633\u0629";

function clearRefreshTokenCookie(req: Request, res: Response) {
  res.clearCookie(APP_REFRESH_COOKIE_NAME, {
    ...getAppRefreshCookieOptions(req),
    maxAge: 0,
  });
}

async function issueAuthSession(req: Request, res: Response, user: AppUserRecord) {
  const token = await signToken({ userId: user.id, role: user.role });
  const refreshToken = await signRefreshToken({ userId: user.id, role: user.role });

  res.cookie(APP_REFRESH_COOKIE_NAME, refreshToken, getAppRefreshCookieOptions(req));

  const { password: _password, ...safeUser } = user;
  return {
    token,
    expiresInSeconds: APP_ACCESS_TOKEN_TTL_SECONDS,
    user: toLegacyUserShape(safeUser),
  };
}

export function registerAuthRoutes(router: Router) {
  router.post("/auth/login", authRateLimit, async (req: Request, res: Response) => {
    try {
      const { username, password } = validateInput(loginSchema, req.body, LOGIN_VALIDATION_MESSAGE);
      const normalizedUsername = username.trim();

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const [user] = await db.select().from(appUsers).where(eq(appUsers.username, normalizedUsername)).limit(1);
      if (!user) {
        return res.status(401).json({ error: INVALID_CREDENTIALS_ERROR });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: INVALID_CREDENTIALS_ERROR });
      }

      if (!user.active) {
        return res.status(403).json({ error: ACCOUNT_DISABLED_ERROR });
      }

      return res.json(await issueAuthSession(req, res, user));
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.post("/auth/refresh", async (req: Request, res: Response) => {
    try {
      const refreshToken = getRefreshTokenFromRequest(req);
      if (!refreshToken) {
        clearRefreshTokenCookie(req, res);
        return res.status(401).json({ error: SESSION_EXPIRED_ERROR });
      }

      const payload = await verifyRefreshToken(refreshToken);
      if (!payload) {
        clearRefreshTokenCookie(req, res);
        return res.status(401).json({ error: SESSION_EXPIRED_ERROR });
      }

      const user = await loadAuthenticatedAppUser(payload.userId);
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

  router.post("/auth/logout", (req: Request, res: Response) => {
    clearRefreshTokenCookie(req, res);
    return res.json({ success: true });
  });

  router.get("/auth/me", authMiddleware, (req: AuthRequest, res: Response) => {
    const appUser = requireAppUser(req);
    const { password: _password, ...safeUser } = appUser;
    return res.json(toLegacyUserShape(safeUser));
  });

  router.put("/auth/profile", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const appUser = requireAppUser(req);
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const payload = validateInput(profileUpdateSchema, req.body, PROFILE_UPDATE_VALIDATION_MESSAGE);

      await db
        .update(appUsers)
        .set({ profileImage: payload.profileImage ?? null })
        .where(eq(appUsers.id, appUser.id));

      const [updatedUser] = await db.select().from(appUsers).where(eq(appUsers.id, appUser.id)).limit(1);
      if (!updatedUser) {
        return res.status(404).json({ error: "ط§ظ„ظ…ط³طھط®ط¯ظ… ط؛ظٹط± ظ…ظˆط¬ظˆط¯" });
      }

      const { password: _password, ...safeUser } = updatedUser;
      return res.json({
        message: payload.profileImage ? "طھظ… طھط­ط¯ظٹط« ط§ظ„طµظˆط±ط© ط§ظ„ط´ط®طµظٹط©" : "طھظ… ط­ط°ظپ ط§ظ„طµظˆط±ط© ط§ظ„ط´ط®طµظٹط©",
        user: toLegacyUserShape(safeUser),
      });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.post("/auth/change-password", authMiddleware, passwordRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const appUser = requireAppUser(req);
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const payload = validateInput(changePasswordSchema, req.body, CHANGE_PASSWORD_VALIDATION_MESSAGE);
      const valid = await bcrypt.compare(payload.currentPassword, appUser.password);
      if (!valid) {
        return res.status(400).json({ error: "ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط­ط§ظ„ظٹط© ط؛ظٹط± طµط­ظٹط­ط©" });
      }

      const hashed = await bcrypt.hash(payload.newPassword, 10);
      await db.update(appUsers).set({ password: hashed }).where(eq(appUsers.id, appUser.id));
      return res.json({ message: "طھظ… طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±" });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

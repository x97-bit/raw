import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { appUsers } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware, signToken } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { validateInput } from "../../_core/requestValidation";
import { getDb } from "../../db";
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

export function registerAuthRoutes(router: Router) {
  router.post("/auth/login", authRateLimit, async (req: Request, res: Response) => {
    try {
      const { username, password } = validateInput(loginSchema, req.body, LOGIN_VALIDATION_MESSAGE);
      const normalizedUsername = username.trim();

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const [user] = await db.select().from(appUsers).where(eq(appUsers.username, normalizedUsername)).limit(1);
      if (!user) {
        return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      if (!user.active) {
        return res.status(403).json({ error: "الحساب معطل" });
      }

      const token = await signToken({ userId: user.id, role: user.role });
      const { password: _password, ...safeUser } = user;

      return res.json({
        token,
        user: toLegacyUserShape(safeUser),
      });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.get("/auth/me", authMiddleware, (req: AuthRequest, res: Response) => {
    const { password: _password, ...safeUser } = req.appUser;
    return res.json(toLegacyUserShape(safeUser));
  });

  router.put("/auth/profile", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const payload = validateInput(profileUpdateSchema, req.body, PROFILE_UPDATE_VALIDATION_MESSAGE);

      await db
        .update(appUsers)
        .set({ profileImage: payload.profileImage ?? null })
        .where(eq(appUsers.id, req.appUser.id));

      const [updatedUser] = await db.select().from(appUsers).where(eq(appUsers.id, req.appUser.id)).limit(1);
      if (!updatedUser) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }

      const { password: _password, ...safeUser } = updatedUser;
      return res.json({
        message: payload.profileImage ? "تم تحديث الصورة الشخصية" : "تم حذف الصورة الشخصية",
        user: toLegacyUserShape(safeUser),
      });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.post("/auth/change-password", authMiddleware, passwordRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const payload = validateInput(changePasswordSchema, req.body, CHANGE_PASSWORD_VALIDATION_MESSAGE);
      const valid = await bcrypt.compare(payload.currentPassword, req.appUser.password);
      if (!valid) {
        return res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" });
      }

      const hashed = await bcrypt.hash(payload.newPassword, 10);
      await db.update(appUsers).set({ password: hashed }).where(eq(appUsers.id, req.appUser.id));
      return res.json({ message: "تم تغيير كلمة المرور" });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

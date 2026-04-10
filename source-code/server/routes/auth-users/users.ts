import { Response, Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { appUsers } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware, isAdminUser } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { assertPositiveIntegerParam, validateInput } from "../../_core/requestValidation";
import { getDb } from "../../db";
import {
  createUserSchema,
  CREATE_USER_VALIDATION_MESSAGE,
  normalizeActiveFlag,
  normalizePermissionsPayload,
  passwordRateLimit,
  permissionsPayloadSchema,
  PERMISSIONS_VALIDATION_MESSAGE,
  requireAdmin,
  resetPasswordSchema,
  RESET_PASSWORD_VALIDATION_MESSAGE,
  toLegacyUserShape,
  updateUserSchema,
  UPDATE_USER_VALIDATION_MESSAGE,
  USER_ID_LABEL,
  FORBIDDEN_ERROR,
} from "./shared";

export function registerUserManagementRoutes(router: Router) {
  router.get("/auth/users", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const allUsers = await db
        .select({
          id: appUsers.id,
          username: appUsers.username,
          name: appUsers.name,
          role: appUsers.role,
          permissions: appUsers.permissions,
          active: appUsers.active,
          createdAt: appUsers.createdAt,
        })
        .from(appUsers);

      return res.json(allUsers.map(toLegacyUserShape));
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.post("/auth/users", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;

      const payload = validateInput(createUserSchema, req.body, CREATE_USER_VALIDATION_MESSAGE);
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const hashed = await bcrypt.hash(payload.password, 10);
      const result = await db.insert(appUsers).values({
        username: payload.username,
        password: hashed,
        name: payload.name || payload.fullName || payload.username,
        role: payload.role || "user",
        permissions: payload.permissions || [],
      });

      return res.json({
        id: Number(result[0].insertId),
        message: "تم إنشاء المستخدم",
      });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.put("/auth/users/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const userId = assertPositiveIntegerParam(req.params.id, USER_ID_LABEL);
      const payload = validateInput(updateUserSchema, req.body, UPDATE_USER_VALIDATION_MESSAGE);
      const updates: Record<string, unknown> = {};

      if (payload.name || payload.fullName) updates.name = payload.name || payload.fullName;
      if (payload.username) updates.username = payload.username;
      if (payload.role || payload.Role) updates.role = payload.role || payload.Role;
      if (payload.permissions !== undefined) updates.permissions = payload.permissions;

      const active = normalizeActiveFlag(payload.active);
      if (active !== undefined) updates.active = active;

      const legacyActive = normalizeActiveFlag(payload.IsActive);
      if (legacyActive !== undefined) updates.active = legacyActive;

      if (payload.password) updates.password = await bcrypt.hash(payload.password, 10);

      await db.update(appUsers).set(updates).where(eq(appUsers.id, userId));
      return res.json({ message: "تم تحديث المستخدم" });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.delete("/auth/users/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const userId = assertPositiveIntegerParam(req.params.id, USER_ID_LABEL);
      await db.delete(appUsers).where(eq(appUsers.id, userId));
      return res.json({ message: "تم حذف المستخدم" });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  const resetPasswordHandler = async (req: AuthRequest, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const userId = assertPositiveIntegerParam(req.params.id, USER_ID_LABEL);
      const payload = validateInput(resetPasswordSchema, req.body, RESET_PASSWORD_VALIDATION_MESSAGE);
      const nextPassword = String(payload.newPassword || payload.password || "").trim();
      const hashed = await bcrypt.hash(nextPassword, 10);

      await db.update(appUsers).set({ password: hashed }).where(eq(appUsers.id, userId));
      return res.json({ message: "تمت إعادة تعيين كلمة المرور" });
    } catch (error) {
      return respondRouteError(res, error);
    }
  };

  router.post("/auth/users/:id/reset-password", authMiddleware, passwordRateLimit, resetPasswordHandler);
  router.put("/auth/users/:id/reset-password", authMiddleware, passwordRateLimit, resetPasswordHandler);

  router.get("/auth/users/:id/permissions", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const userId = assertPositiveIntegerParam(req.params.id, USER_ID_LABEL);
      if (!isAdminUser(req) && req.appUser?.id !== userId) {
        return res.status(403).json({ error: FORBIDDEN_ERROR });
      }

      const [user] = await db
        .select({ permissions: appUsers.permissions })
        .from(appUsers)
        .where(eq(appUsers.id, userId))
        .limit(1);
      return res.json(user?.permissions || []);
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.put("/auth/users/:id/permissions", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const userId = assertPositiveIntegerParam(req.params.id, USER_ID_LABEL);
      const payload = validateInput(permissionsPayloadSchema, req.body, PERMISSIONS_VALIDATION_MESSAGE);
      await db
        .update(appUsers)
        .set({ permissions: normalizePermissionsPayload(payload) })
        .where(eq(appUsers.id, userId));
      return res.json({ message: "تم تحديث الصلاحيات" });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

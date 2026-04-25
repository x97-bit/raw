import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { appUsers } from "../../../drizzle/schema";
import { getDb } from "../../db/db";
import { adminProcedure, protectedProcedure, router } from "../../_core/trpc";
import {
  createUserSchema,
  normalizeActiveFlag,
  normalizePermissionsPayload,
  permissionsPayloadSchema,
  resetPasswordSchema,
  toLegacyUserShape,
  updateUserSchema,
} from "./shared";

export const usersRouter = router({
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });

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

    return allUsers.map(toLegacyUserShape);
  }),

  create: adminProcedure.input(createUserSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });

    const hashed = await bcrypt.hash(input.password, 10);
    const result = await db.insert(appUsers).values({
      username: input.username,
      password: hashed,
      name: input.name || input.fullName || input.username,
      role: input.role || "user",
      permissions: input.permissions || [],
    });

    return {
      id: Number(result[0].insertId),
      message: "تم إنشاء المستخدم",
    };
  }),

  update: adminProcedure
    .input(z.object({ id: z.number() }).merge(updateUserSchema))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const updates: Record<string, unknown> = {};

      if (input.name || input.fullName)
        updates.name = input.name || input.fullName;
      if (input.username) updates.username = input.username;
      if (input.role || input.Role) updates.role = input.role || input.Role;
      if (input.permissions !== undefined)
        updates.permissions = input.permissions;

      const active = normalizeActiveFlag(input.active);
      if (active !== undefined) updates.active = active;

      const legacyActive = normalizeActiveFlag(input.IsActive);
      if (legacyActive !== undefined) updates.active = legacyActive;

      if (input.password)
        updates.password = await bcrypt.hash(input.password, 10);

      await db.update(appUsers).set(updates).where(eq(appUsers.id, input.id));
      return { message: "تم تحديث المستخدم" };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      await db.delete(appUsers).where(eq(appUsers.id, input.id));
      return { message: "تم حذف المستخدم" };
    }),

  resetPassword: adminProcedure
    .input(z.object({ id: z.number() }).merge(resetPasswordSchema))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const nextPassword = String(
        input.newPassword || input.password || ""
      ).trim();
      const hashed = await bcrypt.hash(nextPassword, 10);

      await db
        .update(appUsers)
        .set({ password: hashed })
        .where(eq(appUsers.id, input.id));
      return { message: "تمت إعادة تعيين كلمة المرور" };
    }),

  getPermissions: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      if (ctx.user.role !== "admin" && ctx.user.id !== input.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" });
      }

      const [user] = await db
        .select({ permissions: appUsers.permissions })
        .from(appUsers)
        .where(eq(appUsers.id, input.id))
        .limit(1);

      return user?.permissions || [];
    }),

  updatePermissions: adminProcedure
    .input(z.object({ id: z.number(), permissions: permissionsPayloadSchema }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      await db
        .update(appUsers)
        .set({ permissions: normalizePermissionsPayload(input.permissions) })
        .where(eq(appUsers.id, input.id));

      return { message: "تم تحديث الصلاحيات" };
    }),
});

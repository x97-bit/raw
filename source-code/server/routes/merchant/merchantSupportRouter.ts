import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../../db/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { router } from "../../_core/trpc";
import { merchantProcedure } from "./merchantRouter";
import { merchantNotifications } from "../../../drizzle/schema";

export const merchantSupportRouter = router({
  // ==================== NOTIFICATIONS ====================

  // Get notifications
  getNotifications: merchantProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).optional().default(20),
        offset: z.number().int().min(0).optional().default(0),
        unreadOnly: z.boolean().optional().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }
      const conditions = [eq(merchantNotifications.merchantUserId, ctx.merchantUser.id)];
      if (input.unreadOnly) {
        conditions.push(eq(merchantNotifications.isRead, 0));
      }
      const notifications = await db
        .select()
        .from(merchantNotifications)
        .where(and(...conditions))
        .orderBy(desc(merchantNotifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      return { notifications };
    }),

  // Get unread count
  getNotificationCount: merchantProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    }
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(merchantNotifications)
      .where(
        and(
          eq(merchantNotifications.merchantUserId, ctx.merchantUser.id),
          eq(merchantNotifications.isRead, 0)
        )
      );
    return { unreadCount: result[0]?.count || 0 };
  }),

  // Mark notification as read
  markNotificationRead: merchantProcedure
    .input(z.object({ notificationId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }
      await db
        .update(merchantNotifications)
        .set({ isRead: 1 })
        .where(
          and(
            eq(merchantNotifications.id, input.notificationId),
            eq(merchantNotifications.merchantUserId, ctx.merchantUser.id)
          )
        );
      return { success: true };
    }),

  // Mark all notifications as read
  markAllNotificationsRead: merchantProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    }
    await db
      .update(merchantNotifications)
      .set({ isRead: 1 })
      .where(eq(merchantNotifications.merchantUserId, ctx.merchantUser.id));
    return { success: true };
  }),
});

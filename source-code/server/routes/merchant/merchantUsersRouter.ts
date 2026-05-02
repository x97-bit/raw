import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { eq, desc, sql, and, gte, lte, count } from "drizzle-orm";
import { z } from "zod";
import { merchantUsers, accounts, merchantLoginLog, transactions } from "../../../drizzle/schema";
import { getDb } from "../../db/db";
import { adminProcedure, router } from "../../_core/trpc";
import { resetPasswordSchema } from "../auth-users/shared";

export const merchantUsersRouter = router({
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });

    const users = await db
      .select({
        id: merchantUsers.id,
        username: merchantUsers.username,
        fullName: merchantUsers.fullName,
        accountId: merchantUsers.accountId,
        active: merchantUsers.active,
        createdAt: merchantUsers.createdAt,
      })
      .from(merchantUsers);

    // Get last login for each user
    const loginData = await db
      .select({
        merchantUserId: merchantLoginLog.merchantUserId,
        lastLogin: sql<string>`MAX(${merchantLoginLog.createdAt})`,
        totalLogins: sql<number>`COUNT(CASE WHEN ${merchantLoginLog.status} = 'success' THEN 1 END)`,
        failedLogins: sql<number>`COUNT(CASE WHEN ${merchantLoginLog.status} = 'failed' THEN 1 END)`,
      })
      .from(merchantLoginLog)
      .groupBy(merchantLoginLog.merchantUserId);

    const loginMap = new Map(loginData.map(l => [l.merchantUserId, l]));

    return users.map(user => {
      const log = loginMap.get(user.id);
      return {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        accountId: user.accountId,
        active: user.active === 1,
        createdAt: user.createdAt,
        lastLogin: log?.lastLogin || null,
        totalLogins: Number(log?.totalLogins || 0),
        failedLogins: Number(log?.failedLogins || 0),
      };
    });
  }),

  getAccounts: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });

    const allAccounts = await db
      .select({ id: accounts.id, name: accounts.name, type: accounts.accountType })
      .from(accounts);
    return allAccounts;
  }),

  // Toggle active/inactive quickly
  toggleActive: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const [user] = await db
        .select({ active: merchantUsers.active })
        .from(merchantUsers)
        .where(eq(merchantUsers.id, input.id))
        .limit(1);

      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "التاجر غير موجود" });

      const newActive = user.active === 1 ? 0 : 1;
      await db
        .update(merchantUsers)
        .set({ active: newActive })
        .where(eq(merchantUsers.id, input.id));

      return {
        active: newActive === 1,
        message: newActive === 1 ? "تم تفعيل التاجر" : "تم تعطيل التاجر",
      };
    }),

  // Get login log for a specific merchant
  getLoginLog: adminProcedure
    .input(
      z.object({
        merchantUserId: z.number(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const logs = await db
        .select({
          id: merchantLoginLog.id,
          ipAddress: merchantLoginLog.ipAddress,
          userAgent: merchantLoginLog.userAgent,
          status: merchantLoginLog.status,
          createdAt: merchantLoginLog.createdAt,
        })
        .from(merchantLoginLog)
        .where(eq(merchantLoginLog.merchantUserId, input.merchantUserId))
        .orderBy(desc(merchantLoginLog.createdAt))
        .limit(input.limit);

      return logs;
    }),

  // Get usage stats for a specific merchant
  getMerchantStats: adminProcedure
    .input(z.object({ merchantUserId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      // Get merchant info
      const [merchant] = await db
        .select()
        .from(merchantUsers)
        .where(eq(merchantUsers.id, input.merchantUserId))
        .limit(1);

      if (!merchant)
        throw new TRPCError({ code: "NOT_FOUND", message: "التاجر غير موجود" });

      // Get login stats
      const [loginStats] = await db
        .select({
          totalLogins: sql<number>`COUNT(CASE WHEN ${merchantLoginLog.status} = 'success' THEN 1 END)`,
          failedLogins: sql<number>`COUNT(CASE WHEN ${merchantLoginLog.status} = 'failed' THEN 1 END)`,
          lastLogin: sql<string>`MAX(CASE WHEN ${merchantLoginLog.status} = 'success' THEN ${merchantLoginLog.createdAt} END)`,
          lastFailedLogin: sql<string>`MAX(CASE WHEN ${merchantLoginLog.status} = 'failed' THEN ${merchantLoginLog.createdAt} END)`,
        })
        .from(merchantLoginLog)
        .where(eq(merchantLoginLog.merchantUserId, input.merchantUserId));

      // Get last 7 days login count
      const [recentLogins] = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(merchantLoginLog)
        .where(
          and(
            eq(merchantLoginLog.merchantUserId, input.merchantUserId),
            eq(merchantLoginLog.status, "success"),
            gte(merchantLoginLog.createdAt, sql`DATE_SUB(NOW(), INTERVAL 7 DAY)`)
          )
        );

      // Get transaction stats if merchant has an account
      let transactionStats = { totalTransactions: 0, totalInvoicesUSD: 0, totalPaymentsUSD: 0 };
      if (merchant.accountId) {
        const [txStats] = await db
          .select({
            totalTransactions: sql<number>`COUNT(*)`,
            totalInvoicesUSD: sql<number>`COALESCE(SUM(CASE WHEN UPPER(direction) IN ('IN','DR') THEN ABS(COALESCE(amount_usd, 0)) ELSE 0 END), 0)`,
            totalPaymentsUSD: sql<number>`COALESCE(SUM(CASE WHEN UPPER(direction) IN ('OUT','CR') THEN ABS(COALESCE(amount_usd, 0)) ELSE 0 END), 0)`,
          })
          .from(transactions)
          .where(eq(transactions.accountId, merchant.accountId));

        if (txStats) {
          transactionStats = {
            totalTransactions: Number(txStats.totalTransactions || 0),
            totalInvoicesUSD: Number(txStats.totalInvoicesUSD || 0),
            totalPaymentsUSD: Number(txStats.totalPaymentsUSD || 0),
          };
        }
      }

      return {
        merchantId: merchant.id,
        fullName: merchant.fullName,
        username: merchant.username,
        active: merchant.active === 1,
        createdAt: merchant.createdAt,
        loginStats: {
          totalLogins: Number(loginStats?.totalLogins || 0),
          failedLogins: Number(loginStats?.failedLogins || 0),
          lastLogin: loginStats?.lastLogin || null,
          lastFailedLogin: loginStats?.lastFailedLogin || null,
          loginsLast7Days: Number(recentLogins?.count || 0),
        },
        transactionStats,
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        username: z.string().trim().min(1).max(64),
        password: z.string().min(6).max(128),
        fullName: z.string().trim().min(1).max(255),
        accountId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const hashed = await bcrypt.hash(input.password, 10);
      const result = await db.insert(merchantUsers).values({
        username: input.username,
        password: hashed,
        fullName: input.fullName,
        accountId: input.accountId,
        active: 1,
      });

      return {
        id: Number(result[0].insertId),
        message: "تم إنشاء حساب التاجر بنجاح",
      };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        username: z.string().trim().min(1).max(64).optional(),
        fullName: z.string().trim().min(1).max(255).optional(),
        accountId: z.number().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const updates: Record<string, unknown> = {};

      if (input.username) updates.username = input.username;
      if (input.fullName) updates.fullName = input.fullName;
      if (input.accountId !== undefined) updates.accountId = input.accountId;
      if (input.active !== undefined) updates.active = input.active ? 1 : 0;

      await db.update(merchantUsers).set(updates).where(eq(merchantUsers.id, input.id));
      return { message: "تم تحديث التاجر" };
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
        .update(merchantUsers)
        .set({ password: hashed })
        .where(eq(merchantUsers.id, input.id));
      return { message: "تمت إعادة تعيين كلمة المرور بنجاح" };
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

      // Delete login logs first
      await db.delete(merchantLoginLog).where(eq(merchantLoginLog.merchantUserId, input.id));
      await db.delete(merchantUsers).where(eq(merchantUsers.id, input.id));
      return { message: "تم حذف التاجر" };
    }),
});

import { TRPCError } from "@trpc/server";
import { eq, asc, and, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../db/db";
import { transactions, accounts, expenses } from "../../../drizzle/schema";
import { router, publicProcedure } from "../../_core/trpc";
import { extractBearerToken, verifyToken } from "../../_core/appAuth";
import { loadAuthenticatedMerchantUser } from "./merchantAuth";

import { enrichTransactions } from "../../utils/transactionEnrichment";
import { addRunningBalances, calculateTransactionTotals } from "../../utils/transactionSummaries";
import { normalizeExpenseChargeTarget, mapChargedExpenseToStatementRow } from "../../utils/expenses";

// Middleware to ensure the user is an isolated merchant
export const merchantProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.req || !ctx.req.headers) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing request context" });
  }

  const token = extractBearerToken(ctx.req.headers.authorization);
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No token provided" });
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "merchant") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token or role" });
  }

  const merchantUser = await loadAuthenticatedMerchantUser(payload.userId);
  if (!merchantUser) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Merchant user not found or disabled" });
  }

  return next({
    ctx: {
      ...ctx,
      merchantUser,
    },
  });
});

export const merchantRouter = router({
  getStatement: merchantProcedure
    .input(
      z.object({
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        limit: z.number().int().min(1).max(500).optional().default(200),
        offset: z.number().int().min(0).optional().default(0),
        _bust: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // 1. Get account details
      const accountResult = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, ctx.merchantUser.accountId))
        .limit(1);

      if (accountResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account details not found.",
        });
      }
      const accountDetails = accountResult[0];

      // 2. Build date filter conditions for transactions
      let conditions: SQL<unknown>[] = [eq(transactions.accountId, ctx.merchantUser.accountId)];
      let expenseConditions: SQL<unknown>[] = [eq(expenses.accountId, ctx.merchantUser.accountId)];

      if (input.fromDate && input.fromDate.trim() !== "") {
        conditions.push(sql`${transactions.transDate} >= ${input.fromDate}`);
        expenseConditions.push(sql`${expenses.expenseDate} >= ${input.fromDate}`);
      }
      if (input.toDate && input.toDate.trim() !== "") {
        conditions.push(sql`${transactions.transDate} <= ${input.toDate}`);
        expenseConditions.push(sql`${expenses.expenseDate} <= ${input.toDate}`);
      }

      // 3. Fetch filtered transactions (with pagination) and charged expenses in parallel
      const [txns, chargedExpenseRows] = await Promise.all([
        db
          .select()
          .from(transactions)
          .where(and(...conditions))
          .orderBy(asc(transactions.transDate), asc(transactions.id))
          .limit(input.limit)
          .offset(input.offset),
        db
          .select()
          .from(expenses)
          .where(and(...expenseConditions))
          .orderBy(asc(expenses.expenseDate), asc(expenses.id)),
      ]);

      // 4. Compute global totals via a single SQL aggregation — no double-enrichment
      const [globalTxnTotals, globalExpenseTotals] = await Promise.all([
        db
          .select({
            totalInvoicesUSD: sql<string>`COALESCE(SUM(CASE WHEN UPPER(direction) IN ('IN','DR') THEN ABS(COALESCE(amount_usd, 0)) ELSE 0 END), 0)`,
            totalInvoicesIQD: sql<string>`COALESCE(SUM(CASE WHEN UPPER(direction) IN ('IN','DR') THEN ABS(COALESCE(amount_iqd, 0)) ELSE 0 END), 0)`,
            totalPaymentsUSD: sql<string>`COALESCE(SUM(CASE WHEN UPPER(direction) IN ('OUT','CR') THEN ABS(COALESCE(amount_usd, 0)) ELSE 0 END), 0)`,
            totalPaymentsIQD: sql<string>`COALESCE(SUM(CASE WHEN UPPER(direction) IN ('OUT','CR') THEN ABS(COALESCE(amount_iqd, 0)) ELSE 0 END), 0)`,
          })
          .from(transactions)
          .where(eq(transactions.accountId, ctx.merchantUser.accountId)),
        db
          .select({
            totalExpensesUSD: sql<string>`COALESCE(SUM(ABS(COALESCE(amount_usd, 0))), 0)`,
            totalExpensesIQD: sql<string>`COALESCE(SUM(ABS(COALESCE(amount_iqd, 0))), 0)`,
          })
          .from(expenses)
          .where(
            and(
              eq(expenses.accountId, ctx.merchantUser.accountId),
              sql`LOWER(COALESCE(charge_target,'')) = 'trader'`
            )
          ),
      ]);

      const enrichedTxns = await enrichTransactions(db, txns);

      const chargedExpenseStatements = chargedExpenseRows
        .filter(expense => normalizeExpenseChargeTarget(expense.chargeTarget) === "trader")
        .map(expense => mapChargedExpenseToStatementRow(expense, accountDetails.name));

      const combinedRows = [
        ...enrichedTxns,
        ...chargedExpenseStatements,
      ].sort((left, right) => {
        const leftDate = String(left.TransDate || "");
        const rightDate = String(right.TransDate || "");
        if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
        return Number(left.TransID || 0) - Number(right.TransID || 0);
      });

      const statementRows = addRunningBalances(combinedRows);
      const totalsObj = calculateTransactionTotals(combinedRows);

      // Global totals from SQL aggregation (no double-enrichment)
      const gt = globalTxnTotals[0];
      const ge = globalExpenseTotals[0];
      const globalTotalsObj = {
        totalInvoicesUSD: Number(gt?.totalInvoicesUSD ?? 0),
        totalInvoicesIQD: Number(gt?.totalInvoicesIQD ?? 0),
        totalPaymentsUSD: Number(gt?.totalPaymentsUSD ?? 0),
        totalPaymentsIQD: Number(gt?.totalPaymentsIQD ?? 0),
        totalExpensesUSD: Number(ge?.totalExpensesUSD ?? 0),
        totalExpensesIQD: Number(ge?.totalExpensesIQD ?? 0),
        balanceUSD: Number(gt?.totalInvoicesUSD ?? 0) - Number(gt?.totalPaymentsUSD ?? 0) - Number(ge?.totalExpensesUSD ?? 0),
        balanceIQD: Number(gt?.totalInvoicesIQD ?? 0) - Number(gt?.totalPaymentsIQD ?? 0) - Number(ge?.totalExpensesIQD ?? 0),
      };

      // Return desc order for the UI
      statementRows.reverse();

      return {
        accountName: accountDetails.name,
        transactions: statementRows,
        totals: totalsObj,
        globalTotals: globalTotalsObj,
        pagination: {
          limit: input.limit,
          offset: input.offset,
          hasMore: txns.length === input.limit,
        },
      };
    }),
});

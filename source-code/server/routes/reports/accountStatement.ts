import { Router, Response } from "express";
import { and, asc, eq, sql, type SQL } from "drizzle-orm";
import { accounts, expenses, transactions } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db/db";
import { mapAccount } from "../../utils/accountMappings";
import {
  mapChargedExpenseToStatementRow,
  normalizeExpenseChargeTarget,
} from "../../utils/expenses";
import {
  enrichTransactions,
  type EnrichedTransactionRecord,
} from "../../utils/transactionEnrichment";
import {
  addRunningBalances,
  calculateTransactionTotals,
} from "../../utils/transactionSummaries";
import { financialReportsCache, buildRequestCacheKey } from "../../_core/redisCache";

type AccountStatementRow = EnrichedTransactionRecord & {
  runningUSD: number;
  runningIQD: number;
};

function readQueryString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    const [firstValue] = value;
    return typeof firstValue === "string"
      ? readQueryString(firstValue)
      : undefined;
  }

  return undefined;
}

export function registerReportAccountStatementRoutes(router: Router) {
  router.get(
    "/reports/account-statement/:id",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const accountId = parseInt(req.params.id, 10);
        const { startDate, endDate, portId, accountType, by } = req.query;
        const requestedPortId = readQueryString(portId);
        const requestedAccountType = readQueryString(accountType);
        const requestedStartDate = readQueryString(startDate);
        const requestedEndDate = readQueryString(endDate);
        const statementBy = readQueryString(by);
        const isCarrierStatement = statementBy === "carrier";

        // ── Build cache key from all parameters ──
        const cacheKey = buildRequestCacheKey(
          `/reports/account-statement/${accountId}`,
          req.query as Record<string, unknown>
        );

        const { hit, value } = await financialReportsCache.getOrLoad(
          cacheKey,
          async () => {
            // ── Filtered conditions (date-bounded) ──
            const conditions: SQL<unknown>[] = [
              isCarrierStatement
                ? eq(transactions.carrierId, accountId)
                : eq(transactions.accountId, accountId),
            ];
            if (requestedPortId)
              conditions.push(eq(transactions.portId, requestedPortId));
            if (requestedAccountType)
              conditions.push(eq(transactions.accountType, requestedAccountType));
            if (requestedStartDate)
              conditions.push(
                sql`${transactions.transDate} >= ${requestedStartDate}`
              );
            if (requestedEndDate)
              conditions.push(
                sql`${transactions.transDate} <= ${requestedEndDate}`
              );

            // ── Global conditions (no date filter) ──
            const globalConditions: SQL<unknown>[] = [
              isCarrierStatement
                ? eq(transactions.carrierId, accountId)
                : eq(transactions.accountId, accountId),
            ];
            if (requestedPortId)
              globalConditions.push(eq(transactions.portId, requestedPortId));
            if (requestedAccountType)
              globalConditions.push(eq(transactions.accountType, requestedAccountType));

            // ── Expense conditions ──
            const expenseConditions: SQL<unknown>[] = [
              eq(expenses.accountId, accountId),
            ];
            if (requestedPortId)
              expenseConditions.push(eq(expenses.portId, requestedPortId));
            if (requestedStartDate)
              expenseConditions.push(
                sql`${expenses.expenseDate} >= ${requestedStartDate}`
              );
            if (requestedEndDate)
              expenseConditions.push(
                sql`${expenses.expenseDate} <= ${requestedEndDate}`
              );

            const globalExpenseConditions: SQL<unknown>[] = [
              eq(expenses.accountId, accountId),
            ];
            if (requestedPortId)
              globalExpenseConditions.push(eq(expenses.portId, requestedPortId));

            const hasDateFilter = !!(requestedStartDate || requestedEndDate);

            // ── Execute ALL queries in parallel ──
            const [
              account,
              rows,
              chargedExpenseRows,
              globalRows,
              globalExpenseRows,
            ] = await Promise.all([
              // 1. Account info
              db
                .select()
                .from(accounts)
                .where(eq(accounts.id, accountId))
                .limit(1)
                .then(r => r[0] || null),

              // 2. Filtered transactions
              db
                .select()
                .from(transactions)
                .where(and(...conditions))
                .orderBy(asc(transactions.transDate), asc(transactions.id)),

              // 3. Filtered expenses (skip for carrier)
              isCarrierStatement
                ? Promise.resolve([])
                : db
                    .select()
                    .from(expenses)
                    .where(and(...expenseConditions))
                    .orderBy(asc(expenses.expenseDate), asc(expenses.id)),

              // 4. Global transactions (only if date filter exists, otherwise reuse filtered)
              hasDateFilter
                ? db
                    .select()
                    .from(transactions)
                    .where(and(...globalConditions))
                : Promise.resolve(null), // null = reuse filtered rows

              // 5. Global expenses (only if date filter exists)
              isCarrierStatement
                ? Promise.resolve([])
                : hasDateFilter
                  ? db
                      .select()
                      .from(expenses)
                      .where(and(...globalExpenseConditions))
                  : Promise.resolve(null), // null = reuse filtered expenses
            ]);

            // ── Enrich transactions in parallel ──
            const actualGlobalRows = globalRows ?? rows;
            const actualGlobalExpenseRows = globalExpenseRows ?? chargedExpenseRows;

            // If no date filter, globalRows === rows, so enrich once
            const needsSeparateGlobalEnrichment = hasDateFilter && globalRows !== null;

            const [enrichedRows, enrichedGlobalRows] = await Promise.all([
              enrichTransactions(db, rows),
              needsSeparateGlobalEnrichment
                ? enrichTransactions(db, actualGlobalRows)
                : Promise.resolve(null), // will reuse enrichedRows
            ]);

            const finalEnrichedGlobalRows = enrichedGlobalRows ?? enrichedRows;

            // ── Process filtered results ──
            const chargedExpenseStatements = chargedExpenseRows
              .filter(
                expense =>
                  normalizeExpenseChargeTarget(expense.chargeTarget) === "trader"
              )
              .map(expense =>
                mapChargedExpenseToStatementRow(expense, account?.name || "")
              );

            const combinedRows = [
              ...enrichedRows,
              ...chargedExpenseStatements,
            ].sort((left, right) => {
              const leftDate = String(left.TransDate || "");
              const rightDate = String(right.TransDate || "");
              if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
              return Number(left.TransID || 0) - Number(right.TransID || 0);
            });

            const totals = calculateTransactionTotals(combinedRows);
            const statementRows: AccountStatementRow[] = addRunningBalances(
              combinedRows
            ).map(transaction => ({
              ...transaction,
              AccountName: account?.name || transaction.AccountName,
            }));

            // ── Process global results ──
            const globalChargedExpenseStatements = actualGlobalExpenseRows
              .filter(
                expense =>
                  normalizeExpenseChargeTarget(expense.chargeTarget) === "trader"
              )
              .map(expense =>
                mapChargedExpenseToStatementRow(expense, account?.name || "")
              );

            const globalCombinedRows = [
              ...finalEnrichedGlobalRows,
              ...globalChargedExpenseStatements,
            ];
            const globalTotals = calculateTransactionTotals(globalCombinedRows);

            return {
              account: account ? mapAccount(account) : null,
              transactions: statementRows,
              statement: statementRows,
              shipmentCount: totals.shipmentCount,
              totals,
              globalTotals,
            };
          }
        );

        // Set cache headers
        res.setHeader("X-Cache", hit ? "HIT" : "MISS");
        res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
        return res.json(value);
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

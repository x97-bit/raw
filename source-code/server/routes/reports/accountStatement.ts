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

        const rows = await db
          .select()
          .from(transactions)
          .where(and(...conditions))
          .orderBy(asc(transactions.transDate), asc(transactions.id));
        const [account] = await db
          .select()
          .from(accounts)
          .where(eq(accounts.id, accountId))
          .limit(1);
        const chargedExpenseRows = isCarrierStatement
          ? []
          : await (async () => {
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
              return db
                .select()
                .from(expenses)
                .where(and(...expenseConditions))
                .orderBy(asc(expenses.expenseDate), asc(expenses.id));
            })();
        const enrichedRows = await enrichTransactions(db, rows);
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

        return res.json({
          account: account ? mapAccount(account) : null,
          transactions: statementRows,
          statement: statementRows,
          shipmentCount: totals.shipmentCount,
          totals,
        });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

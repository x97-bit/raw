import { Router, Response } from "express";
import { and, eq, sql, type SQL } from "drizzle-orm";
import { accountTypes, accounts, transactions } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db";
import { calculateTransactionTotals } from "../../utils/transactionSummaries";

type AccountRow = typeof accounts.$inferSelect;
type AccountTypeRow = typeof accountTypes.$inferSelect;
type TransactionRow = typeof transactions.$inferSelect;

type TrialBalanceRow = {
  AccountID: number;
  AccountName: string;
  AccountType: string;
  AccountTypeName: string;
  opening_usd: number;
  opening_iqd: number;
  debit_usd: number;
  debit_iqd: number;
  credit_usd: number;
  credit_iqd: number;
  balance_usd: number;
  balance_iqd: number;
  profit_usd: number;
  profit_iqd: number;
  cost_usd: number;
  cost_iqd: number;
  shipment_count: number;
  trans_count: number;
};

type TrialBalanceNumericKey =
  | "opening_usd"
  | "opening_iqd"
  | "debit_usd"
  | "debit_iqd"
  | "credit_usd"
  | "credit_iqd"
  | "balance_usd"
  | "balance_iqd"
  | "profit_usd"
  | "profit_iqd"
  | "cost_usd"
  | "cost_iqd"
  | "shipment_count"
  | "trans_count";

function readQueryString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    const [firstValue] = value;
    return typeof firstValue === "string" ? readQueryString(firstValue) : undefined;
  }

  return undefined;
}

function sumTrialBalanceField(rows: TrialBalanceRow[], field: TrialBalanceNumericKey): number {
  return rows.reduce((sum, row) => sum + row[field], 0);
}

export function registerReportTrialBalanceRoutes(router: Router) {
  router.get("/reports/trial-balance", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const { startDate, endDate, portId, accountType } = req.query;
      const requestedStartDate = readQueryString(startDate);
      const requestedEndDate = readQueryString(endDate);
      const requestedPortId = readQueryString(portId);
      const requestedAccountType = readQueryString(accountType);
      const allAccounts = await db.select().from(accounts);
      const allAccountTypes = await db.select().from(accountTypes);
      const accountTypeNameMap = new Map(
        allAccountTypes.map((row: AccountTypeRow) => [row.typeId, row.name]),
      );

      const periodConditions: SQL<unknown>[] = [];
      if (requestedStartDate) periodConditions.push(sql`${transactions.transDate} >= ${requestedStartDate}`);
      if (requestedEndDate) periodConditions.push(sql`${transactions.transDate} <= ${requestedEndDate}`);
      if (requestedPortId) periodConditions.push(eq(transactions.portId, requestedPortId));
      if (requestedAccountType) periodConditions.push(eq(transactions.accountType, requestedAccountType));

      const accountScopeConditions: SQL<unknown>[] = [];
      if (requestedPortId) accountScopeConditions.push(eq(transactions.portId, requestedPortId));
      if (requestedAccountType) accountScopeConditions.push(eq(transactions.accountType, requestedAccountType));

      const allTransactionsQuery = accountScopeConditions.length > 0
        ? db.select().from(transactions).where(and(...accountScopeConditions))
        : db.select().from(transactions);
      const allTransactions = await allTransactionsQuery;

      const periodTransactionsQuery = periodConditions.length > 0
        ? db.select().from(transactions).where(and(...periodConditions))
        : db.select().from(transactions);
      const periodTransactions = await periodTransactionsQuery;

      const rows = allAccounts
        .map((account: AccountRow): TrialBalanceRow | null => {
          const accountPeriodTransactions = periodTransactions.filter(
            (transaction: TransactionRow) => transaction.accountId === account.id,
          );
          const accountAllTransactions = allTransactions.filter(
            (transaction: TransactionRow) => transaction.accountId === account.id,
          );

          if (accountAllTransactions.length === 0) return null;

          const priorTransactions = requestedStartDate
            ? accountAllTransactions.filter(
                (transaction: TransactionRow) =>
                  Boolean(transaction.transDate) && transaction.transDate < requestedStartDate,
              )
            : [];

          const openingTotals = calculateTransactionTotals(priorTransactions);
          const periodTotals = calculateTransactionTotals(accountPeriodTransactions);
          const openingBalanceUSD = openingTotals.balanceUSD;
          const openingBalanceIQD = openingTotals.balanceIQD;
          const debitUSD = periodTotals.totalInvoicesUSD;
          const debitIQD = periodTotals.totalInvoicesIQD;
          const creditUSD = periodTotals.totalPaymentsUSD;
          const creditIQD = periodTotals.totalPaymentsIQD;
          const closingBalanceUSD = openingBalanceUSD + debitUSD - creditUSD;
          const closingBalanceIQD = openingBalanceIQD + debitIQD - creditIQD;
          const costUSD = periodTotals.totalCostUSD;
          const costIQD = periodTotals.totalCostIQD;
          const profitUSD = periodTotals.totalProfitUSD;
          const profitIQD = periodTotals.totalProfitIQD;
          const shipmentCount = periodTotals.shipmentCount;

          if (accountPeriodTransactions.length === 0 && openingBalanceUSD === 0 && openingBalanceIQD === 0) return null;

          return {
            AccountID: account.id,
            AccountName: account.name,
            AccountType: account.accountType,
            AccountTypeName: accountTypeNameMap.get(account.accountType) || account.accountType,
            opening_usd: openingBalanceUSD,
            opening_iqd: openingBalanceIQD,
            debit_usd: debitUSD,
            debit_iqd: debitIQD,
            credit_usd: creditUSD,
            credit_iqd: creditIQD,
            balance_usd: closingBalanceUSD,
            balance_iqd: closingBalanceIQD,
            profit_usd: profitUSD,
            profit_iqd: profitIQD,
            cost_usd: costUSD,
            cost_iqd: costIQD,
            shipment_count: shipmentCount,
            trans_count: accountPeriodTransactions.length,
          };
        })
        .filter((row): row is TrialBalanceRow => row !== null);

      const totals = {
        account_count: rows.length,
        opening_usd: sumTrialBalanceField(rows, "opening_usd"),
        opening_iqd: sumTrialBalanceField(rows, "opening_iqd"),
        debit_usd: sumTrialBalanceField(rows, "debit_usd"),
        debit_iqd: sumTrialBalanceField(rows, "debit_iqd"),
        credit_usd: sumTrialBalanceField(rows, "credit_usd"),
        credit_iqd: sumTrialBalanceField(rows, "credit_iqd"),
        balance_usd: sumTrialBalanceField(rows, "balance_usd"),
        balance_iqd: sumTrialBalanceField(rows, "balance_iqd"),
        profit_usd: sumTrialBalanceField(rows, "profit_usd"),
        profit_iqd: sumTrialBalanceField(rows, "profit_iqd"),
        cost_usd: sumTrialBalanceField(rows, "cost_usd"),
        cost_iqd: sumTrialBalanceField(rows, "cost_iqd"),
        shipment_count: sumTrialBalanceField(rows, "shipment_count"),
        trans_count: sumTrialBalanceField(rows, "trans_count"),
      };

      return res.json({ rows, totals });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

import { Router, Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import { accountTypes, accounts, transactions } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { calculateTransactionTotals } from "../../utils/transactionSummaries";

export function registerReportTrialBalanceRoutes(router: Router) {
  router.get("/reports/trial-balance", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const { startDate, endDate, portId, accountType } = req.query;
      const allAccounts = await db.select().from(accounts);
      const allAccountTypes = await db.select().from(accountTypes);
      const accountTypeNameMap = new Map(allAccountTypes.map((row: any) => [row.typeId, row.name]));

      const periodConditions: any[] = [];
      if (startDate) periodConditions.push(sql`${transactions.transDate} >= ${startDate}`);
      if (endDate) periodConditions.push(sql`${transactions.transDate} <= ${endDate}`);
      if (portId) periodConditions.push(eq(transactions.portId, String(portId)));
      if (accountType) periodConditions.push(eq(transactions.accountType, String(accountType)));

      const accountScopeConditions: any[] = [];
      if (portId) accountScopeConditions.push(eq(transactions.portId, String(portId)));
      if (accountType) accountScopeConditions.push(eq(transactions.accountType, String(accountType)));

      let allTransactionsQuery = db.select().from(transactions);
      if (accountScopeConditions.length > 0) {
        allTransactionsQuery = allTransactionsQuery.where(and(...accountScopeConditions)) as any;
      }
      const allTransactions = await allTransactionsQuery;

      let periodTransactionsQuery = db.select().from(transactions);
      if (periodConditions.length > 0) {
        periodTransactionsQuery = periodTransactionsQuery.where(and(...periodConditions)) as any;
      }
      const periodTransactions = await periodTransactionsQuery;

      const rows = allAccounts
        .map((account: any) => {
          const accountPeriodTransactions = periodTransactions.filter((transaction: any) => transaction.accountId === account.id);
          const accountAllTransactions = allTransactions.filter((transaction: any) => transaction.accountId === account.id);

          if (accountAllTransactions.length === 0) return null;

          const priorTransactions = startDate
            ? accountAllTransactions.filter((transaction: any) => transaction.transDate && transaction.transDate < String(startDate))
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
        .filter(Boolean);

      const totals = {
        account_count: rows.length,
        opening_usd: rows.reduce((sum: number, row: any) => sum + row.opening_usd, 0),
        opening_iqd: rows.reduce((sum: number, row: any) => sum + row.opening_iqd, 0),
        debit_usd: rows.reduce((sum: number, row: any) => sum + row.debit_usd, 0),
        debit_iqd: rows.reduce((sum: number, row: any) => sum + row.debit_iqd, 0),
        credit_usd: rows.reduce((sum: number, row: any) => sum + row.credit_usd, 0),
        credit_iqd: rows.reduce((sum: number, row: any) => sum + row.credit_iqd, 0),
        balance_usd: rows.reduce((sum: number, row: any) => sum + row.balance_usd, 0),
        balance_iqd: rows.reduce((sum: number, row: any) => sum + row.balance_iqd, 0),
        profit_usd: rows.reduce((sum: number, row: any) => sum + row.profit_usd, 0),
        profit_iqd: rows.reduce((sum: number, row: any) => sum + row.profit_iqd, 0),
        cost_usd: rows.reduce((sum: number, row: any) => sum + row.cost_usd, 0),
        cost_iqd: rows.reduce((sum: number, row: any) => sum + row.cost_iqd, 0),
        shipment_count: rows.reduce((sum: number, row: any) => sum + row.shipment_count, 0),
        trans_count: rows.reduce((sum: number, row: any) => sum + row.trans_count, 0),
      };

      return res.json({ rows, totals });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

import { Router, Response } from "express";
import { desc, sql } from "drizzle-orm";
import { accounts, debts, ports, transactions } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db";
import { enrichTransactions } from "../../utils/transactionEnrichment";
import { calculateTransactionTotals } from "../../utils/transactionSummaries";

type AccountRow = typeof accounts.$inferSelect;
type DebtRow = typeof debts.$inferSelect;
type PortRow = typeof ports.$inferSelect;
type TransactionRow = typeof transactions.$inferSelect;

type PortStatsRow = {
  PortID: string;
  PortName: string;
  transCount: number;
  invoicesUSD: number;
  invoicesIQD: number;
  paymentsUSD: number;
  paymentsIQD: number;
};

type MonthlyTrendRow = {
  month: string;
  invoicesUSD: number;
  paymentsUSD: number;
};

type TopTraderRow = {
  AccountID: number;
  AccountName: string;
  transCount: number;
  balanceUSD: number;
};

function parseStoredAmount(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function registerReportDashboardRoutes(router: Router) {
  router.get("/reports/dashboard", authMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const [{ count: totalAccounts }] = await db.select({ count: sql<number>`count(*)` }).from(accounts);
      const [{ count: totalTransactions }] = await db.select({ count: sql<number>`count(*)` }).from(transactions);
      const allPorts = await db.select().from(ports);
      const allTransactions = await db.select().from(transactions);

      const portStats: PortStatsRow[] = allPorts.map((port: PortRow) => {
        const portTransactions = allTransactions.filter(
          (transaction: TransactionRow) => transaction.portId === port.portId,
        );
        const totals = calculateTransactionTotals(portTransactions);
        return {
          PortID: port.portId,
          PortName: port.name,
          transCount: portTransactions.length,
          invoicesUSD: totals.totalInvoicesUSD,
          invoicesIQD: totals.totalInvoicesIQD,
          paymentsUSD: totals.totalPaymentsUSD,
          paymentsIQD: totals.totalPaymentsIQD,
        };
      });

      const monthlyTrend: MonthlyTrendRow[] = [];
      for (let index = 0; index < 6; index += 1) {
        const current = new Date();
        current.setMonth(current.getMonth() - index);
        const month = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
        const monthTransactions = allTransactions.filter(
          (transaction: TransactionRow) => Boolean(transaction.transDate) && transaction.transDate.startsWith(month),
        );
        const monthTotals = calculateTransactionTotals(monthTransactions);
        monthlyTrend.push({
          month,
          invoicesUSD: monthTotals.totalInvoicesUSD,
          paymentsUSD: monthTotals.totalPaymentsUSD,
        });
      }

      const allDebts = await db.select().from(debts);
      const totalDebts = {
        totalUSD: allDebts.reduce((sum, debt: DebtRow) => sum + parseStoredAmount(debt.amountUSD), 0),
        totalIQD: allDebts.reduce((sum, debt: DebtRow) => sum + parseStoredAmount(debt.amountIQD), 0),
      };

      const recentTransactions = await db.select().from(transactions).orderBy(desc(transactions.id)).limit(10);
      const enrichedRecentTransactions = await enrichTransactions(db, recentTransactions);
      const allAccounts = await db.select().from(accounts);

      const topTraders: TopTraderRow[] = allAccounts
        .map((account: AccountRow) => {
          const accountTransactions = allTransactions.filter(
            (transaction: TransactionRow) => transaction.accountId === account.id,
          );
          const totals = calculateTransactionTotals(accountTransactions);
          return {
            AccountID: account.id,
            AccountName: account.name,
            transCount: accountTransactions.length,
            balanceUSD: totals.balanceUSD,
          };
        })
        .sort((left, right) => Math.abs(right.balanceUSD) - Math.abs(left.balanceUSD))
        .slice(0, 10);

      return res.json({
        totalAccounts: Number(totalAccounts),
        totalTransactions: Number(totalTransactions),
        portStats,
        monthlyTrend,
        totalDebts,
        recentTransactions: enrichedRecentTransactions,
        topTraders,
      });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

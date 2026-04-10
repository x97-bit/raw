import { Router, Response } from "express";
import { desc, sql } from "drizzle-orm";
import { accounts, debts, ports, transactions } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { enrichTransactions } from "../../utils/transactionEnrichment";
import { calculateTransactionTotals } from "../../utils/transactionSummaries";

export function registerReportDashboardRoutes(router: Router) {
  router.get("/reports/dashboard", authMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const [{ count: totalAccounts }] = await db.select({ count: sql<number>`count(*)` }).from(accounts);
      const [{ count: totalTransactions }] = await db.select({ count: sql<number>`count(*)` }).from(transactions);
      const allPorts = await db.select().from(ports);
      const allTransactions = await db.select().from(transactions);

      const portStats = allPorts.map((port: any) => {
        const portTransactions = allTransactions.filter((transaction: any) => transaction.portId === port.portId);
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

      const monthlyTrend: any[] = [];
      for (let index = 0; index < 6; index += 1) {
        const current = new Date();
        current.setMonth(current.getMonth() - index);
        const month = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
        const monthTransactions = allTransactions.filter((transaction: any) => transaction.transDate?.startsWith(month));
        const monthTotals = calculateTransactionTotals(monthTransactions);
        monthlyTrend.push({
          month,
          invoicesUSD: monthTotals.totalInvoicesUSD,
          paymentsUSD: monthTotals.totalPaymentsUSD,
        });
      }

      const allDebts = await db.select().from(debts);
      const totalDebts = {
        totalUSD: allDebts.reduce((sum: number, debt: any) => sum + parseFloat(debt.amountUSD || "0"), 0),
        totalIQD: allDebts.reduce((sum: number, debt: any) => sum + parseFloat(debt.amountIQD || "0"), 0),
      };

      const recentTransactions = await db.select().from(transactions).orderBy(desc(transactions.id)).limit(10);
      const enrichedRecentTransactions = await enrichTransactions(db, recentTransactions);
      const allAccounts = await db.select().from(accounts);

      const topTraders = allAccounts
        .map((account: any) => {
          const accountTransactions = allTransactions.filter((transaction: any) => transaction.accountId === account.id);
          const totals = calculateTransactionTotals(accountTransactions);
          return {
            AccountID: account.id,
            AccountName: account.name,
            transCount: accountTransactions.length,
            balanceUSD: totals.balanceUSD,
          };
        })
        .sort((left: any, right: any) => Math.abs(right.balanceUSD) - Math.abs(left.balanceUSD))
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
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

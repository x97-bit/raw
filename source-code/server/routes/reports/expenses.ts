import { Router, Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { transactions } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { enrichTransactions } from "../../utils/transactionEnrichment";
import { calculateTransactionTotals } from "../../utils/transactionSummaries";

export function registerReportExpenseRoutes(router: Router) {
  router.get("/reports/expenses/:portId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const portId = req.params.portId;
      const { startDate, endDate, from, to } = req.query;
      const start = startDate || from;
      const end = endDate || to;
      const conditions: any[] = [eq(transactions.portId, portId)];
      if (start) conditions.push(sql`${transactions.transDate} >= ${start}`);
      if (end) conditions.push(sql`${transactions.transDate} <= ${end}`);

      const rows = await db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.transDate));
      const enrichedRows = await enrichTransactions(db, rows);
      const totals = calculateTransactionTotals(rows);

      return res.json({
        rows: enrichedRows,
        transactions: enrichedRows,
        totals: {
          totalInvoicesUSD: totals.totalInvoicesUSD,
          totalInvoicesIQD: totals.totalInvoicesIQD,
          totalPaymentsUSD: totals.totalPaymentsUSD,
          totalPaymentsIQD: totals.totalPaymentsIQD,
          totalCostUSD: totals.totalInvoicesUSD,
          totalAmountUSD: totals.totalInvoicesUSD,
          balanceUSD: totals.balanceUSD,
          balanceIQD: totals.balanceIQD,
        },
        summary: {
          totalInvoicesUSD: totals.totalInvoicesUSD,
          totalInvoicesIQD: totals.totalInvoicesIQD,
          totalPaymentsUSD: totals.totalPaymentsUSD,
          totalPaymentsIQD: totals.totalPaymentsIQD,
          balanceUSD: totals.balanceUSD,
          balanceIQD: totals.balanceIQD,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

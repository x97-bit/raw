import { Router, Response } from "express";
import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { transactions } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { getDirectionAliases, getStoredDirectionValue } from "../../utils/direction";
import { calculateTransactionTotals } from "../../utils/transactionSummaries";
import { enrichTransactions } from "../../utils/transactionEnrichment";

export function registerTransactionQueryRoutes(router: Router) {
  router.get("/transactions", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const { portId, port, accountType, type, accountId, startDate, endDate, search, limit, offset } = req.query;
      const conditions: any[] = [];
      const resolvedPortId = portId || port;
      if (resolvedPortId && resolvedPortId !== "null") {
        conditions.push(eq(transactions.portId, String(resolvedPortId)));
      }
      if (accountType) conditions.push(eq(transactions.accountType, String(accountType)));
      if (type) {
        const direction = getStoredDirectionValue(type);
        conditions.push(inArray(transactions.direction, getDirectionAliases(direction)));
      }
      if (accountId) conditions.push(eq(transactions.accountId, parseInt(String(accountId), 10)));
      if (startDate) conditions.push(sql`${transactions.transDate} >= ${startDate}`);
      if (endDate) conditions.push(sql`${transactions.transDate} <= ${endDate}`);
      if (search) {
        conditions.push(
          or(
            like(transactions.refNo, `%${search}%`),
            like(transactions.notes, `%${search}%`),
            like(transactions.traderNote, `%${search}%`),
          ),
        );
      }

      let countQuery = db.select({ count: sql<number>`count(*)` }).from(transactions);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions)) as any;
      }
      const [{ count: total }] = await countQuery;

      let query = db.select().from(transactions).orderBy(desc(transactions.id));
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      if (limit) query = query.limit(parseInt(String(limit), 10)) as any;
      if (offset) query = query.offset(parseInt(String(offset), 10)) as any;
      const rows = await query;

      let summaryQuery = db.select().from(transactions);
      if (conditions.length > 0) {
        summaryQuery = summaryQuery.where(and(...conditions)) as any;
      }
      const summaryRows = await summaryQuery;

      const enrichedRows = await enrichTransactions(db, rows);
      const summaryTotals = calculateTransactionTotals(summaryRows);

      return res.json({
        transactions: enrichedRows,
        total: Number(total),
        summary: {
          count: summaryTotals.count,
          shipmentCount: summaryTotals.shipmentCount,
          totalWeight: summaryTotals.totalWeight,
          totalInvoicesUSD: summaryTotals.totalInvoicesUSD,
          totalInvoicesIQD: summaryTotals.totalInvoicesIQD,
          totalPaymentsUSD: summaryTotals.totalPaymentsUSD,
          totalPaymentsIQD: summaryTotals.totalPaymentsIQD,
          totalCostUSD: summaryTotals.totalCostUSD,
          totalCostIQD: summaryTotals.totalCostIQD,
          totalProfitUSD: summaryTotals.totalProfitUSD,
          totalProfitIQD: summaryTotals.totalProfitIQD,
          balanceUSD: summaryTotals.balanceUSD,
          balanceIQD: summaryTotals.balanceIQD,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

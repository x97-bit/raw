import { Router, Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import { transactions } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { getAbsoluteAmount } from "../../utils/direction";
import { enrichTransactions } from "../../utils/transactionEnrichment";
import { UNKNOWN_ACCOUNT_NAME } from "./shared";

export function registerReportProfitRoutes(router: Router) {
  router.get("/reports/profits", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const { startDate, endDate, from, to, port } = req.query;
      const start = startDate || from;
      const end = endDate || to;
      const conditions: any[] = [];
      if (start) conditions.push(sql`${transactions.transDate} >= ${start}`);
      if (end) conditions.push(sql`${transactions.transDate} <= ${end}`);
      if (port) conditions.push(eq(transactions.portId, String(port)));

      let query = db.select().from(transactions);
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const rows = await query;
      const enrichedRows = await enrichTransactions(db, rows);
      const invoiceRows = enrichedRows.filter((transaction: any) => transaction.TransTypeID === 1);
      const totalCostUSD = invoiceRows.reduce((sum: number, transaction: any) => sum + (transaction.CostUSD || 0), 0);
      const totalCostIQD = invoiceRows.reduce((sum: number, transaction: any) => sum + (transaction.CostIQD || 0), 0);
      const totalAmountUSD = invoiceRows.reduce((sum: number, transaction: any) => sum + getAbsoluteAmount(transaction.AmountUSD), 0);
      const totalAmountIQD = invoiceRows.reduce((sum: number, transaction: any) => sum + getAbsoluteAmount(transaction.AmountIQD), 0);
      const totalProfitUSD = invoiceRows.reduce((sum: number, transaction: any) => sum + (transaction.ProfitUSD || 0), 0);
      const totalProfitIQD = invoiceRows.reduce((sum: number, transaction: any) => sum + (transaction.ProfitIQD || 0), 0);

      const traderMap: Record<string, any> = {};
      for (const transaction of invoiceRows) {
        const key = transaction.AccountName || UNKNOWN_ACCOUNT_NAME;
        if (!traderMap[key]) {
          traderMap[key] = {
            AccountName: key,
            shipmentCount: 0,
            totalCostUSD: 0,
            totalAmountUSD: 0,
            totalProfitUSD: 0,
            totalCostIQD: 0,
            totalAmountIQD: 0,
            totalProfitIQD: 0,
          };
        }
        traderMap[key].shipmentCount += 1;
        traderMap[key].totalCostUSD += transaction.CostUSD || 0;
        traderMap[key].totalAmountUSD += transaction.AmountUSD || 0;
        traderMap[key].totalProfitUSD += transaction.ProfitUSD || 0;
        traderMap[key].totalCostIQD += transaction.CostIQD || 0;
        traderMap[key].totalAmountIQD += transaction.AmountIQD || 0;
        traderMap[key].totalProfitIQD += transaction.ProfitIQD || 0;
      }

      const traderProfits = Object.values(traderMap).sort((left: any, right: any) => right.totalProfitUSD - left.totalProfitUSD);
      return res.json({
        rows: invoiceRows,
        traderProfits,
        totals: {
          totalCostUSD,
          totalCostIQD,
          totalAmountUSD,
          totalAmountIQD,
          totalProfitUSD,
          totalProfitIQD,
          shipmentCount: invoiceRows.length,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

import { Router, Response } from "express";
import { and, eq, sql, type SQL } from "drizzle-orm";
import { transactions } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db";
import { getAbsoluteAmount } from "../../utils/direction";
import { enrichTransactions, type EnrichedTransactionRecord } from "../../utils/transactionEnrichment";
import { UNKNOWN_ACCOUNT_NAME } from "./shared";

type ProfitInvoiceRow = EnrichedTransactionRecord & {
  TransTypeID: 1;
  AccountName: string;
  CostUSD: number;
  CostIQD: number;
  AmountUSD: number;
  AmountIQD: number;
  ProfitUSD: number;
  ProfitIQD: number;
};

type TraderProfitRow = {
  AccountName: string;
  shipmentCount: number;
  totalCostUSD: number;
  totalAmountUSD: number;
  totalProfitUSD: number;
  totalCostIQD: number;
  totalAmountIQD: number;
  totalProfitIQD: number;
};

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

function isProfitInvoiceRow(transaction: EnrichedTransactionRecord): transaction is ProfitInvoiceRow {
  return transaction.TransTypeID === 1;
}

function createTraderProfitRow(accountName: string): TraderProfitRow {
  return {
    AccountName: accountName,
    shipmentCount: 0,
    totalCostUSD: 0,
    totalAmountUSD: 0,
    totalProfitUSD: 0,
    totalCostIQD: 0,
    totalAmountIQD: 0,
    totalProfitIQD: 0,
  };
}

export function registerReportProfitRoutes(router: Router) {
  router.get("/reports/profits", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const { startDate, endDate, from, to, port } = req.query;
      const start = readQueryString(startDate) ?? readQueryString(from);
      const end = readQueryString(endDate) ?? readQueryString(to);
      const requestedPort = readQueryString(port);
      const conditions: SQL<unknown>[] = [];
      if (start) conditions.push(sql`${transactions.transDate} >= ${start}`);
      if (end) conditions.push(sql`${transactions.transDate} <= ${end}`);
      if (requestedPort) conditions.push(eq(transactions.portId, requestedPort));

      const query = conditions.length > 0
        ? db.select().from(transactions).where(and(...conditions))
        : db.select().from(transactions);

      const rows = await query;
      const enrichedRows = await enrichTransactions(db, rows);
      const invoiceRows = enrichedRows.filter(isProfitInvoiceRow);
      const totalCostUSD = invoiceRows.reduce((sum, transaction) => sum + transaction.CostUSD, 0);
      const totalCostIQD = invoiceRows.reduce((sum, transaction) => sum + transaction.CostIQD, 0);
      const totalAmountUSD = invoiceRows.reduce((sum, transaction) => sum + getAbsoluteAmount(transaction.AmountUSD), 0);
      const totalAmountIQD = invoiceRows.reduce((sum, transaction) => sum + getAbsoluteAmount(transaction.AmountIQD), 0);
      const totalProfitUSD = invoiceRows.reduce((sum, transaction) => sum + transaction.ProfitUSD, 0);
      const totalProfitIQD = invoiceRows.reduce((sum, transaction) => sum + transaction.ProfitIQD, 0);

      const traderMap = new Map<string, TraderProfitRow>();
      for (const transaction of invoiceRows) {
        const key = transaction.AccountName || UNKNOWN_ACCOUNT_NAME;
        let traderProfit = traderMap.get(key);
        if (!traderProfit) {
          traderProfit = createTraderProfitRow(key);
          traderMap.set(key, traderProfit);
        }
        traderProfit.shipmentCount += 1;
        traderProfit.totalCostUSD += transaction.CostUSD;
        traderProfit.totalAmountUSD += transaction.AmountUSD;
        traderProfit.totalProfitUSD += transaction.ProfitUSD;
        traderProfit.totalCostIQD += transaction.CostIQD;
        traderProfit.totalAmountIQD += transaction.AmountIQD;
        traderProfit.totalProfitIQD += transaction.ProfitIQD;
      }

      const traderProfits = Array.from(traderMap.values()).sort(
        (left, right) => right.totalProfitUSD - left.totalProfitUSD,
      );
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
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

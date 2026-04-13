import { Router, Response } from "express";
import { debts } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db";
import { mapDebtRow } from "../../utils/debts";

type DebtRow = typeof debts.$inferSelect;

type DebtSummaryRow = {
  AccountID: string;
  AccountName: string;
  totalUSD: number;
  totalIQD: number;
  paidUSD: number;
  paidIQD: number;
  count: number;
};

function parseStoredAmount(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function registerReportDebtSummaryRoutes(router: Router) {
  router.get("/reports/debts-summary", authMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const allDebts = await db.select().from(debts);
      const totalUSD = allDebts.reduce((sum, debt: DebtRow) => sum + parseStoredAmount(debt.amountUSD), 0);
      const totalIQD = allDebts.reduce((sum, debt: DebtRow) => sum + parseStoredAmount(debt.amountIQD), 0);
      const paidUSD = allDebts.reduce((sum, debt: DebtRow) => sum + parseStoredAmount(debt.paidAmountUSD), 0);
      const paidIQD = allDebts.reduce((sum, debt: DebtRow) => sum + parseStoredAmount(debt.paidAmountIQD), 0);

      const debtorMap = new Map<string, DebtSummaryRow>();
      for (const debt of allDebts) {
        const key = debt.debtorName;
        let summary = debtorMap.get(key);
        if (!summary) {
          summary = {
            AccountID: key,
            AccountName: key,
            totalUSD: 0,
            totalIQD: 0,
            paidUSD: 0,
            paidIQD: 0,
            count: 0,
          };
          debtorMap.set(key, summary);
        }
        summary.totalUSD += parseStoredAmount(debt.amountUSD);
        summary.totalIQD += parseStoredAmount(debt.amountIQD);
        summary.paidUSD += parseStoredAmount(debt.paidAmountUSD);
        summary.paidIQD += parseStoredAmount(debt.paidAmountIQD);
        summary.count += 1;
      }

      return res.json({
        debts: allDebts.map(mapDebtRow),
        summary: Array.from(debtorMap.values()),
        totals: {
          totalUSD,
          totalIQD,
          paidUSD,
          paidIQD,
          remainingUSD: totalUSD - paidUSD,
          remainingIQD: totalIQD - paidIQD,
        },
      });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

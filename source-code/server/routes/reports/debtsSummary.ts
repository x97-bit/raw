import { Router, Response } from "express";
import { debts } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { mapDebtRow } from "../../utils/debts";

export function registerReportDebtSummaryRoutes(router: Router) {
  router.get("/reports/debts-summary", authMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const allDebts = await db.select().from(debts);
      const totalUSD = allDebts.reduce((sum: number, debt: any) => sum + parseFloat(debt.amountUSD || "0"), 0);
      const totalIQD = allDebts.reduce((sum: number, debt: any) => sum + parseFloat(debt.amountIQD || "0"), 0);
      const paidUSD = allDebts.reduce((sum: number, debt: any) => sum + parseFloat(debt.paidAmountUSD || "0"), 0);
      const paidIQD = allDebts.reduce((sum: number, debt: any) => sum + parseFloat(debt.paidAmountIQD || "0"), 0);

      const debtorMap: Record<string, any> = {};
      for (const debt of allDebts) {
        const key = debt.debtorName;
        if (!debtorMap[key]) {
          debtorMap[key] = {
            AccountID: key,
            AccountName: key,
            totalUSD: 0,
            totalIQD: 0,
            paidUSD: 0,
            paidIQD: 0,
            count: 0,
          };
        }
        debtorMap[key].totalUSD += parseFloat(debt.amountUSD || "0");
        debtorMap[key].totalIQD += parseFloat(debt.amountIQD || "0");
        debtorMap[key].paidUSD += parseFloat(debt.paidAmountUSD || "0");
        debtorMap[key].paidIQD += parseFloat(debt.paidAmountIQD || "0");
        debtorMap[key].count += 1;
      }

      return res.json({
        debts: allDebts.map(mapDebtRow),
        summary: Object.values(debtorMap),
        totals: {
          totalUSD,
          totalIQD,
          paidUSD,
          paidIQD,
          remainingUSD: totalUSD - paidUSD,
          remainingIQD: totalIQD - paidIQD,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

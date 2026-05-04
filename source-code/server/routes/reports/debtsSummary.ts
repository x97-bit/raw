import { Router, Response } from "express";
import { debts } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db/db";
import { mapDebtRow } from "../../utils/debts";
import { financialReportsCache } from "../../_core/redisCache";

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
  router.get(
    "/reports/debts-summary",
    authMiddleware,
    async (_req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const { hit, value } = await financialReportsCache.getOrLoad(
          "debts-summary",
          async () => {
            const allDebts = await db.select().from(debts);

            // Single-pass computation for totals AND per-debtor summary
            let totalUSD = 0;
            let totalIQD = 0;
            let paidUSD = 0;
            let paidIQD = 0;
            const debtorMap = new Map<string, DebtSummaryRow>();

            for (const debt of allDebts) {
              const amtUSD = parseStoredAmount(debt.amountUSD);
              const amtIQD = parseStoredAmount(debt.amountIQD);
              const pdUSD = parseStoredAmount(debt.paidAmountUSD);
              const pdIQD = parseStoredAmount(debt.paidAmountIQD);

              totalUSD += amtUSD;
              totalIQD += amtIQD;
              paidUSD += pdUSD;
              paidIQD += pdIQD;

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
              summary.totalUSD += amtUSD;
              summary.totalIQD += amtIQD;
              summary.paidUSD += pdUSD;
              summary.paidIQD += pdIQD;
              summary.count += 1;
            }

            return {
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
            };
          }
        );

        res.setHeader("X-Cache", hit ? "HIT" : "MISS");
        return res.json(value);
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

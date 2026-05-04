import { Router, Response } from "express";
import { desc } from "drizzle-orm";
import { expenses } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db/db";
import { buildExpenseTotals, mapExpenseRow } from "../../utils/expenses";
import { financialReportsCache } from "../../_core/redisCache";
import {
  GENERAL_EXPENSES_LABEL,
  MONTHERIA_EXPENSES_LABEL,
  QAIM_EXPENSES_LABEL,
  SAUDI_EXPENSES_LABEL,
} from "./shared";

type ExpenseSummaryRow = {
  portId: string;
  label: string;
  totalUSD: number;
  totalIQD: number;
  count: number;
  directExpenseUSD: number;
  directExpenseIQD: number;
  chargedToTraderUSD: number;
  chargedToTraderIQD: number;
};

export function registerReportExpenseSummaryRoutes(router: Router) {
  router.get(
    "/reports/expenses-summary",
    authMiddleware,
    async (_req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const { hit, value } = await financialReportsCache.getOrLoad(
          "expenses-summary",
          async () => {
            const allExpenses = await db
              .select()
              .from(expenses)
              .orderBy(desc(expenses.expenseDate));

            const portLabels: Record<string, string> = {
              general: GENERAL_EXPENSES_LABEL,
              "port-1": SAUDI_EXPENSES_LABEL,
              "port-2": MONTHERIA_EXPENSES_LABEL,
              "port-3": QAIM_EXPENSES_LABEL,
            };

            // Map all expenses once, then reuse for both summary and response
            const mappedExpenses = allExpenses.map(mapExpenseRow);

            // Single-pass summary computation
            const summaryMap = new Map<string, ExpenseSummaryRow>();
            for (const mapped of mappedExpenses) {
              const portId = mapped.portId || "general";
              let summary = summaryMap.get(portId);
              if (!summary) {
                summary = {
                  portId,
                  label: portLabels[portId] || portId,
                  totalUSD: 0,
                  totalIQD: 0,
                  count: 0,
                  directExpenseUSD: 0,
                  directExpenseIQD: 0,
                  chargedToTraderUSD: 0,
                  chargedToTraderIQD: 0,
                };
                summaryMap.set(portId, summary);
              }

              summary.totalUSD += mapped.amountUSD;
              summary.totalIQD += mapped.amountIQD;
              summary.count += 1;
              if (mapped.chargeTarget === "trader") {
                summary.chargedToTraderUSD += mapped.amountUSD;
                summary.chargedToTraderIQD += mapped.amountIQD;
              } else {
                summary.directExpenseUSD += mapped.amountUSD;
                summary.directExpenseIQD += mapped.amountIQD;
              }
            }

            return {
              expenses: mappedExpenses,
              summary: Array.from(summaryMap.values()),
              totals: buildExpenseTotals(allExpenses),
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

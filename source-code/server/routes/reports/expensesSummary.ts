import { Router, Response } from "express";
import { desc } from "drizzle-orm";
import { expenses } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db";
import { buildExpenseTotals, mapExpenseRow } from "../../utils/expenses";
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
  router.get("/reports/expenses-summary", authMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.expenseDate));
      const portLabels: Record<string, string> = {
        general: GENERAL_EXPENSES_LABEL,
        "port-1": SAUDI_EXPENSES_LABEL,
        "port-2": MONTHERIA_EXPENSES_LABEL,
        "port-3": QAIM_EXPENSES_LABEL,
      };

      const summaryMap = new Map<string, ExpenseSummaryRow>();
      for (const expense of allExpenses) {
        const portId = expense.portId || "general";
        const mappedExpense = mapExpenseRow(expense);
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

        summary.totalUSD += mappedExpense.amountUSD;
        summary.totalIQD += mappedExpense.amountIQD;
        summary.count += 1;
        if (mappedExpense.chargeTarget === "trader") {
          summary.chargedToTraderUSD += mappedExpense.amountUSD;
          summary.chargedToTraderIQD += mappedExpense.amountIQD;
        } else {
          summary.directExpenseUSD += mappedExpense.amountUSD;
          summary.directExpenseIQD += mappedExpense.amountIQD;
        }
      }

      return res.json({
        expenses: allExpenses.map(mapExpenseRow),
        summary: Array.from(summaryMap.values()),
        totals: buildExpenseTotals(allExpenses),
      });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

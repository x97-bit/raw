import { Router, Response } from "express";
import { desc } from "drizzle-orm";
import { expenses } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { GENERAL_EXPENSES_LABEL, MONTHERIA_EXPENSES_LABEL, QAIM_EXPENSES_LABEL } from "./shared";

export function registerReportExpenseSummaryRoutes(router: Router) {
  router.get("/reports/expenses-summary", authMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.expenseDate));
      const portLabels: Record<string, string> = {
        general: GENERAL_EXPENSES_LABEL,
        "port-2": MONTHERIA_EXPENSES_LABEL,
        "port-3": QAIM_EXPENSES_LABEL,
      };

      const summaryMap: Record<string, { portId: string; label: string; totalUSD: number; totalIQD: number; count: number }> = {};
      for (const expense of allExpenses) {
        const portId = expense.portId || "general";
        if (!summaryMap[portId]) {
          summaryMap[portId] = {
            portId,
            label: portLabels[portId] || portId,
            totalUSD: 0,
            totalIQD: 0,
            count: 0,
          };
        }
        summaryMap[portId].totalUSD += parseFloat(expense.amountUSD || "0");
        summaryMap[portId].totalIQD += parseFloat(expense.amountIQD || "0");
        summaryMap[portId].count += 1;
      }

      return res.json({
        expenses: allExpenses,
        summary: Object.values(summaryMap),
        totals: {
          totalUSD: allExpenses.reduce((sum: number, expense: any) => sum + parseFloat(expense.amountUSD || "0"), 0),
          totalIQD: allExpenses.reduce((sum: number, expense: any) => sum + parseFloat(expense.amountIQD || "0"), 0),
          count: allExpenses.length,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

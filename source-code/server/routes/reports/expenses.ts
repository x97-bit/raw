import { Router, Response } from "express";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { expenses } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db";
import { buildExpenseTotals, mapExpenseRow } from "../../utils/expenses";

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

export function registerReportExpenseRoutes(router: Router) {
  router.get("/reports/expenses/:portId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const portId = req.params.portId;
      const { startDate, endDate, from, to } = req.query;
      const start = readQueryString(startDate) ?? readQueryString(from);
      const end = readQueryString(endDate) ?? readQueryString(to);
      const conditions: SQL<unknown>[] = [eq(expenses.portId, portId)];
      if (start) conditions.push(sql`${expenses.expenseDate} >= ${start}`);
      if (end) conditions.push(sql`${expenses.expenseDate} <= ${end}`);

      const rows = await db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.expenseDate), desc(expenses.id));
      const totals = buildExpenseTotals(rows);

      return res.json({
        rows: rows.map(mapExpenseRow),
        totals,
      });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

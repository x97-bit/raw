import { Router, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { governorates, routeDefaults } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { parseNullableNumber, parseOptionalInt } from "../../utils/bodyFields";
import { requireDefaultAdmin } from "./shared";

function applyRouteDefaultSearch(rows: Array<any>, search: string) {
  if (!search) {
    return rows;
  }

  return rows.filter(
    (row) =>
      row.govName.toLowerCase().includes(search) ||
      row.sectionKey.toLowerCase().includes(search) ||
      String(row.currency || "").toLowerCase().includes(search),
  );
}

export function registerRouteDefaultReadRoutes(router: Router) {
  router.get("/defaults/route", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireDefaultAdmin(req, res)) return;

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const conditions: any[] = [];
      const sectionKey = req.query.sectionKey ? String(req.query.sectionKey).trim() : "";
      const govId = parseOptionalInt(req.query.govId);
      const currency = req.query.currency ? String(req.query.currency).trim() : "";
      const search = req.query.search ? String(req.query.search).trim().toLowerCase() : "";

      if (sectionKey) conditions.push(eq(routeDefaults.sectionKey, sectionKey));
      if (govId) conditions.push(eq(routeDefaults.govId, govId));
      if (currency) conditions.push(eq(routeDefaults.currency, currency));

      let query = db.select().from(routeDefaults).orderBy(desc(routeDefaults.updatedAt), desc(routeDefaults.id));
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const [rows, allGovs] = await Promise.all([query, db.select().from(governorates)]);
      const govMap = new Map(allGovs.map((row: any) => [row.id, row.name]));

      const result = applyRouteDefaultSearch(
        rows.map((row: any) => ({
          id: row.id,
          sectionKey: row.sectionKey,
          govId: row.govId,
          govName: govMap.get(row.govId) || "",
          currency: row.currency,
          defaultTransPrice: parseNullableNumber(row.defaultTransPrice),
          defaultFeeUsd: parseNullableNumber(row.defaultFeeUsd),
          defaultCostUsd: parseNullableNumber(row.defaultCostUsd),
          defaultAmountUsd: parseNullableNumber(row.defaultAmountUsd),
          defaultCostIqd: parseNullableNumber(row.defaultCostIqd),
          defaultAmountIqd: parseNullableNumber(row.defaultAmountIqd),
          notes: row.notes ?? "",
          active: row.active === 1,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        })),
        search,
      );

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

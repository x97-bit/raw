import { Router, Response } from "express";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { governorates, routeDefaults } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db/db";
import { parseNullableNumber, parseOptionalInt } from "../../utils/bodyFields";
import { requireDefaultAdmin } from "./shared";

type RouteDefaultRow = typeof routeDefaults.$inferSelect;
type RouteDefaultTimestamp = RouteDefaultRow["createdAt"];
type GovernorateRow = typeof governorates.$inferSelect;

type RouteDefaultListRow = {
  id: number;
  sectionKey: string;
  govId: number;
  govName: string;
  currency: string;
  defaultTransPrice: number | null;
  defaultFeeUsd: number | null;
  defaultCostUsd: number | null;
  defaultAmountUsd: number | null;
  defaultCostIqd: number | null;
  defaultAmountIqd: number | null;
  notes: string;
  active: boolean;
  createdAt: RouteDefaultTimestamp;
  updatedAt: RouteDefaultTimestamp;
};

function readQueryString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    const [firstValue] = value;
    return typeof firstValue === "string"
      ? readQueryString(firstValue)
      : undefined;
  }

  return undefined;
}

function applyRouteDefaultSearch(rows: RouteDefaultListRow[], search: string) {
  if (!search) {
    return rows;
  }

  return rows.filter(
    row =>
      row.govName.toLowerCase().includes(search) ||
      row.sectionKey.toLowerCase().includes(search) ||
      String(row.currency || "")
        .toLowerCase()
        .includes(search)
  );
}

export function registerRouteDefaultReadRoutes(router: Router) {
  router.get(
    "/defaults/route",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!requireDefaultAdmin(req, res)) return;

        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const conditions: SQL<unknown>[] = [];
        const sectionKey = readQueryString(req.query.sectionKey) ?? "";
        const govId = parseOptionalInt(req.query.govId);
        const currency = readQueryString(req.query.currency) ?? "";
        const search = (readQueryString(req.query.search) ?? "").toLowerCase();

        if (sectionKey)
          conditions.push(eq(routeDefaults.sectionKey, sectionKey));
        if (govId) conditions.push(eq(routeDefaults.govId, govId));
        if (currency) conditions.push(eq(routeDefaults.currency, currency));

        const query =
          conditions.length > 0
            ? db
                .select()
                .from(routeDefaults)
                .where(and(...conditions))
                .orderBy(desc(routeDefaults.updatedAt), desc(routeDefaults.id))
            : db
                .select()
                .from(routeDefaults)
                .orderBy(desc(routeDefaults.updatedAt), desc(routeDefaults.id));

        const [rows, allGovs] = await Promise.all([
          query,
          db.select().from(governorates),
        ]);
        const govMap = new Map<number, string>(
          allGovs.map((row: GovernorateRow) => [row.id, row.name])
        );

        const result = applyRouteDefaultSearch(
          rows.map(
            (row: RouteDefaultRow): RouteDefaultListRow => ({
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
            })
          ),
          search
        );

        return res.json(result);
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

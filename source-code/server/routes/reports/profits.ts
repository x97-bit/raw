import { Router, Response } from "express";
import { sql } from "drizzle-orm";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db/db";

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
    return typeof firstValue === "string"
      ? readQueryString(firstValue)
      : undefined;
  }

  return undefined;
}

function parseNum(value: unknown): number {
  const n = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

import { financialReportsCache, buildRequestCacheKey } from "../../utils/reportsCache";

export function registerReportProfitRoutes(router: Router) {
  router.get(
    "/reports/profits",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const cacheKey = buildRequestCacheKey(req.path, req.query as Record<string, unknown>);
        const result = await financialReportsCache.getOrLoad(cacheKey, async () => {
          const { startDate, endDate, from, to, port } = req.query;
          const start = readQueryString(startDate) ?? readQueryString(from);
          const end = readQueryString(endDate) ?? readQueryString(to);
          const requestedPort = readQueryString(port);

          // Build optional SQL filter fragments
          const startFilter = start ? sql` AND t.trans_date >= ${start}` : sql``;
          const endFilter = end ? sql` AND t.trans_date <= ${end}` : sql``;
          const portFilter = requestedPort
            ? sql` AND t.port_id = ${requestedPort}`
            : sql``;

          // Single SQL query: aggregate per-account — replaces loading ALL rows + enriching each one
          const [totalsResult, traderRows] = await Promise.all([
            db.execute(sql`
            SELECT
              COUNT(*) AS shipmentCount,
              COALESCE(SUM(ABS(COALESCE(CAST(t.cost_usd AS DECIMAL(15,2)),0))), 0) AS totalCostUSD,
              COALESCE(SUM(ABS(COALESCE(CAST(t.cost_iqd AS DECIMAL(15,0)),0))), 0) AS totalCostIQD,
              COALESCE(SUM(ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0))), 0) AS totalAmountUSD,
              COALESCE(SUM(ABS(COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)),0))), 0) AS totalAmountIQD,
              COALESCE(SUM(
                ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0)) - ABS(COALESCE(CAST(t.cost_usd AS DECIMAL(15,2)),0))
              ), 0) AS totalProfitUSD,
              COALESCE(SUM(
                ABS(COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)),0)) - ABS(COALESCE(CAST(t.cost_iqd AS DECIMAL(15,0)),0))
              ), 0) AS totalProfitIQD
            FROM transactions t
            WHERE UPPER(t.direction) IN ('IN','DR')
              AND LOWER(COALESCE(t.record_type,'shipment')) NOT IN ('expense-charge','debit-note')
              ${startFilter}
              ${endFilter}
              ${portFilter}
          `),

            db.execute(sql`
            SELECT
              COALESCE(a.name, 'غير معروف') AS AccountName,
              COUNT(*) AS shipmentCount,
              COALESCE(SUM(ABS(COALESCE(CAST(t.cost_usd AS DECIMAL(15,2)),0))), 0) AS totalCostUSD,
              COALESCE(SUM(ABS(COALESCE(CAST(t.cost_iqd AS DECIMAL(15,0)),0))), 0) AS totalCostIQD,
              COALESCE(SUM(ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0))), 0) AS totalAmountUSD,
              COALESCE(SUM(ABS(COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)),0))), 0) AS totalAmountIQD,
              COALESCE(SUM(
                ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0)) - ABS(COALESCE(CAST(t.cost_usd AS DECIMAL(15,2)),0))
              ), 0) AS totalProfitUSD,
              COALESCE(SUM(
                ABS(COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)),0)) - ABS(COALESCE(CAST(t.cost_iqd AS DECIMAL(15,0)),0))
              ), 0) AS totalProfitIQD
            FROM transactions t
            LEFT JOIN accounts a ON a.id = t.account_id
            WHERE UPPER(t.direction) IN ('IN','DR')
              AND LOWER(COALESCE(t.record_type,'shipment')) NOT IN ('expense-charge','debit-note')
              ${startFilter}
              ${endFilter}
              ${portFilter}
            GROUP BY t.account_id, a.name
            ORDER BY totalProfitUSD DESC
          `),
          ]);

          // Parse totals (db.execute returns [rows, fields])
          const [totalsResultRows] = totalsResult as unknown as [Array<Record<string, unknown>>, unknown];
          const totalsRow = totalsResultRows[0] ?? {};
          const totals = {
            totalCostUSD: parseNum(totalsRow.totalCostUSD),
            totalCostIQD: parseNum(totalsRow.totalCostIQD),
            totalAmountUSD: parseNum(totalsRow.totalAmountUSD),
            totalAmountIQD: parseNum(totalsRow.totalAmountIQD),
            totalProfitUSD: parseNum(totalsRow.totalProfitUSD),
            totalProfitIQD: parseNum(totalsRow.totalProfitIQD),
            shipmentCount: parseNum(totalsRow.shipmentCount),
          };

          // Parse per-trader rows (db.execute returns [rows, fields])
          const [traderResultRows] = traderRows as unknown as [Array<Record<string, unknown>>, unknown];
          const traderProfits: TraderProfitRow[] = traderResultRows.map(row => ({
            AccountName: String(row.AccountName ?? "غير معروف"),
            shipmentCount: parseNum(row.shipmentCount),
            totalCostUSD: parseNum(row.totalCostUSD),
            totalAmountUSD: parseNum(row.totalAmountUSD),
            totalProfitUSD: parseNum(row.totalProfitUSD),
            totalCostIQD: parseNum(row.totalCostIQD),
            totalAmountIQD: parseNum(row.totalAmountIQD),
            totalProfitIQD: parseNum(row.totalProfitIQD),
          }));

          return {
            rows: traderProfits,
            traderProfits,
            totals,
          };
        });

        return res.json(result.value);
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

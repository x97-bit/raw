import { Router, Response } from "express";
import { desc, sql } from "drizzle-orm";
import { ports, transactions } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db/db";
import { enrichTransactions } from "../../utils/transactionEnrichment";

type PortRow = typeof ports.$inferSelect;
type TransactionRow = typeof transactions.$inferSelect;

type PortStatsRow = {
  PortID: string;
  PortName: string;
  transCount: number;
  invoicesUSD: number;
  invoicesIQD: number;
  paymentsUSD: number;
  paymentsIQD: number;
};

type MonthlyTrendRow = {
  month: string;
  invoicesUSD: number;
  paymentsUSD: number;
};

type TopTraderRow = {
  AccountID: number;
  AccountName: string;
  transCount: number;
  balanceUSD: number;
};

function parseStoredAmount(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

import { financialReportsCache, buildRequestCacheKey } from "../../utils/reportsCache";

export function registerReportDashboardRoutes(router: Router) {
  router.get(
    "/reports/dashboard",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const cacheKey = buildRequestCacheKey(req.path, req.query as Record<string, unknown>);
        const result = await financialReportsCache.getOrLoad(cacheKey, async () => {
          // Run all aggregation queries in parallel — no more full table scans in JS
          const [
            countResults,
            portAggregations,
            monthlyAggregations,
            debtAggregations,
            recentTransactions,
            topTraderAggregations,
            allPorts,
          ] = await Promise.all([
            // Total counts via SQL COUNT
            db.execute(sql`
            SELECT
              (SELECT COUNT(*) FROM accounts) AS totalAccounts,
              (SELECT COUNT(*) FROM transactions) AS totalTransactions
          `),

            // Port stats via SQL GROUP BY — replaces full allTransactions.filter() per port in JS
            db.execute(sql`
            SELECT
              t.port_id AS portId,
              COUNT(*) AS transCount,
              SUM(CASE WHEN UPPER(t.direction) IN ('IN','DR') THEN ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0)) ELSE 0 END) AS invoicesUSD,
              SUM(CASE WHEN UPPER(t.direction) IN ('IN','DR') THEN ABS(COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)),0)) ELSE 0 END) AS invoicesIQD,
              SUM(CASE WHEN UPPER(t.direction) IN ('OUT','CR') THEN ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0)) ELSE 0 END) AS paymentsUSD,
              SUM(CASE WHEN UPPER(t.direction) IN ('OUT','CR') THEN ABS(COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)),0)) ELSE 0 END) AS paymentsIQD
            FROM transactions t
            WHERE t.port_id IS NOT NULL
            GROUP BY t.port_id
          `),

            // Monthly trend via SQL GROUP BY DATE_FORMAT — replaces full allTransactions.filter() per month in JS
            db.execute(sql`
            SELECT
              DATE_FORMAT(trans_date, '%Y-%m') AS month,
              SUM(CASE WHEN UPPER(direction) IN ('IN','DR') THEN ABS(COALESCE(CAST(amount_usd AS DECIMAL(15,2)),0)) ELSE 0 END) AS invoicesUSD,
              SUM(CASE WHEN UPPER(direction) IN ('OUT','CR') THEN ABS(COALESCE(CAST(amount_usd AS DECIMAL(15,2)),0)) ELSE 0 END) AS paymentsUSD
            FROM transactions
            WHERE trans_date >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 6 MONTH), '%Y-%m-01')
            GROUP BY DATE_FORMAT(trans_date, '%Y-%m')
            ORDER BY month DESC
            LIMIT 6
          `),

            // Debt totals via SQL SUM
            db.execute(sql`
            SELECT
              COALESCE(SUM(CAST(amount_usd AS DECIMAL(15,2))), 0) AS totalUSD,
              COALESCE(SUM(CAST(amount_iqd AS DECIMAL(15,0))), 0) AS totalIQD
            FROM debts
          `),

            // Only last 10 transactions — not all of them
            db
              .select()
              .from(transactions)
              .orderBy(desc(transactions.id))
              .limit(10),

            // Top traders via SQL GROUP BY + ORDER BY — replaces allAccounts.map() + filter per account in JS
            db.execute(sql`
            SELECT
              a.id AS AccountID,
              a.name AS AccountName,
              COUNT(t.id) AS transCount,
              COALESCE(
                SUM(CASE WHEN UPPER(t.direction) IN ('IN','DR') THEN ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0)) ELSE 0 END) -
                SUM(CASE WHEN UPPER(t.direction) IN ('OUT','CR') THEN ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0)) ELSE 0 END),
                0
              ) AS balanceUSD
            FROM accounts a
            INNER JOIN transactions t ON t.account_id = a.id
            GROUP BY a.id, a.name
            ORDER BY ABS(
              SUM(CASE WHEN UPPER(t.direction) IN ('IN','DR') THEN ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0)) ELSE 0 END) -
              SUM(CASE WHEN UPPER(t.direction) IN ('OUT','CR') THEN ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0)) ELSE 0 END)
            ) DESC
            LIMIT 10
          `),

            // Port metadata
            db.select().from(ports),
          ]);

          // Parse count results
          const countsRow =
            (
              countResults as unknown as Array<{
                totalAccounts: unknown;
                totalTransactions: unknown;
              }>
            )[0] ?? {};
          const totalAccounts = Number(countsRow.totalAccounts ?? 0);
          const totalTransactions = Number(countsRow.totalTransactions ?? 0);

          // Build port stats map
          const portAggMap = new Map<
            string,
            {
              transCount: number;
              invoicesUSD: number;
              invoicesIQD: number;
              paymentsUSD: number;
              paymentsIQD: number;
            }
          >();
          for (const row of portAggregations as unknown as Array<
            Record<string, unknown>
          >) {
            portAggMap.set(String(row.portId ?? ""), {
              transCount: Number(row.transCount ?? 0),
              invoicesUSD: parseStoredAmount(row.invoicesUSD),
              invoicesIQD: parseStoredAmount(row.invoicesIQD),
              paymentsUSD: parseStoredAmount(row.paymentsUSD),
              paymentsIQD: parseStoredAmount(row.paymentsIQD),
            });
          }

          const portStats: PortStatsRow[] = (allPorts as PortRow[]).map(port => {
            const agg = portAggMap.get(port.portId) ?? {
              transCount: 0,
              invoicesUSD: 0,
              invoicesIQD: 0,
              paymentsUSD: 0,
              paymentsIQD: 0,
            };
            return { PortID: port.portId, PortName: port.name, ...agg };
          });

          // Build monthly trend (fill in months that have no data with zeros)
          const monthlyMap = new Map<
            string,
            { invoicesUSD: number; paymentsUSD: number }
          >();
          for (const row of monthlyAggregations as unknown as Array<
            Record<string, unknown>
          >) {
            monthlyMap.set(String(row.month ?? ""), {
              invoicesUSD: parseStoredAmount(row.invoicesUSD),
              paymentsUSD: parseStoredAmount(row.paymentsUSD),
            });
          }
          const monthlyTrend: MonthlyTrendRow[] = [];
          for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const agg = monthlyMap.get(month) ?? {
              invoicesUSD: 0,
              paymentsUSD: 0,
            };
            monthlyTrend.push({ month, ...agg });
          }

          // Debt totals
          const debtRow =
            (
              debtAggregations as unknown as Array<{
                totalUSD: unknown;
                totalIQD: unknown;
              }>
            )[0] ?? {};
          const totalDebts = {
            totalUSD: parseStoredAmount(debtRow.totalUSD),
            totalIQD: parseStoredAmount(debtRow.totalIQD),
          };

          // Enrich only the last 10 transactions (not thousands)
          const enrichedRecentTransactions = await enrichTransactions(
            db,
            recentTransactions as TransactionRow[]
          );

          // Top traders
          const topTraders: TopTraderRow[] = (
            topTraderAggregations as unknown as Array<Record<string, unknown>>
          ).map(row => ({
            AccountID: Number(row.AccountID ?? 0),
            AccountName: String(row.AccountName ?? ""),
            transCount: Number(row.transCount ?? 0),
            balanceUSD: parseStoredAmount(row.balanceUSD),
          }));

          return {
            totalAccounts,
            totalTransactions,
            portStats,
            monthlyTrend,
            totalDebts,
            recentTransactions: enrichedRecentTransactions,
            topTraders,
          };
        });

        res.setHeader("Cache-Control", "private, max-age=60, stale-while-revalidate=120");
        return res.json(result.value);
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

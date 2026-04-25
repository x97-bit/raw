import { Router, Response } from "express";
import { sql } from "drizzle-orm";
import { accountTypes, accounts, transactions } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db/db";

type AccountTypeRow = typeof accountTypes.$inferSelect;

type TrialBalanceRow = {
  AccountID: number;
  AccountName: string;
  AccountType: string;
  AccountTypeName: string;
  opening_usd: number;
  opening_iqd: number;
  debit_usd: number;
  debit_iqd: number;
  credit_usd: number;
  credit_iqd: number;
  balance_usd: number;
  balance_iqd: number;
  profit_usd: number;
  profit_iqd: number;
  cost_usd: number;
  cost_iqd: number;
  shipment_count: number;
  trans_count: number;
};

type TrialBalanceNumericKey =
  | "opening_usd"
  | "opening_iqd"
  | "debit_usd"
  | "debit_iqd"
  | "credit_usd"
  | "credit_iqd"
  | "balance_usd"
  | "balance_iqd"
  | "profit_usd"
  | "profit_iqd"
  | "cost_usd"
  | "cost_iqd"
  | "shipment_count"
  | "trans_count";

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
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function sumTrialBalanceField(
  rows: TrialBalanceRow[],
  field: TrialBalanceNumericKey
): number {
  return rows.reduce((sum, row) => sum + row[field], 0);
}

export function registerReportTrialBalanceRoutes(router: Router) {
  router.get(
    "/reports/trial-balance",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const { startDate, endDate, portId, accountType } = req.query;
        const requestedStartDate = readQueryString(startDate);
        const requestedEndDate = readQueryString(endDate);
        const requestedPortId = readQueryString(portId);
        const requestedAccountType = readQueryString(accountType);

        // Build optional filter fragments
        const portFilter = requestedPortId
          ? sql` AND t.port_id = ${requestedPortId}`
          : sql``;
        const acctTypeFilter = requestedAccountType
          ? sql` AND t.account_type = ${requestedAccountType}`
          : sql``;
        const periodStartFilter = requestedStartDate
          ? sql` AND t.trans_date >= ${requestedStartDate}`
          : sql``;
        const periodEndFilter = requestedEndDate
          ? sql` AND t.trans_date <= ${requestedEndDate}`
          : sql``;

        // Opening balance filter (transactions before the start date — no period end cap)
        const openingEndFilter = requestedStartDate
          ? sql` AND t.trans_date < ${requestedStartDate}`
          : sql``;

        // Run all queries in parallel
        const [allAccountTypes, periodAgg, openingAgg] = await Promise.all([
          db.select().from(accountTypes),

          // Period aggregations: GROUP BY account_id — single SQL query replaces O(n×m) JS filter
          db.execute(sql`
          SELECT
            t.account_id AS accountId,
            COUNT(*) AS trans_count,
            SUM(CASE
              WHEN UPPER(t.direction) IN ('IN','DR')
                AND LOWER(COALESCE(t.record_type,'shipment')) NOT IN ('expense-charge','debit-note')
              THEN 1 ELSE 0
            END) AS shipment_count,
            SUM(CASE WHEN UPPER(t.direction) IN ('IN','DR') THEN ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0)) ELSE 0 END) AS debit_usd,
            SUM(CASE WHEN UPPER(t.direction) IN ('IN','DR') THEN ABS(COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)),0)) ELSE 0 END) AS debit_iqd,
            SUM(CASE WHEN UPPER(t.direction) IN ('OUT','CR') THEN ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0)) ELSE 0 END) AS credit_usd,
            SUM(CASE WHEN UPPER(t.direction) IN ('OUT','CR') THEN ABS(COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)),0)) ELSE 0 END) AS credit_iqd,
            SUM(CASE
              WHEN UPPER(t.direction) IN ('IN','DR')
                AND LOWER(COALESCE(t.record_type,'shipment')) NOT IN ('expense-charge','debit-note')
              THEN ABS(COALESCE(CAST(t.cost_usd AS DECIMAL(15,2)),0)) ELSE 0
            END) AS cost_usd,
            SUM(CASE
              WHEN UPPER(t.direction) IN ('IN','DR')
                AND LOWER(COALESCE(t.record_type,'shipment')) NOT IN ('expense-charge','debit-note')
              THEN ABS(COALESCE(CAST(t.cost_iqd AS DECIMAL(15,0)),0)) ELSE 0
            END) AS cost_iqd,
            SUM(CASE
              WHEN UPPER(t.direction) IN ('IN','DR')
                AND LOWER(COALESCE(t.record_type,'shipment')) NOT IN ('expense-charge','debit-note')
              THEN ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0)) - ABS(COALESCE(CAST(t.cost_usd AS DECIMAL(15,2)),0))
              ELSE 0
            END) AS profit_usd,
            SUM(CASE
              WHEN UPPER(t.direction) IN ('IN','DR')
                AND LOWER(COALESCE(t.record_type,'shipment')) NOT IN ('expense-charge','debit-note')
              THEN ABS(COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)),0)) - ABS(COALESCE(CAST(t.cost_iqd AS DECIMAL(15,0)),0))
              ELSE 0
            END) AS profit_iqd
          FROM transactions t
          WHERE 1=1
            ${portFilter}
            ${acctTypeFilter}
            ${periodStartFilter}
            ${periodEndFilter}
          GROUP BY t.account_id
        `),

          // Opening balance aggregations (before startDate)
          requestedStartDate
            ? db.execute(sql`
              SELECT
                t.account_id AS accountId,
                SUM(CASE WHEN UPPER(t.direction) IN ('IN','DR') THEN ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0)) ELSE 0 END) -
                SUM(CASE WHEN UPPER(t.direction) IN ('OUT','CR') THEN ABS(COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)),0)) ELSE 0 END) AS opening_usd,
                SUM(CASE WHEN UPPER(t.direction) IN ('IN','DR') THEN ABS(COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)),0)) ELSE 0 END) -
                SUM(CASE WHEN UPPER(t.direction) IN ('OUT','CR') THEN ABS(COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)),0)) ELSE 0 END) AS opening_iqd
              FROM transactions t
              WHERE 1=1
                ${openingEndFilter}
                ${portFilter}
                ${acctTypeFilter}
              GROUP BY t.account_id
            `)
            : Promise.resolve([]),
        ]);

        const accountTypeNameMap = new Map(
          (allAccountTypes as AccountTypeRow[]).map(row => [
            row.typeId,
            row.name,
          ])
        );

        // Map period aggregations by accountId
        type PeriodAggRow = Record<string, unknown>;
        const periodMap = new Map<number, PeriodAggRow>();
        for (const row of periodAgg as unknown as PeriodAggRow[]) {
          periodMap.set(Number(row.accountId), row);
        }

        // Map opening aggregations by accountId
        type OpeningAggRow = Record<string, unknown>;
        const openingMap = new Map<number, OpeningAggRow>();
        for (const row of openingAgg as unknown as OpeningAggRow[]) {
          openingMap.set(Number(row.accountId), row);
        }

        // Fetch all accounts (small table — metadata only)
        const allAccounts = await db.select().from(accounts);

        const rows: TrialBalanceRow[] = allAccounts
          .map((account): TrialBalanceRow | null => {
            const period = periodMap.get(account.id);
            const opening = openingMap.get(account.id);

            // Skip accounts with no activity
            if (!period && !opening) return null;

            const openingUSD = parseNum(opening?.opening_usd ?? 0);
            const openingIQD = parseNum(opening?.opening_iqd ?? 0);
            const debitUSD = parseNum(period?.debit_usd ?? 0);
            const debitIQD = parseNum(period?.debit_iqd ?? 0);
            const creditUSD = parseNum(period?.credit_usd ?? 0);
            const creditIQD = parseNum(period?.credit_iqd ?? 0);
            const costUSD = parseNum(period?.cost_usd ?? 0);
            const costIQD = parseNum(period?.cost_iqd ?? 0);
            const profitUSD = parseNum(period?.profit_usd ?? 0);
            const profitIQD = parseNum(period?.profit_iqd ?? 0);
            const shipmentCount = parseNum(period?.shipment_count ?? 0);
            const transCount = parseNum(period?.trans_count ?? 0);
            const closingUSD = openingUSD + debitUSD - creditUSD;
            const closingIQD = openingIQD + debitIQD - creditIQD;

            if (transCount === 0 && openingUSD === 0 && openingIQD === 0)
              return null;

            return {
              AccountID: account.id,
              AccountName: account.name,
              AccountType: account.accountType,
              AccountTypeName:
                accountTypeNameMap.get(account.accountType) ||
                account.accountType,
              opening_usd: openingUSD,
              opening_iqd: openingIQD,
              debit_usd: debitUSD,
              debit_iqd: debitIQD,
              credit_usd: creditUSD,
              credit_iqd: creditIQD,
              balance_usd: closingUSD,
              balance_iqd: closingIQD,
              profit_usd: profitUSD,
              profit_iqd: profitIQD,
              cost_usd: costUSD,
              cost_iqd: costIQD,
              shipment_count: shipmentCount,
              trans_count: transCount,
            };
          })
          .filter((row): row is TrialBalanceRow => row !== null);

        const totals = {
          account_count: rows.length,
          opening_usd: sumTrialBalanceField(rows, "opening_usd"),
          opening_iqd: sumTrialBalanceField(rows, "opening_iqd"),
          debit_usd: sumTrialBalanceField(rows, "debit_usd"),
          debit_iqd: sumTrialBalanceField(rows, "debit_iqd"),
          credit_usd: sumTrialBalanceField(rows, "credit_usd"),
          credit_iqd: sumTrialBalanceField(rows, "credit_iqd"),
          balance_usd: sumTrialBalanceField(rows, "balance_usd"),
          balance_iqd: sumTrialBalanceField(rows, "balance_iqd"),
          profit_usd: sumTrialBalanceField(rows, "profit_usd"),
          profit_iqd: sumTrialBalanceField(rows, "profit_iqd"),
          cost_usd: sumTrialBalanceField(rows, "cost_usd"),
          cost_iqd: sumTrialBalanceField(rows, "cost_iqd"),
          shipment_count: sumTrialBalanceField(rows, "shipment_count"),
          trans_count: sumTrialBalanceField(rows, "trans_count"),
        };

        return res.json({ rows, totals });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

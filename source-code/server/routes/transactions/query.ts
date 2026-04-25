import { Router, Response } from "express";
import { and, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { transactions } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db/db";
import {
  getDirectionAliases,
  getStoredDirectionValue,
} from "../../utils/direction";
import {
  enrichTransactions,
  type TransactionEnrichmentRow,
} from "../../utils/transactionEnrichment";

type DecimalLike = string | number | null | undefined;

type TransactionQueryResultRow = {
  id: number | null;
  refNo?: string | null;
  direction: string | null;
  transDate: string | null;
  accountId: DecimalLike;
  currency?: string | null;
  driverId?: DecimalLike;
  vehicleId?: DecimalLike;
  goodTypeId?: DecimalLike;
  weight?: DecimalLike;
  meters?: DecimalLike;
  qty?: DecimalLike;
  costUsd?: DecimalLike;
  amountUsd?: DecimalLike;
  costIqd?: DecimalLike;
  amountIqd?: DecimalLike;
  feeUsd?: DecimalLike;
  syrCus?: DecimalLike;
  carQty?: DecimalLike;
  transPrice?: DecimalLike;
  carrierId?: DecimalLike;
  companyName?: string | null;
  companyId?: DecimalLike;
  govId?: DecimalLike;
  notes?: string | null;
  traderNote?: string | null;
  recordType?: string | null;
  portId?: string | null;
  accountType?: string | null;
  createdBy?: DecimalLike;
  totalCount: DecimalLike;
  shipmentCount: DecimalLike;
  totalWeight: DecimalLike;
  totalMeters: DecimalLike;
  totalInvoicesUSD: DecimalLike;
  totalInvoicesIQD: DecimalLike;
  totalPaymentsUSD: DecimalLike;
  totalPaymentsIQD: DecimalLike;
  totalCostUSD: DecimalLike;
  totalCostIQD: DecimalLike;
  totalProfitUSD: DecimalLike;
  totalProfitIQD: DecimalLike;
  balanceUSD: DecimalLike;
  balanceIQD: DecimalLike;
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

function parsePositiveIntegerQuery(value: unknown): number | undefined {
  const rawValue = readQueryString(value);
  if (!rawValue) return undefined;

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseNonNegativeIntegerQuery(value: unknown): number | undefined {
  const rawValue = readQueryString(value);
  if (!rawValue) return undefined;

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function toNumber(value: DecimalLike) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableInteger(value: DecimalLike) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export function normalizeTransactionQueryResult(
  rawRows: TransactionQueryResultRow[]
) {
  const summarySource = rawRows[0];

  const rows: TransactionEnrichmentRow[] = rawRows
    .filter(row => row.id !== null && row.id !== undefined)
    .map(row => ({
      id: Number(row.id),
      refNo: row.refNo ?? null,
      direction: String(row.direction ?? ""),
      transDate: String(row.transDate ?? ""),
      accountId: Number(row.accountId ?? 0),
      currency: row.currency ?? null,
      driverId: toNullableInteger(row.driverId),
      vehicleId: toNullableInteger(row.vehicleId),
      goodTypeId: toNullableInteger(row.goodTypeId),
      weight: row.weight ?? null,
      meters: row.meters ?? null,
      qty: toNullableInteger(row.qty),
      costUsd: row.costUsd ?? null,
      amountUsd: row.amountUsd ?? null,
      costIqd: row.costIqd ?? null,
      amountIqd: row.amountIqd ?? null,
      feeUsd: row.feeUsd ?? null,
      syrCus: row.syrCus ?? null,
      carQty: toNullableInteger(row.carQty),
      transPrice: row.transPrice ?? null,
      carrierId: toNullableInteger(row.carrierId),
      companyName: row.companyName ?? null,
      companyId: toNullableInteger(row.companyId),
      govId: toNullableInteger(row.govId),
      notes: row.notes ?? null,
      traderNote: row.traderNote ?? null,
      recordType: row.recordType ?? null,
      portId: row.portId ?? null,
      accountType: row.accountType ?? null,
      createdBy: toNullableInteger(row.createdBy),
    }));

  return {
    rows,
    total: toNumber(summarySource?.totalCount),
    summary: {
      count: toNumber(summarySource?.totalCount),
      shipmentCount: toNumber(summarySource?.shipmentCount),
      totalWeight: toNumber(summarySource?.totalWeight),
      totalMeters: toNumber(summarySource?.totalMeters),
      totalInvoicesUSD: toNumber(summarySource?.totalInvoicesUSD),
      totalInvoicesIQD: toNumber(summarySource?.totalInvoicesIQD),
      totalPaymentsUSD: toNumber(summarySource?.totalPaymentsUSD),
      totalPaymentsIQD: toNumber(summarySource?.totalPaymentsIQD),
      totalCostUSD: toNumber(summarySource?.totalCostUSD),
      totalCostIQD: toNumber(summarySource?.totalCostIQD),
      totalProfitUSD: toNumber(summarySource?.totalProfitUSD),
      totalProfitIQD: toNumber(summarySource?.totalProfitIQD),
      balanceUSD: toNumber(summarySource?.balanceUSD),
      balanceIQD: toNumber(summarySource?.balanceIQD),
    },
  };
}

export function registerTransactionQueryRoutes(router: Router) {
  router.get(
    "/transactions",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const {
          portId,
          port,
          accountType,
          type,
          accountId,
          startDate,
          endDate,
          search,
          limit,
          offset,
        } = req.query;
        const conditions: SQL<unknown>[] = [];
        const resolvedPortId = readQueryString(portId) ?? readQueryString(port);
        const resolvedAccountType = readQueryString(accountType);
        const resolvedSearch = readQueryString(search);
        const resolvedAccountId = parsePositiveIntegerQuery(accountId);
        const resolvedLimit = parsePositiveIntegerQuery(limit);
        const resolvedOffset = parseNonNegativeIntegerQuery(offset);
        const resolvedStartDate = readQueryString(startDate);
        const resolvedEndDate = readQueryString(endDate);

        if (resolvedPortId && resolvedPortId !== "null") {
          conditions.push(eq(transactions.portId, resolvedPortId));
        }
        if (resolvedAccountType) {
          conditions.push(eq(transactions.accountType, resolvedAccountType));
        }
        if (type) {
          const direction = getStoredDirectionValue(type);
          conditions.push(
            inArray(transactions.direction, getDirectionAliases(direction))
          );
        }
        if (resolvedAccountId) {
          conditions.push(eq(transactions.accountId, resolvedAccountId));
        }
        if (resolvedStartDate) {
          conditions.push(
            sql`${transactions.transDate} >= ${resolvedStartDate}`
          );
        }
        if (resolvedEndDate) {
          conditions.push(sql`${transactions.transDate} <= ${resolvedEndDate}`);
        }
        if (resolvedSearch) {
          const searchCondition = or(
            like(transactions.refNo, `%${resolvedSearch}%`),
            like(transactions.notes, `%${resolvedSearch}%`),
            like(transactions.traderNote, `%${resolvedSearch}%`)
          );
          if (searchCondition) {
            conditions.push(searchCondition);
          }
        }
        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;
        const whereFragment = whereClause ? sql`WHERE ${whereClause}` : sql``;
        const paginationFragment =
          resolvedLimit !== undefined && resolvedOffset !== undefined
            ? sql`LIMIT ${resolvedLimit} OFFSET ${resolvedOffset}`
            : resolvedLimit !== undefined
              ? sql`LIMIT ${resolvedLimit}`
              : resolvedOffset !== undefined
                ? sql`LIMIT 18446744073709551615 OFFSET ${resolvedOffset}`
                : sql``;

        const rawRows = (await db.execute(sql`
        WITH filtered AS (
          SELECT
            transactions.id AS id,
            transactions.ref_no AS refNo,
            transactions.direction AS direction,
            transactions.trans_date AS transDate,
            transactions.account_id AS accountId,
            transactions.currency AS currency,
            transactions.driver_id AS driverId,
            transactions.vehicle_id AS vehicleId,
            transactions.good_type_id AS goodTypeId,
            transactions.weight AS weight,
            transactions.meters AS meters,
            transactions.qty AS qty,
            transactions.cost_usd AS costUsd,
            transactions.amount_usd AS amountUsd,
            transactions.cost_iqd AS costIqd,
            transactions.amount_iqd AS amountIqd,
            transactions.fee_usd AS feeUsd,
            transactions.syr_cus AS syrCus,
            transactions.car_qty AS carQty,
            transactions.trans_price AS transPrice,
            transactions.carrier_id AS carrierId,
            transactions.company_name AS companyName,
            transactions.company_id AS companyId,
            transactions.gov_id AS govId,
            transactions.notes AS notes,
            transactions.trader_note AS traderNote,
            transactions.record_type AS recordType,
            transactions.port_id AS portId,
            transactions.account_type AS accountType,
            transactions.created_by AS createdBy
          FROM transactions
          ${whereFragment}
        ),
        windowed AS (
          SELECT
            filtered.*,
            COUNT(*) OVER() AS totalCount,
            SUM(CASE
              WHEN UPPER(filtered.direction) IN ('IN', 'DR')
                AND COALESCE(LOWER(filtered.recordType), 'shipment') NOT IN ('expense-charge', 'debit-note')
              THEN 1
              ELSE 0
            END) OVER() AS shipmentCount,
            SUM(CASE
              WHEN UPPER(filtered.direction) IN ('IN', 'DR')
                AND COALESCE(LOWER(filtered.recordType), 'shipment') NOT IN ('expense-charge', 'debit-note')
              THEN ABS(COALESCE(CAST(filtered.weight AS DECIMAL(15,2)), 0))
              ELSE 0
            END) OVER() AS totalWeight,
            SUM(CASE
              WHEN UPPER(filtered.direction) IN ('IN', 'DR')
                AND COALESCE(LOWER(filtered.recordType), 'shipment') NOT IN ('expense-charge', 'debit-note')
              THEN ABS(COALESCE(CAST(filtered.meters AS DECIMAL(15,2)), 0))
              ELSE 0
            END) OVER() AS totalMeters,
            SUM(CASE WHEN UPPER(filtered.direction) IN ('IN', 'DR') THEN ABS(COALESCE(CAST(filtered.amountUsd AS DECIMAL(15,2)), 0)) ELSE 0 END) OVER() AS totalInvoicesUSD,
            SUM(CASE WHEN UPPER(filtered.direction) IN ('IN', 'DR') THEN ABS(COALESCE(CAST(filtered.amountIqd AS DECIMAL(15,0)), 0)) ELSE 0 END) OVER() AS totalInvoicesIQD,
            SUM(CASE WHEN UPPER(filtered.direction) IN ('OUT', 'CR') THEN ABS(COALESCE(CAST(filtered.amountUsd AS DECIMAL(15,2)), 0)) ELSE 0 END) OVER() AS totalPaymentsUSD,
            SUM(CASE WHEN UPPER(filtered.direction) IN ('OUT', 'CR') THEN ABS(COALESCE(CAST(filtered.amountIqd AS DECIMAL(15,0)), 0)) ELSE 0 END) OVER() AS totalPaymentsIQD,
            SUM(CASE
              WHEN UPPER(filtered.direction) IN ('IN', 'DR')
                AND COALESCE(LOWER(filtered.recordType), 'shipment') NOT IN ('expense-charge', 'debit-note')
              THEN ABS(COALESCE(CAST(filtered.amountUsd AS DECIMAL(15,2)), 0))
              ELSE 0
            END) OVER() AS profitSourceInvoicesUSD,
            SUM(CASE
              WHEN UPPER(filtered.direction) IN ('IN', 'DR')
                AND COALESCE(LOWER(filtered.recordType), 'shipment') NOT IN ('expense-charge', 'debit-note')
              THEN ABS(COALESCE(CAST(filtered.amountIqd AS DECIMAL(15,0)), 0))
              ELSE 0
            END) OVER() AS profitSourceInvoicesIQD,
            SUM(CASE
              WHEN UPPER(filtered.direction) IN ('IN', 'DR')
                AND COALESCE(LOWER(filtered.recordType), 'shipment') NOT IN ('expense-charge', 'debit-note')
              THEN ABS(COALESCE(CAST(filtered.costUsd AS DECIMAL(15,2)), 0))
              ELSE 0
            END) OVER() AS totalCostUSD,
            SUM(CASE
              WHEN UPPER(filtered.direction) IN ('IN', 'DR')
                AND COALESCE(LOWER(filtered.recordType), 'shipment') NOT IN ('expense-charge', 'debit-note')
              THEN ABS(COALESCE(CAST(filtered.costIqd AS DECIMAL(15,0)), 0))
              ELSE 0
            END) OVER() AS totalCostIQD
          FROM filtered
        ),
        summary AS (
          SELECT
            COALESCE(MAX(totalCount), 0) AS totalCount,
            COALESCE(MAX(shipmentCount), 0) AS shipmentCount,
            COALESCE(MAX(totalWeight), 0) AS totalWeight,
            COALESCE(MAX(totalMeters), 0) AS totalMeters,
            COALESCE(MAX(totalInvoicesUSD), 0) AS totalInvoicesUSD,
            COALESCE(MAX(totalInvoicesIQD), 0) AS totalInvoicesIQD,
            COALESCE(MAX(totalPaymentsUSD), 0) AS totalPaymentsUSD,
            COALESCE(MAX(totalPaymentsIQD), 0) AS totalPaymentsIQD,
            COALESCE(MAX(profitSourceInvoicesUSD), 0) AS profitSourceInvoicesUSD,
            COALESCE(MAX(profitSourceInvoicesIQD), 0) AS profitSourceInvoicesIQD,
            COALESCE(MAX(totalCostUSD), 0) AS totalCostUSD,
            COALESCE(MAX(totalCostIQD), 0) AS totalCostIQD
          FROM windowed
        ),
        paged AS (
          SELECT *
          FROM filtered
          ORDER BY id ASC
          ${paginationFragment}
        )
        SELECT
          paged.*,
          summary.totalCount,
          summary.shipmentCount,
          summary.totalWeight,
          summary.totalMeters,
          summary.totalInvoicesUSD,
          summary.totalInvoicesIQD,
          summary.totalPaymentsUSD,
          summary.totalPaymentsIQD,
          summary.totalCostUSD,
          summary.totalCostIQD,
          (summary.profitSourceInvoicesUSD - summary.totalCostUSD) AS totalProfitUSD,
          (summary.profitSourceInvoicesIQD - summary.totalCostIQD) AS totalProfitIQD,
          (summary.totalInvoicesUSD - summary.totalPaymentsUSD) AS balanceUSD,
          (summary.totalInvoicesIQD - summary.totalPaymentsIQD) AS balanceIQD
        FROM summary
        LEFT JOIN paged ON TRUE
        ORDER BY paged.id ASC
      `)) as unknown as TransactionQueryResultRow[];

        const normalized = normalizeTransactionQueryResult(rawRows);
        const enrichedRows = await enrichTransactions(db, normalized.rows);

        return res.json({
          transactions: enrichedRows,
          total: normalized.total,
          summary: normalized.summary,
        });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

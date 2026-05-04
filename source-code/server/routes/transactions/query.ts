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

type TransactionSummaryRow = {
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

type TransactionDataRow = {
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
  invoiceNotes?: string | null;
  invoiceDetails?: string | null;
  recordType?: string | null;
  portId?: string | null;
  accountType?: string | null;
  createdBy?: DecimalLike;
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

export function normalizeTransactionRows(rawRows: TransactionDataRow[]) {
  return rawRows
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
      invoiceNotes: row.invoiceNotes ?? null,
      invoiceDetails: row.invoiceDetails ?? null,
      recordType: row.recordType ?? null,
      portId: row.portId ?? null,
      accountType: row.accountType ?? null,
      createdBy: toNullableInteger(row.createdBy),
    }));
}

export function normalizeSummaryRow(summaryRow: TransactionSummaryRow | undefined) {
  return {
    count: toNumber(summaryRow?.totalCount),
    shipmentCount: toNumber(summaryRow?.shipmentCount),
    totalWeight: toNumber(summaryRow?.totalWeight),
    totalMeters: toNumber(summaryRow?.totalMeters),
    totalInvoicesUSD: toNumber(summaryRow?.totalInvoicesUSD),
    totalInvoicesIQD: toNumber(summaryRow?.totalInvoicesIQD),
    totalPaymentsUSD: toNumber(summaryRow?.totalPaymentsUSD),
    totalPaymentsIQD: toNumber(summaryRow?.totalPaymentsIQD),
    totalCostUSD: toNumber(summaryRow?.totalCostUSD),
    totalCostIQD: toNumber(summaryRow?.totalCostIQD),
    totalProfitUSD: toNumber(summaryRow?.totalProfitUSD),
    totalProfitIQD: toNumber(summaryRow?.totalProfitIQD),
    balanceUSD: toNumber(summaryRow?.balanceUSD),
    balanceIQD: toNumber(summaryRow?.balanceIQD),
  };
}

/**
 * Optimized transaction query implementation.
 * 
 * Key improvements over the previous version:
 * 1. Separates the summary aggregation query from the paginated data query.
 *    This avoids the expensive Window Functions (SUM() OVER()) that were
 *    previously computed for every row in the result set.
 * 2. Runs both queries in parallel using Promise.all for faster response.
 * 3. The summary query uses simple GROUP BY aggregation which MySQL can
 *    optimize with covering indexes.
 * 4. The data query is a simple SELECT with pagination, which is fast
 *    even on large datasets with proper indexes.
 */
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

        // Run summary and data queries in parallel for maximum speed
        const [summaryResult, dataResult] = await Promise.all([
          // Summary query: simple aggregation without Window Functions
          db.execute(sql`
            SELECT
              COUNT(*) AS totalCount,
              SUM(CASE
                WHEN UPPER(direction) IN ('IN', 'DR')
                  AND COALESCE(LOWER(record_type), 'shipment') NOT IN ('expense-charge', 'debit-note')
                THEN 1 ELSE 0
              END) AS shipmentCount,
              SUM(CASE
                WHEN UPPER(direction) IN ('IN', 'DR')
                  AND COALESCE(LOWER(record_type), 'shipment') NOT IN ('expense-charge', 'debit-note')
                THEN ABS(COALESCE(CAST(weight AS DECIMAL(15,2)), 0)) ELSE 0
              END) AS totalWeight,
              SUM(CASE
                WHEN UPPER(direction) IN ('IN', 'DR')
                  AND COALESCE(LOWER(record_type), 'shipment') NOT IN ('expense-charge', 'debit-note')
                THEN ABS(COALESCE(CAST(meters AS DECIMAL(15,2)), 0)) ELSE 0
              END) AS totalMeters,
              SUM(CASE WHEN UPPER(direction) IN ('IN', 'DR') THEN ABS(COALESCE(CAST(amount_usd AS DECIMAL(15,2)), 0)) ELSE 0 END) AS totalInvoicesUSD,
              SUM(CASE WHEN UPPER(direction) IN ('IN', 'DR') THEN ABS(COALESCE(CAST(amount_iqd AS DECIMAL(15,0)), 0)) ELSE 0 END) AS totalInvoicesIQD,
              SUM(CASE WHEN UPPER(direction) IN ('OUT', 'CR') THEN ABS(COALESCE(CAST(amount_usd AS DECIMAL(15,2)), 0)) ELSE 0 END) AS totalPaymentsUSD,
              SUM(CASE WHEN UPPER(direction) IN ('OUT', 'CR') THEN ABS(COALESCE(CAST(amount_iqd AS DECIMAL(15,0)), 0)) ELSE 0 END) AS totalPaymentsIQD,
              SUM(CASE
                WHEN UPPER(direction) IN ('IN', 'DR')
                  AND COALESCE(LOWER(record_type), 'shipment') NOT IN ('expense-charge', 'debit-note')
                THEN ABS(COALESCE(CAST(cost_usd AS DECIMAL(15,2)), 0)) ELSE 0
              END) AS totalCostUSD,
              SUM(CASE
                WHEN UPPER(direction) IN ('IN', 'DR')
                  AND COALESCE(LOWER(record_type), 'shipment') NOT IN ('expense-charge', 'debit-note')
                THEN ABS(COALESCE(CAST(cost_iqd AS DECIMAL(15,0)), 0)) ELSE 0
              END) AS totalCostIQD,
              (SUM(CASE
                WHEN UPPER(direction) IN ('IN', 'DR')
                  AND COALESCE(LOWER(record_type), 'shipment') NOT IN ('expense-charge', 'debit-note')
                THEN ABS(COALESCE(CAST(amount_usd AS DECIMAL(15,2)), 0)) ELSE 0
              END) - SUM(CASE
                WHEN UPPER(direction) IN ('IN', 'DR')
                  AND COALESCE(LOWER(record_type), 'shipment') NOT IN ('expense-charge', 'debit-note')
                THEN ABS(COALESCE(CAST(cost_usd AS DECIMAL(15,2)), 0)) ELSE 0
              END)) AS totalProfitUSD,
              (SUM(CASE
                WHEN UPPER(direction) IN ('IN', 'DR')
                  AND COALESCE(LOWER(record_type), 'shipment') NOT IN ('expense-charge', 'debit-note')
                THEN ABS(COALESCE(CAST(amount_iqd AS DECIMAL(15,0)), 0)) ELSE 0
              END) - SUM(CASE
                WHEN UPPER(direction) IN ('IN', 'DR')
                  AND COALESCE(LOWER(record_type), 'shipment') NOT IN ('expense-charge', 'debit-note')
                THEN ABS(COALESCE(CAST(cost_iqd AS DECIMAL(15,0)), 0)) ELSE 0
              END)) AS totalProfitIQD,
              (SUM(CASE WHEN UPPER(direction) IN ('IN', 'DR') THEN ABS(COALESCE(CAST(amount_usd AS DECIMAL(15,2)), 0)) ELSE 0 END)
               - SUM(CASE WHEN UPPER(direction) IN ('OUT', 'CR') THEN ABS(COALESCE(CAST(amount_usd AS DECIMAL(15,2)), 0)) ELSE 0 END)) AS balanceUSD,
              (SUM(CASE WHEN UPPER(direction) IN ('IN', 'DR') THEN ABS(COALESCE(CAST(amount_iqd AS DECIMAL(15,0)), 0)) ELSE 0 END)
               - SUM(CASE WHEN UPPER(direction) IN ('OUT', 'CR') THEN ABS(COALESCE(CAST(amount_iqd AS DECIMAL(15,0)), 0)) ELSE 0 END)) AS balanceIQD
            FROM transactions
            ${whereFragment}
          `),
          // Data query: simple paginated select without aggregation
          db.execute(sql`
            SELECT
              id,
              ref_no AS refNo,
              direction,
              trans_date AS transDate,
              account_id AS accountId,
              currency,
              driver_id AS driverId,
              vehicle_id AS vehicleId,
              good_type_id AS goodTypeId,
              weight,
              meters,
              qty,
              cost_usd AS costUsd,
              amount_usd AS amountUsd,
              cost_iqd AS costIqd,
              amount_iqd AS amountIqd,
              fee_usd AS feeUsd,
              syr_cus AS syrCus,
              car_qty AS carQty,
              trans_price AS transPrice,
              carrier_id AS carrierId,
              company_name AS companyName,
              company_id AS companyId,
              gov_id AS govId,
              notes,
              trader_note AS traderNote,
              invoice_notes AS invoiceNotes,
              invoice_details AS invoiceDetails,
              record_type AS recordType,
              port_id AS portId,
              account_type AS accountType,
              created_by AS createdBy
            FROM transactions
            ${whereFragment}
            ORDER BY id ASC
            ${paginationFragment}
          `),
        ]);

        // db.execute() returns [rows, fields] in mysql2/drizzle
        const [summaryRows] = summaryResult as unknown as [TransactionSummaryRow[], unknown];
        const [dataRows] = dataResult as unknown as [TransactionDataRow[], unknown];

        const rows = normalizeTransactionRows(dataRows);
        const summary = normalizeSummaryRow(summaryRows[0]);
        const enrichedRows = await enrichTransactions(db, rows);

        // Allow browser to cache for 30 seconds to avoid refetch on navigation
        res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
        return res.json({
          transactions: enrichedRows,
          total: summary.count,
          summary,
        });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

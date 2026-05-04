import { and, eq, inArray } from "drizzle-orm";
import type { AppDb } from "../db/schema/dbTypes";
import {
  accounts,
  companies,
  customFields,
  customFieldValues,
  drivers,
  goodsTypes,
  governorates,
  vehicles,
} from "../../drizzle/schema";
import { isInvoiceDirection } from "./direction";
import { lookupDataCache } from "../_core/redisCache";

// ============================================================================
// In-process lookup maps cache (refreshed every 2 minutes)
// Avoids hitting DB for every enrichment call for quasi-static data
// ============================================================================
type LookupMaps = {
  accountMap: Map<number, string>;
  driverMap: Map<number, string>;
  vehicleMap: Map<number, string>;
  goodMap: Map<number, string>;
  governorateMap: Map<number, string>;
  companyMap: Map<number, string>;
};

let _cachedLookupMaps: LookupMaps | null = null;
let _lookupMapsExpiry = 0;
const LOOKUP_MAPS_TTL_MS = 2 * 60 * 1000; // 2 minutes

async function getOrLoadLookupMaps(db: AppDb): Promise<LookupMaps> {
  if (_cachedLookupMaps && Date.now() < _lookupMapsExpiry) {
    return _cachedLookupMaps;
  }

  const [allAccounts, allDrivers, allVehicles, allGoods, allGovernorates, allCompanies] =
    await Promise.all([
      db.select().from(accounts),
      db.select().from(drivers),
      db.select().from(vehicles),
      db.select().from(goodsTypes),
      db.select().from(governorates),
      db.select().from(companies),
    ]);

  _cachedLookupMaps = {
    accountMap: new Map(allAccounts.map((a: AccountRow) => [a.id, a.name])),
    driverMap: new Map(allDrivers.map((d: DriverRow) => [d.id, d.name])),
    vehicleMap: new Map(allVehicles.map((v: VehicleRow) => [v.id, v.plateNumber])),
    goodMap: new Map(allGoods.map((g: GoodTypeRow) => [g.id, g.name])),
    governorateMap: new Map(allGovernorates.map((g: GovernorateRow) => [g.id, g.name])),
    companyMap: new Map(allCompanies.map((c: CompanyRow) => [c.id, c.name])),
  };
  _lookupMapsExpiry = Date.now() + LOOKUP_MAPS_TTL_MS;
  return _cachedLookupMaps;
}

/** Call this when lookup data is mutated (e.g. account/driver/vehicle added/updated) */
export function invalidateEnrichmentLookupCache() {
  _cachedLookupMaps = null;
  _lookupMapsExpiry = 0;
}

type CustomFieldRow = typeof customFields.$inferSelect;
type CustomFieldValueRow = typeof customFieldValues.$inferSelect;
type AccountRow = typeof accounts.$inferSelect;
type DriverRow = typeof drivers.$inferSelect;
type VehicleRow = typeof vehicles.$inferSelect;
type GoodTypeRow = typeof goodsTypes.$inferSelect;
type GovernorateRow = typeof governorates.$inferSelect;
type CompanyRow = typeof companies.$inferSelect;

type DecimalLike = string | number | null | undefined;

type TransactionNameFields = {
  _accountName?: string;
  _driverName?: string;
  _vehiclePlate?: string;
  _goodTypeName?: string;
  _govName?: string;
  _carrierName?: string;
  _companyName?: string;
};

type TransactionMapInput = {
  id: number;
  refNo?: string | null;
  direction: string;
  transDate: string;
  accountId: number;
  currency?: string | null;
  driverId?: number | null;
  vehicleId?: number | null;
  goodTypeId?: number | null;
  weight?: DecimalLike;
  meters?: DecimalLike;
  costUsd?: DecimalLike;
  amountUsd?: DecimalLike;
  costIqd?: DecimalLike;
  amountIqd?: DecimalLike;
  feeUsd?: DecimalLike;
  syrCus?: DecimalLike;
  cost_usd?: DecimalLike;
  amount_usd?: DecimalLike;
  cost_iqd?: DecimalLike;
  amount_iqd?: DecimalLike;
  fee_usd?: DecimalLike;
  syr_cus?: DecimalLike;
  carQty?: number | null;
  transPrice?: DecimalLike;
  carrierId?: number | null;
  qty?: number | null;
  companyId?: number | null;
  companyName?: string | null;
  govId?: number | null;
  notes?: string | null;
  traderNote?: string | null;
  invoiceNotes?: string | null;
  invoiceDetails?: string | null;
  recordType?: string | null;
  portId?: string | null;
  accountType?: string | null;
  createdBy?: number | null;
} & TransactionNameFields;

type LookupEntityType =
  | "driver"
  | "vehicle"
  | "goodType"
  | "governorate"
  | "company"
  | "account";

type LookupOption = {
  id: number;
  name: string;
};

export type EnrichedTransactionRecord = ReturnType<typeof mapTransaction>;
export type TransactionEnrichmentRow = TransactionMapInput;

function parseNullableAmount(value: DecimalLike): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number.parseFloat(String(value));
}

function parseAmountOrZero(value: DecimalLike): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  return Number.parseFloat(String(value));
}

function normalizeRecordType(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function isDebitNoteRecordType(value: unknown): boolean {
  const normalized = normalizeRecordType(value);
  return (
    normalized === "debit-note" || String(value ?? "").trim() === "سند إضافة"
  );
}

function isExpenseChargeRecordType(value: unknown): boolean {
  return normalizeRecordType(value) === "expense-charge";
}

function getNameById(map: Map<number, string>, id?: number | null): string {
  if (id === null || id === undefined) {
    return "";
  }

  return map.get(id) || "";
}

export function mapTransaction(
  transaction: TransactionMapInput,
  driverName?: string,
  vehiclePlate?: string,
  goodTypeName?: string,
  governorateName?: string,
  customFieldData: Record<string, unknown> = {}
) {
  const invoiceDirection = isInvoiceDirection(transaction.direction);
  const isDebitNote = isDebitNoteRecordType(transaction.recordType);
  const isExpenseCharge = isExpenseChargeRecordType(transaction.recordType);
  const showAsAdjustment = isDebitNote || isExpenseCharge;
  const transactionTypeId = showAsAdjustment ? 3 : invoiceDirection ? 1 : 2;
  const transactionTypeName = isDebitNote
    ? "سند إضافة"
    : isExpenseCharge
      ? "مصروف محمل على التاجر"
      : invoiceDirection
        ? "فاتورة"
        : "سند قبض";
  const includeProfit = invoiceDirection && !showAsAdjustment;

  return {
    TransID: transaction.id,
    RefNo: transaction.refNo || `REF-${transaction.id}`,
    TransTypeID: transactionTypeId,
    TransTypeName: transactionTypeName,
    TransDate: transaction.transDate,
    AccountID: transaction.accountId,
    AccountName: transaction._accountName || "",
    Currency: transaction.currency,
    DriverID: transaction.driverId,
    DriverName: driverName || transaction._driverName || "",
    VehicleID: transaction.vehicleId,
    VehiclePlate: vehiclePlate || transaction._vehiclePlate || "",
    GoodTypeID: transaction.goodTypeId,
    GoodTypeName: goodTypeName || transaction._goodTypeName || "",
    GoodType: goodTypeName || transaction._goodTypeName || "",
    Weight: parseNullableAmount(transaction.weight),
    Meters: parseNullableAmount(transaction.meters),
    CostUSD: parseAmountOrZero(transaction.costUsd ?? transaction.cost_usd),
    AmountUSD: parseAmountOrZero(transaction.amountUsd ?? transaction.amount_usd),
    CostIQD: parseAmountOrZero(transaction.costIqd ?? transaction.cost_iqd),
    AmountIQD: parseAmountOrZero(transaction.amountIqd ?? transaction.amount_iqd),
    FeeUSD: parseAmountOrZero(transaction.feeUsd ?? transaction.fee_usd),
    SyrCus: parseAmountOrZero(transaction.syrCus ?? transaction.syr_cus),
    CarQty: transaction.carQty || null,
    TransPrice: parseNullableAmount(transaction.transPrice),
    CarrierID: transaction.carrierId || null,
    CarrierName: transaction._carrierName || "",
    Qty: transaction.qty || null,
    CompanyID: transaction.companyId || null,
    CompanyName: transaction._companyName || transaction.companyName || "",
    GovID: transaction.govId,
    Governorate: governorateName || transaction._govName || "",
    Notes: transaction.notes,
    TraderNote: transaction.traderNote,
    InvoiceNotes: transaction.invoiceNotes || "",
    InvoiceDetails: transaction.invoiceDetails || "",
    RecordType: transaction.recordType,
    PortID: transaction.portId,
    AccountType: transaction.accountType,
    CreatedBy: transaction.createdBy,
    ProfitUSD: includeProfit
      ? parseAmountOrZero(transaction.amountUsd) -
        parseAmountOrZero(transaction.costUsd)
      : 0,
    ProfitIQD: includeProfit
      ? parseAmountOrZero(transaction.amountIqd) -
        parseAmountOrZero(transaction.costIqd)
      : 0,
    direction: transaction.direction,
    CustomFieldValues: customFieldData,
    ...customFieldData,
  };
}

export async function enrichTransactions(
  db: AppDb,
  transactionsRows: TransactionEnrichmentRow[]
): Promise<EnrichedTransactionRecord[]> {
  if (transactionsRows.length === 0) return [];

  // Use cached lookup maps instead of per-request DB queries
  // This reduces 6 DB queries to 0 on cache hit (refreshed every 2 min)
  const lookupMaps = await getOrLoadLookupMaps(db);
  const { accountMap, driverMap, vehicleMap, goodMap, governorateMap, companyMap } = lookupMaps;

  // Custom field values are per-transaction so they must be fetched each time
  const transactionIds = transactionsRows
    .map(transaction => transaction.id)
    .filter(Boolean);

  const customValues =
    transactionIds.length > 0
      ? await db
          .select()
          .from(customFieldValues)
          .where(
            and(
              eq(customFieldValues.entityType, "transaction"),
              inArray(customFieldValues.entityId, transactionIds)
            )
          )
      : [];
  const customFieldIds = Array.from(
    new Set(
      customValues
        .map(valueRow => valueRow.customFieldId)
        .filter((value): value is number => Boolean(value))
    )
  );

  const filteredCustomFields = customFieldIds.length > 0
    ? await db
        .select()
        .from(customFields)
        .where(inArray(customFields.id, customFieldIds))
    : [];

  const customFieldMap = new Map<number, CustomFieldRow>(
    filteredCustomFields.map((field: CustomFieldRow) => [field.id, field])
  );
  const customValuesByEntity = new Map<number, Record<string, unknown>>();

  for (const valueRow of customValues as CustomFieldValueRow[]) {
    const field = customFieldMap.get(valueRow.customFieldId);
    if (!field) continue;

    const entityValues = customValuesByEntity.get(valueRow.entityId) || {};
    const rawValue = valueRow.value;
    let normalizedValue: unknown = rawValue;

    if (field.fieldType === "number" || field.fieldType === "money") {
      const parsed = Number(rawValue);
      normalizedValue = Number.isFinite(parsed) ? parsed : rawValue;
    }

    entityValues[field.fieldKey] = normalizedValue;
    customValuesByEntity.set(valueRow.entityId, entityValues);
  }

  return transactionsRows.map(transaction => {
    const enrichedTransaction: TransactionMapInput = {
      ...transaction,
      _accountName: getNameById(accountMap, transaction.accountId),
      _driverName: getNameById(driverMap, transaction.driverId),
      _vehiclePlate: getNameById(vehicleMap, transaction.vehicleId),
      _goodTypeName: getNameById(goodMap, transaction.goodTypeId),
      _govName: getNameById(governorateMap, transaction.govId),
      _carrierName: getNameById(accountMap, transaction.carrierId),
      _companyName:
        getNameById(companyMap, transaction.companyId) ||
        transaction.companyName ||
        "",
    };

    return mapTransaction(
      enrichedTransaction,
      enrichedTransaction._driverName,
      enrichedTransaction._vehiclePlate,
      enrichedTransaction._goodTypeName,
      enrichedTransaction._govName,
      customValuesByEntity.get(transaction.id) || {}
    );
  });
}

export async function getLookupNameById(
  db: AppDb,
  type: LookupEntityType,
  id?: number | null
): Promise<LookupOption | null> {
  if (!id) return null;

  if (type === "driver") {
    const [row] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, id))
      .limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }
  if (type === "vehicle") {
    const [row] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);
    return row ? { id: row.id, name: row.plateNumber } : null;
  }
  if (type === "goodType") {
    const [row] = await db
      .select()
      .from(goodsTypes)
      .where(eq(goodsTypes.id, id))
      .limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }
  if (type === "governorate") {
    const [row] = await db
      .select()
      .from(governorates)
      .where(eq(governorates.id, id))
      .limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }
  if (type === "company") {
    const [row] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }
  if (type === "account") {
    const [row] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }

  return null;
}

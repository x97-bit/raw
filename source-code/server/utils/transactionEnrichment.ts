import { and, eq, inArray } from "drizzle-orm";
import type { AppDb } from "../dbTypes";
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
  carQty?: number | null;
  transPrice?: DecimalLike;
  carrierId?: number | null;
  qty?: number | null;
  companyId?: number | null;
  companyName?: string | null;
  govId?: number | null;
  notes?: string | null;
  traderNote?: string | null;
  recordType?: string | null;
  portId?: string | null;
  accountType?: string | null;
  createdBy?: number | null;
} & TransactionNameFields;

type LookupEntityType = "driver" | "vehicle" | "goodType" | "governorate" | "company" | "account";

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
  customFieldData: Record<string, unknown> = {},
) {
  const invoiceDirection = isInvoiceDirection(transaction.direction);

  return {
    TransID: transaction.id,
    RefNo: transaction.refNo || `REF-${transaction.id}`,
    TransTypeID: invoiceDirection ? 1 : 2,
    TransTypeName: invoiceDirection ? "فاتورة" : "سند قبض",
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
    CostUSD: parseAmountOrZero(transaction.costUsd),
    AmountUSD: parseAmountOrZero(transaction.amountUsd),
    CostIQD: parseAmountOrZero(transaction.costIqd),
    AmountIQD: parseAmountOrZero(transaction.amountIqd),
    FeeUSD: parseAmountOrZero(transaction.feeUsd),
    SyrCus: parseAmountOrZero(transaction.syrCus),
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
    RecordType: transaction.recordType,
    PortID: transaction.portId,
    AccountType: transaction.accountType,
    CreatedBy: transaction.createdBy,
    ProfitUSD: invoiceDirection
      ? parseAmountOrZero(transaction.amountUsd) - parseAmountOrZero(transaction.costUsd)
      : 0,
    ProfitIQD: invoiceDirection
      ? parseAmountOrZero(transaction.amountIqd) - parseAmountOrZero(transaction.costIqd)
      : 0,
    direction: transaction.direction,
    amount_usd: parseAmountOrZero(transaction.amountUsd),
    amount_iqd: parseAmountOrZero(transaction.amountIqd),
    cost_usd: parseAmountOrZero(transaction.costUsd),
    cost_iqd: parseAmountOrZero(transaction.costIqd),
    fee_usd: parseAmountOrZero(transaction.feeUsd),
    company_id: transaction.companyId || null,
    company_name: transaction._companyName || transaction.companyName || null,
    CustomFieldValues: customFieldData,
    ...customFieldData,
  };
}

export async function enrichTransactions(
  db: AppDb,
  transactionsRows: TransactionEnrichmentRow[],
): Promise<EnrichedTransactionRecord[]> {
  if (transactionsRows.length === 0) return [];

  const transactionIds = transactionsRows.map((transaction) => transaction.id).filter(Boolean);
  const accountIds = Array.from(new Set(
    transactionsRows.flatMap((transaction) => [transaction.accountId, transaction.carrierId]).filter((value): value is number => Boolean(value)),
  ));
  const driverIds = Array.from(new Set(
    transactionsRows.map((transaction) => transaction.driverId).filter((value): value is number => Boolean(value)),
  ));
  const vehicleIds = Array.from(new Set(
    transactionsRows.map((transaction) => transaction.vehicleId).filter((value): value is number => Boolean(value)),
  ));
  const goodTypeIds = Array.from(new Set(
    transactionsRows.map((transaction) => transaction.goodTypeId).filter((value): value is number => Boolean(value)),
  ));
  const governorateIds = Array.from(new Set(
    transactionsRows.map((transaction) => transaction.govId).filter((value): value is number => Boolean(value)),
  ));
  const companyIds = Array.from(new Set(
    transactionsRows.map((transaction) => transaction.companyId).filter((value): value is number => Boolean(value)),
  ));

  const customValues = transactionIds.length > 0
    ? await db.select().from(customFieldValues).where(and(
      eq(customFieldValues.entityType, "transaction"),
      inArray(customFieldValues.entityId, transactionIds),
    ))
    : [];
  const customFieldIds = Array.from(new Set(
    customValues.map((valueRow) => valueRow.customFieldId).filter((value): value is number => Boolean(value)),
  ));

  const [
    filteredAccounts,
    filteredDrivers,
    filteredVehicles,
    filteredGoods,
    filteredGovernorates,
    filteredCompanies,
    filteredCustomFields,
  ] = await Promise.all([
    accountIds.length > 0
      ? db.select().from(accounts).where(inArray(accounts.id, accountIds))
      : Promise.resolve([]),
    driverIds.length > 0
      ? db.select().from(drivers).where(inArray(drivers.id, driverIds))
      : Promise.resolve([]),
    vehicleIds.length > 0
      ? db.select().from(vehicles).where(inArray(vehicles.id, vehicleIds))
      : Promise.resolve([]),
    goodTypeIds.length > 0
      ? db.select().from(goodsTypes).where(inArray(goodsTypes.id, goodTypeIds))
      : Promise.resolve([]),
    governorateIds.length > 0
      ? db.select().from(governorates).where(inArray(governorates.id, governorateIds))
      : Promise.resolve([]),
    companyIds.length > 0
      ? db.select().from(companies).where(inArray(companies.id, companyIds))
      : Promise.resolve([]),
    customFieldIds.length > 0
      ? db.select().from(customFields).where(inArray(customFields.id, customFieldIds))
      : Promise.resolve([]),
  ]);

  const accountMap = new Map<number, string>(
    filteredAccounts.map((account: AccountRow) => [account.id, account.name]),
  );
  const driverMap = new Map<number, string>(
    filteredDrivers.map((driver: DriverRow) => [driver.id, driver.name]),
  );
  const vehicleMap = new Map<number, string>(
    filteredVehicles.map((vehicle: VehicleRow) => [vehicle.id, vehicle.plateNumber]),
  );
  const goodMap = new Map<number, string>(
    filteredGoods.map((good: GoodTypeRow) => [good.id, good.name]),
  );
  const governorateMap = new Map<number, string>(
    filteredGovernorates.map((governorate: GovernorateRow) => [governorate.id, governorate.name]),
  );
  const companyMap = new Map<number, string>(
    filteredCompanies.map((company: CompanyRow) => [company.id, company.name]),
  );
  const customFieldMap = new Map<number, CustomFieldRow>(
    filteredCustomFields.map((field: CustomFieldRow) => [field.id, field]),
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

  return transactionsRows.map((transaction) => {
    const enrichedTransaction: TransactionMapInput = {
      ...transaction,
      _accountName: getNameById(accountMap, transaction.accountId),
      _driverName: getNameById(driverMap, transaction.driverId),
      _vehiclePlate: getNameById(vehicleMap, transaction.vehicleId),
      _goodTypeName: getNameById(goodMap, transaction.goodTypeId),
      _govName: getNameById(governorateMap, transaction.govId),
      _carrierName: getNameById(accountMap, transaction.carrierId),
      _companyName: getNameById(companyMap, transaction.companyId) || transaction.companyName || "",
    };

    return mapTransaction(
      enrichedTransaction,
      enrichedTransaction._driverName,
      enrichedTransaction._vehiclePlate,
      enrichedTransaction._goodTypeName,
      enrichedTransaction._govName,
      customValuesByEntity.get(transaction.id) || {},
    );
  });
}

export async function getLookupNameById(
  db: AppDb,
  type: LookupEntityType,
  id?: number | null,
): Promise<LookupOption | null> {
  if (!id) return null;

  if (type === "driver") {
    const [row] = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }
  if (type === "vehicle") {
    const [row] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
    return row ? { id: row.id, name: row.plateNumber } : null;
  }
  if (type === "goodType") {
    const [row] = await db.select().from(goodsTypes).where(eq(goodsTypes.id, id)).limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }
  if (type === "governorate") {
    const [row] = await db.select().from(governorates).where(eq(governorates.id, id)).limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }
  if (type === "company") {
    const [row] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }
  if (type === "account") {
    const [row] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
    return row ? { id: row.id, name: row.name } : null;
  }

  return null;
}

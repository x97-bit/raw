import { and, eq, inArray } from "drizzle-orm";
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

export function mapTransaction(
  transaction: any,
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
    Weight: transaction.weight ? parseFloat(transaction.weight) : null,
    Meters: transaction.meters ? parseFloat(transaction.meters) : null,
    CostUSD: transaction.costUsd ? parseFloat(transaction.costUsd) : 0,
    AmountUSD: transaction.amountUsd ? parseFloat(transaction.amountUsd) : 0,
    CostIQD: transaction.costIqd ? parseFloat(transaction.costIqd) : 0,
    AmountIQD: transaction.amountIqd ? parseFloat(transaction.amountIqd) : 0,
    FeeUSD: transaction.feeUsd ? parseFloat(transaction.feeUsd) : 0,
    SyrCus: transaction.syrCus ? parseFloat(transaction.syrCus) : 0,
    CarQty: transaction.carQty || null,
    TransPrice: transaction.transPrice ? parseFloat(transaction.transPrice) : null,
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
      ? (transaction.amountUsd ? parseFloat(transaction.amountUsd) : 0) - (transaction.costUsd ? parseFloat(transaction.costUsd) : 0)
      : 0,
    ProfitIQD: invoiceDirection
      ? (transaction.amountIqd ? parseFloat(transaction.amountIqd) : 0) - (transaction.costIqd ? parseFloat(transaction.costIqd) : 0)
      : 0,
    direction: transaction.direction,
    amount_usd: transaction.amountUsd ? parseFloat(transaction.amountUsd) : 0,
    amount_iqd: transaction.amountIqd ? parseFloat(transaction.amountIqd) : 0,
    cost_usd: transaction.costUsd ? parseFloat(transaction.costUsd) : 0,
    cost_iqd: transaction.costIqd ? parseFloat(transaction.costIqd) : 0,
    fee_usd: transaction.feeUsd ? parseFloat(transaction.feeUsd) : 0,
    company_id: transaction.companyId || null,
    company_name: transaction._companyName || transaction.companyName || null,
    CustomFieldValues: customFieldData,
    ...customFieldData,
  };
}

export async function enrichTransactions(db: any, transactionsRows: any[]) {
  if (transactionsRows.length === 0) return [];

  const transactionIds = transactionsRows.map((transaction) => transaction.id).filter(Boolean);
  const [
    allAccounts,
    allDrivers,
    allVehicles,
    allGoods,
    allGovernorates,
    allCompanies,
    allCustomFields,
    allCustomValues,
  ] = await Promise.all([
    db.select().from(accounts),
    db.select().from(drivers),
    db.select().from(vehicles),
    db.select().from(goodsTypes),
    db.select().from(governorates),
    db.select().from(companies),
    db.select().from(customFields),
    transactionIds.length > 0
      ? db.select().from(customFieldValues).where(and(
          eq(customFieldValues.entityType, "transaction"),
          inArray(customFieldValues.entityId, transactionIds),
        ))
      : Promise.resolve([]),
  ]);

  const accountMap = new Map(allAccounts.map((account: any) => [account.id, account.name]));
  const driverMap = new Map(allDrivers.map((driver: any) => [driver.id, driver.name]));
  const vehicleMap = new Map(allVehicles.map((vehicle: any) => [vehicle.id, vehicle.plateNumber]));
  const goodMap = new Map(allGoods.map((good: any) => [good.id, good.name]));
  const governorateMap = new Map(allGovernorates.map((governorate: any) => [governorate.id, governorate.name]));
  const companyMap = new Map(allCompanies.map((company: any) => [company.id, company.name]));
  const customFieldMap = new Map<number, CustomFieldRow>(
    (allCustomFields as CustomFieldRow[]).map((field) => [field.id, field]),
  );
  const customValuesByEntity = new Map<number, Record<string, unknown>>();

  for (const valueRow of allCustomValues as any[]) {
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

  return transactionsRows.map((transaction: any) => {
    transaction._accountName = (accountMap.get(transaction.accountId) as string) || "";
    transaction._driverName = (driverMap.get(transaction.driverId) as string) || "";
    transaction._vehiclePlate = (vehicleMap.get(transaction.vehicleId) as string) || "";
    transaction._goodTypeName = (goodMap.get(transaction.goodTypeId) as string) || "";
    transaction._govName = (governorateMap.get(transaction.govId) as string) || "";
    transaction._carrierName = (accountMap.get(transaction.carrierId) as string) || "";
    transaction._companyName = (companyMap.get(transaction.companyId) as string) || transaction.companyName || "";

    return mapTransaction(
      transaction,
      transaction._driverName,
      transaction._vehiclePlate,
      transaction._goodTypeName,
      transaction._govName,
      customValuesByEntity.get(transaction.id) || {},
    );
  });
}

export async function getLookupNameById(db: any, type: string, id?: number | null) {
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

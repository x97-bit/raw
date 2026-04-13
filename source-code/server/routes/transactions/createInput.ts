import { z } from "zod";
import { desc } from "drizzle-orm";
import { drivers, goodsTypes, transactions, vehicles } from "../../../drizzle/schema";
import { validateInput } from "../../_core/requestValidation";
import type { AppDb } from "../../dbTypes";
import { getStoredDirectionValue, isInvoiceDirection } from "../../utils/direction";
import { parseOptionalDecimal, parseOptionalInt, pickBodyField } from "../../utils/bodyFields";
import { transactionCreateSchema } from "../../utils/financialValidation";
import { TRANSACTION_VALIDATION_MESSAGE } from "./shared";
import { getTrimmedText, resolveCompanySelection, resolveNewLookupId } from "./builderHelpers";

type TransactionMutationBody = Record<string, unknown>;
type TransactionCreatePayload = z.infer<typeof transactionCreateSchema>;

export async function buildTransactionCreateInput(
  db: AppDb,
  body: TransactionMutationBody,
  createdBy: number,
): Promise<{ data: TransactionCreatePayload; refNo: string }> {
  const accountId = pickBodyField(body, "accountId", "AccountID", "account_id");
  const direction = getStoredDirectionValue(pickBodyField(body, "type", "TransTypeID", "direction"));

  const [lastTransaction] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .orderBy(desc(transactions.id))
    .limit(1);
  const nextNumber = (lastTransaction?.id || 0) + 1;
  const rawPortId = String(pickBodyField(body, "portId", "PortID", "port_id") ?? "GEN");
  const prefix = rawPortId.toUpperCase().replace(/[^A-Z]/g, "").substring(0, 5) || "GEN";
  const refNo = `${prefix}-${isInvoiceDirection(direction) ? "INV" : "PAY"}${String(nextNumber).padStart(6, "0")}`;

  const inputDriverId = pickBodyField(body, "driverId", "DriverID", "driver_id") ?? null;
  const inputVehicleId = pickBodyField(body, "vehicleId", "VehicleID", "vehicle_id") ?? null;
  const inputGoodTypeId = pickBodyField(body, "goodTypeId", "GoodTypeID", "good_type_id") ?? null;
  const newDriverName = getTrimmedText(body._newDriverName);
  const newPlateNumber = getTrimmedText(body._newPlateNumber);
  const newGoodType = getTrimmedText(body._newGoodType);

  const resolvedDriverId = await resolveNewLookupId(
    db,
    inputDriverId,
    drivers,
    { name: newDriverName ?? "" },
    body._newDriverName,
  );
  const resolvedVehicleId = await resolveNewLookupId(
    db,
    inputVehicleId,
    vehicles,
    { plateNumber: newPlateNumber ?? "" },
    body._newPlateNumber,
  );
  const resolvedGoodTypeId = await resolveNewLookupId(
    db,
    inputGoodTypeId,
    goodsTypes,
    { name: newGoodType ?? "" },
    body._newGoodType,
  );

  const { companyId, companyName } = await resolveCompanySelection(
    db,
    pickBodyField(body, "companyId", "CompanyID", "company_id"),
    pickBodyField(body, "companyName", "CompanyName", "company_name"),
  );

  const data = validateInput(
    transactionCreateSchema,
    {
      refNo,
      direction,
      transDate: String(
        pickBodyField(body, "transDate", "TransDate", "trans_date", "date") ??
          new Date().toISOString().split("T")[0],
      ),
      accountId: parseInt(String(accountId), 10),
      currency: String(pickBodyField(body, "currency", "Currency") ?? "BOTH"),
      driverId: parseOptionalInt(resolvedDriverId) ?? null,
      vehicleId: parseOptionalInt(resolvedVehicleId) ?? null,
      goodTypeId: parseOptionalInt(resolvedGoodTypeId) ?? null,
      weight: parseOptionalDecimal(pickBodyField(body, "weight", "Weight")) ?? null,
      meters: parseOptionalDecimal(pickBodyField(body, "meters", "Meters")) ?? null,
      costUsd: parseOptionalDecimal(pickBodyField(body, "costUsd", "CostUSD", "cost_usd")) ?? "0",
      amountUsd: parseOptionalDecimal(pickBodyField(body, "amountUsd", "AmountUSD", "amount_usd")) ?? "0",
      costIqd: parseOptionalDecimal(pickBodyField(body, "costIqd", "CostIQD", "cost_iqd")) ?? "0",
      amountIqd: parseOptionalDecimal(pickBodyField(body, "amountIqd", "AmountIQD", "amount_iqd")) ?? "0",
      feeUsd: parseOptionalDecimal(pickBodyField(body, "feeUsd", "FeeUSD", "fee_usd")) ?? "0",
      syrCus: parseOptionalDecimal(pickBodyField(body, "syrCus", "SyrCus", "syr_cus")) ?? "0",
      carQty: parseOptionalInt(pickBodyField(body, "carQty", "CarQty", "car_qty")) ?? null,
      transPrice: parseOptionalDecimal(pickBodyField(body, "transPrice", "TransPrice", "trans_price")) ?? null,
      carrierId: parseOptionalInt(pickBodyField(body, "carrierId", "CarrierID", "carrier_id")) ?? null,
      qty: parseOptionalInt(pickBodyField(body, "qty", "Qty")) ?? null,
      companyId: parseOptionalInt(companyId) ?? null,
      companyName,
      govId: parseOptionalInt(pickBodyField(body, "govId", "GovID", "gov_id")) ?? null,
      notes: pickBodyField(body, "notes", "Notes") ?? null,
      traderNote: pickBodyField(body, "traderNote", "TraderNote", "trader_note") ?? null,
      recordType: String(pickBodyField(body, "recordType", "RecordType", "record_type") ?? "shipment"),
      portId: String(pickBodyField(body, "portId", "PortID", "port_id") ?? ""),
      accountType: String(pickBodyField(body, "accountType", "AccountTypeID", "account_type") ?? ""),
      createdBy,
    },
    TRANSACTION_VALIDATION_MESSAGE,
  );

  return { data, refNo };
}

import { eq } from "drizzle-orm";
import { companies } from "../../../drizzle/schema";
import { validateInput } from "../../_core/requestValidation";
import {
  hasBodyKey,
  hasBodyValue,
  parseOptionalDecimal,
  parseOptionalInt,
  pickBodyField,
} from "../../utils/bodyFields";
import { transactionUpdateSchema } from "../../utils/financialValidation";
import { TRANSACTION_UPDATE_VALIDATION_MESSAGE } from "./shared";

type TransactionMutationBody = Record<string, any>;

export async function buildTransactionUpdateInput(db: any, body: TransactionMutationBody) {
  const updates: Record<string, unknown> = {};

  if (hasBodyKey(body, "transDate", "TransDate", "trans_date", "date")) {
    updates.transDate = pickBodyField(body, "transDate", "TransDate", "trans_date", "date") ?? null;
  }
  if (hasBodyKey(body, "amountUsd", "AmountUSD", "amount_usd")) {
    updates.amountUsd = parseOptionalDecimal(pickBodyField(body, "amountUsd", "AmountUSD", "amount_usd")) ?? "0";
  }
  if (hasBodyKey(body, "amountIqd", "AmountIQD", "amount_iqd")) {
    updates.amountIqd = parseOptionalDecimal(pickBodyField(body, "amountIqd", "AmountIQD", "amount_iqd")) ?? "0";
  }
  if (hasBodyKey(body, "costUsd", "CostUSD", "cost_usd")) {
    updates.costUsd = parseOptionalDecimal(pickBodyField(body, "costUsd", "CostUSD", "cost_usd")) ?? "0";
  }
  if (hasBodyKey(body, "costIqd", "CostIQD", "cost_iqd")) {
    updates.costIqd = parseOptionalDecimal(pickBodyField(body, "costIqd", "CostIQD", "cost_iqd")) ?? "0";
  }
  if (hasBodyKey(body, "feeUsd", "FeeUSD", "fee_usd")) {
    updates.feeUsd = parseOptionalDecimal(pickBodyField(body, "feeUsd", "FeeUSD", "fee_usd")) ?? "0";
  }
  if (hasBodyKey(body, "weight", "Weight")) {
    updates.weight = parseOptionalDecimal(pickBodyField(body, "weight", "Weight")) ?? null;
  }
  if (hasBodyKey(body, "meters", "Meters")) {
    updates.meters = parseOptionalDecimal(pickBodyField(body, "meters", "Meters")) ?? null;
  }
  if (hasBodyKey(body, "notes", "Notes")) {
    updates.notes = pickBodyField(body, "notes", "Notes") ?? null;
  }
  if (hasBodyKey(body, "traderNote", "TraderNote", "trader_note")) {
    updates.traderNote = pickBodyField(body, "traderNote", "TraderNote", "trader_note") ?? null;
  }
  if (hasBodyKey(body, "driverId", "DriverID", "driver_id")) {
    updates.driverId = parseOptionalInt(pickBodyField(body, "driverId", "DriverID", "driver_id")) ?? null;
  }
  if (hasBodyKey(body, "vehicleId", "VehicleID", "vehicle_id")) {
    updates.vehicleId = parseOptionalInt(pickBodyField(body, "vehicleId", "VehicleID", "vehicle_id")) ?? null;
  }
  if (hasBodyKey(body, "goodTypeId", "GoodTypeID", "good_type_id")) {
    updates.goodTypeId = parseOptionalInt(pickBodyField(body, "goodTypeId", "GoodTypeID", "good_type_id")) ?? null;
  }
  if (hasBodyKey(body, "govId", "GovID", "gov_id")) {
    updates.govId = parseOptionalInt(pickBodyField(body, "govId", "GovID", "gov_id")) ?? null;
  }
  if (hasBodyKey(body, "syrCus", "SyrCus", "syr_cus")) {
    updates.syrCus = parseOptionalDecimal(pickBodyField(body, "syrCus", "SyrCus", "syr_cus")) ?? "0";
  }
  if (hasBodyKey(body, "carQty", "CarQty", "car_qty")) {
    updates.carQty = parseOptionalInt(pickBodyField(body, "carQty", "CarQty", "car_qty")) ?? null;
  }
  if (hasBodyKey(body, "transPrice", "TransPrice", "trans_price")) {
    updates.transPrice = parseOptionalDecimal(pickBodyField(body, "transPrice", "TransPrice", "trans_price")) ?? null;
  }
  if (hasBodyKey(body, "carrierId", "CarrierID", "carrier_id")) {
    updates.carrierId = parseOptionalInt(pickBodyField(body, "carrierId", "CarrierID", "carrier_id")) ?? null;
  }
  if (hasBodyKey(body, "qty", "Qty")) {
    updates.qty = parseOptionalInt(pickBodyField(body, "qty", "Qty")) ?? null;
  }

  const companyId = pickBodyField(body, "companyId", "CompanyID", "company_id");
  const companyName = pickBodyField(body, "companyName", "CompanyName", "company_name");
  if (companyId) {
    updates.companyId = parseInt(String(companyId), 10);
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, parseInt(String(companyId), 10)))
      .limit(1);
    if (company) updates.companyName = company.name;
  } else if (hasBodyKey(body, "companyName", "CompanyName", "company_name")) {
    if (hasBodyValue(companyName)) {
      updates.companyName = String(companyName);
      const [existingCompany] = await db
        .select()
        .from(companies)
        .where(eq(companies.name, String(companyName)))
        .limit(1);
      updates.companyId = existingCompany?.id ?? null;
    } else {
      updates.companyName = null;
      updates.companyId = null;
    }
  }

  if (hasBodyKey(body, "accountId", "AccountID", "account_id")) {
    updates.accountId = parseOptionalInt(pickBodyField(body, "accountId", "AccountID", "account_id")) ?? null;
  }

  return validateInput(transactionUpdateSchema, updates, TRANSACTION_UPDATE_VALIDATION_MESSAGE);
}

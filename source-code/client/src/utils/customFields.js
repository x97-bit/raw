import { fmtNum } from "./formatNumber";
export const TRANSACTION_FORMULA_FIELD_MAP = {
  ref_no: "RefNo",
  direction: "TransTypeName",
  trans_date: "TransDate",
  account_name: "AccountName",
  currency: "Currency",
  driver_name: "DriverName",
  vehicle_plate: "VehiclePlate",
  good_type: "GoodTypeName",
  weight: "Weight",
  meters: "Meters",
  qty: "Qty",
  cost_usd: "CostUSD",
  amount_usd: "AmountUSD",
  cost_iqd: "CostIQD",
  amount_iqd: "AmountIQD",
  fee_usd: "FeeUSD",
  gov_name: "Governorate",
  notes: "Notes",
  profit_usd: "ProfitUSD",
  profit_iqd: "ProfitIQD",
  running_usd: "runningUSD",
  running_iqd: "runningIQD",
  fee_iqd: "FeeIQD",
  syr_cus: "SyrCus",
  car_qty: "CarQty",
  trans_price: "TransPrice",
  carrier_name: "CarrierName",
  company_name: "CompanyName",
};

const NUMERIC_FIELD_TYPES = new Set(["number", "money"]);

export function isNumericCustomField(field) {
  return NUMERIC_FIELD_TYPES.has(field?.fieldType);
}

export function isEditableCustomField(field) {
  return field?.fieldType !== "formula";
}

export function sanitizeCustomFieldValue(field, value) {
  if (value === undefined || value === null || value === "") return "";

  if (isNumericCustomField(field)) {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : "";
  }

  return String(value);
}

export function getInitialCustomFieldValues(fields) {
  return (fields || []).reduce((acc, field) => {
    if (!isEditableCustomField(field)) return acc;
    acc[field.fieldKey] = sanitizeCustomFieldValue(field, field.defaultValue);
    return acc;
  }, {});
}

export function buildCustomFieldValuePayload(fields, source) {
  return (fields || [])
    .filter(field => isEditableCustomField(field) && field.id)
    .map(field => ({
      customFieldId: field.id,
      value: source?.[field.fieldKey],
    }));
}

export function evaluateCustomFormula(
  formula,
  record,
  fieldKeyMap = TRANSACTION_FORMULA_FIELD_MAP
) {
  if (!formula?.parts || formula.parts.length === 0) return null;

  try {
    let result = null;
    let currentOp = "+";

    for (const part of formula.parts) {
      if (part.type === "operator") {
        currentOp = part.value;
        continue;
      }

      const dataKey = fieldKeyMap[part.value] || part.value;
      const rawValue = record?.[dataKey];
      const numericValue =
        typeof rawValue === "number" ? rawValue : Number(rawValue);
      const fieldValue = Number.isFinite(numericValue) ? numericValue : 0;

      if (result === null) {
        result = fieldValue;
        continue;
      }

      switch (currentOp) {
        case "+":
          result += fieldValue;
          break;
        case "-":
          result -= fieldValue;
          break;
        case "*":
          result *= fieldValue;
          break;
        case "/":
          result = fieldValue !== 0 ? result / fieldValue : 0;
          break;
        default:
          break;
      }
    }

    return result;
  } catch {
    return null;
  }
}

export function formatCustomFieldDisplayValue(field, value) {
  if (value === undefined || value === null || value === "") return "-";

  if (field?.fieldType === "money" || field?.fieldType === "number") {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(numericValue)) {
      return fmtNum(numericValue);
    }
  }

  return String(value);
}

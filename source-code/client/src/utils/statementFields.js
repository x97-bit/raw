import { getFieldDisplayLabel } from "./fieldDisplayLabels";

const STATEMENT_COLUMN_TYPE_TO_FIELD_TYPE = {
  text: "text",
  badge: "text",
  date: "date",
  currency: "text",
  number: "number",
  money_usd: "money",
  money_generic: "money",
  money_usd_bold: "money",
  money_iqd: "money",
  money_iqd_bold: "money",
  notes: "text",
};

const RAW_STATEMENT_COLUMNS = [
  { key: "ref_no", dataKey: "RefNo", label: "رقم الفاتورة", type: "text" },
  {
    key: "direction",
    dataKey: "TransTypeName",
    label: "نوع الحركة",
    type: "badge",
  },
  { key: "trans_date", dataKey: "TransDate", label: "التاريخ", type: "date" },
  {
    key: "account_name",
    dataKey: "AccountName",
    label: "اسم التاجر",
    type: "text",
  },
  { key: "currency", dataKey: "Currency", label: "العملة", type: "currency" },
  {
    key: "driver_name",
    dataKey: "DriverName",
    label: "اسم السائق",
    type: "text",
  },
  {
    key: "vehicle_plate",
    dataKey: "VehiclePlate",
    label: "رقم السيارة",
    type: "text",
  },
  {
    key: "good_type",
    dataKey: "GoodTypeName",
    label: "نوع البضاعة",
    type: "text",
  },
  { key: "weight", dataKey: "Weight", label: "الوزن", type: "number" },
  { key: "meters", dataKey: "Meters", label: "الأمتار", type: "number" },
  {
    key: "cost_usd",
    dataKey: "CostUSD",
    label: "الكلفة دولار",
    type: "money_usd",
  },
  {
    key: "amount_usd",
    dataKey: "AmountUSD",
    label: "المبلغ دولار",
    type: "money_usd_bold",
  },
  {
    key: "cost_iqd",
    dataKey: "CostIQD",
    label: "الكلفة دينار",
    type: "money_iqd",
  },
  {
    key: "amount_iqd",
    dataKey: "AmountIQD",
    label: "المبلغ دينار",
    type: "money_iqd_bold",
  },
  {
    key: "fee_usd",
    dataKey: "FeeUSD",
    label: "النقل السعودي $",
    type: "money_usd",
  },
  {
    key: "syr_cus",
    dataKey: "SyrCus",
    label: "الكمارك السورية",
    type: "money_usd",
  },
  { key: "car_qty", dataKey: "CarQty", label: "عدد السيارات", type: "number" },
  {
    key: "trans_price",
    dataKey: "TransPrice",
    label: "نقل عراقي (دينار)",
    type: "number",
  },
  {
    key: "carrier_name",
    dataKey: "CarrierName",
    label: "اسم الناقل",
    type: "text",
  },
  {
    key: "profit_usd",
    dataKey: "ProfitUSD",
    label: "الربح ($)",
    type: "money_usd_bold",
  },
  {
    key: "profit_iqd",
    dataKey: "ProfitIQD",
    label: "الربح (د.ع)",
    type: "money_iqd_bold",
  },
  {
    key: "running_usd",
    dataKey: "runningUSD",
    label: "الرصيد التراكمي ($)",
    type: "money_usd_bold",
  },
  {
    key: "running_iqd",
    dataKey: "runningIQD",
    label: "الرصيد التراكمي (د.ع)",
    type: "money_iqd_bold",
  },
  { key: "gov_name", dataKey: "Governorate", label: "المحافظة", type: "text" },
  { key: "notes", dataKey: "Notes", label: "ملاحظات", type: "notes" },
];

export const STATEMENT_COLUMNS = RAW_STATEMENT_COLUMNS.map(column => ({
  ...column,
  label: getFieldDisplayLabel(column.key, { fallback: column.label }),
}));

export const STATEMENT_FIELDS = STATEMENT_COLUMNS.map(
  ({ key, label, type }) => ({
    key,
    label,
    type: STATEMENT_COLUMN_TYPE_TO_FIELD_TYPE[type] || "text",
  })
);

export function isStatementFieldSection(sectionKey = "") {
  return (
    typeof sectionKey === "string" &&
    (sectionKey.startsWith("port-") ||
      sectionKey.startsWith("transport-") ||
      sectionKey.startsWith("partnership-"))
  );
}

export function getStatementFields(sectionKey) {
  return isStatementFieldSection(sectionKey) ? STATEMENT_FIELDS : [];
}

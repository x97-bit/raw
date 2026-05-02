import { fmtNum, fmtUSD, fmtIQD } from "./formatNumber";
import { getCurrencyLabel } from "./currencyLabels";
import {
  getSectionFormLayout,
  getSectionTargetFields,
} from "./sectionScreenSpecs";
import {
  getTransactionReferenceLabel,
  getTransactionTypeLabel,
} from "./transactionTypeLabels";

const FALLBACK_LAYOUTS = {
  invoice: [
    {
      title: "المعلومات الأساسية",
      keys: ["ref_no", "trans_date", "account_name", "currency"],
    },
    {
      title: "تفاصيل الشحنة",
      keys: [
        "driver_name",
        "vehicle_plate",
        "good_type",
        "weight",
        "qty",
        "meters",
      ],
    },
    {
      title: "القيم المالية",
      keys: ["cost_usd", "amount_usd", "cost_iqd", "amount_iqd"],
    },
    {
      title: "تفاصيل إضافية",
      keys: [
        "gov_name",
        "company_name",
        "fee_usd",
        "trans_price",
        "carrier_name",
        "car_qty",
        "syr_cus",
      ],
    },
    { title: "الملاحظات", keys: ["trader_note", "notes"] },
  ],
  payment: [
    {
      title: "المعلومات الأساسية",
      keys: ["ref_no", "trans_date", "account_name", "currency"],
    },
    { title: "القيم المالية", keys: ["amount_usd", "amount_iqd"] },
    { title: "الملاحظات", keys: ["trader_note", "notes"] },
  ],
  "debit-note": [
    {
      title: "المعلومات الأساسية",
      keys: ["ref_no", "trans_date", "account_name", "currency"],
    },
    { title: "القيم المالية", keys: ["amount_usd", "amount_iqd"] },
    { title: "الملاحظات", keys: ["notes"] },
  ],
};

function formatDateValue(value) {
  return value ? String(value).split("T")[0].split(" ")[0] : "-";
}

function formatNumericValue(value) {
  return value === null || value === undefined || value === ""
    ? "-"
    : fmtNum(value);
}

function formatMoneyValue(value, currency = "USD") {
  if (value === null || value === undefined || value === "") return "-";
  const numericValue = fmtNum(value);
  return currency === "IQD" ? `${numericValue} د.ع` : `$${numericValue}`;
}

export function resolveInvoiceFieldValue(
  transaction = {},
  fieldKey,
  transactionTypeLabel = getTransactionTypeLabel(
    transaction?.TransTypeName,
    transaction?.TransTypeID,
    {
      recordType: transaction?.RecordType,
    }
  )
) {
  switch (fieldKey) {
    case "ref_no":
      return transaction.RefNo || "-";
    case "trans_date":
      return formatDateValue(transaction.TransDate);
    case "account_name":
      return transaction.AccountName || transaction.TraderName || "-";
    case "currency":
      return getCurrencyLabel(transaction.CurrencyName || transaction.Currency);
    case "driver_name":
      return transaction.DriverName || "-";
    case "vehicle_plate":
      return transaction.PlateNumber || transaction.VehiclePlate || "-";
    case "good_type":
      return transaction.GoodTypeName || transaction.GoodType || "-";
    case "weight":
      return formatNumericValue(transaction.Weight);
    case "qty":
      return formatNumericValue(transaction.Qty);
    case "meters":
      return formatNumericValue(transaction.Meters);
    case "cost_usd":
      return formatMoneyValue(transaction.CostUSD, "USD");
    case "amount_usd":
      return formatMoneyValue(transaction.AmountUSD, "USD");
    case "cost_iqd":
      return formatMoneyValue(transaction.CostIQD, "IQD");
    case "amount_iqd":
      return formatMoneyValue(transaction.AmountIQD, "IQD");
    case "gov_name":
      return transaction.GovName || transaction.Governorate || "-";
    case "company_name":
      return transaction.CompanyName || "-";
    case "fee_usd":
      return formatMoneyValue(transaction.FeeUSD, "USD");
    case "trans_price":
      return formatMoneyValue(transaction.TransPrice, "IQD");
    case "carrier_name":
      return transaction.CarrierName || "-";
    case "car_qty":
      return formatNumericValue(transaction.CarQty);
    case "syr_cus":
      return formatMoneyValue(transaction.SyrCus, "IQD");
    case "trader_note":
      return transaction.TraderNote || "-";
    case "notes":
      return transaction.Notes || transaction.CustomsNote || "-";
    case "transaction_type":
      return transactionTypeLabel;
    case "port_name":
      return transaction.PortName || "-";
    default:
      return transaction?.[fieldKey] ?? "-";
  }
}

export function buildInvoiceHeaderMeta(
  transaction = {},
  targetKey = "invoice",
  sectionKey
) {
  const fallbackTypeId =
    targetKey === "payment" ? 2 : targetKey === "debit-note" ? 3 : 1;
  const referenceLabel = getTransactionReferenceLabel(
    transaction?.TransTypeID ?? fallbackTypeId,
    { sectionKey, recordType: transaction?.RecordType }
  );
  const transactionTypeLabel = getTransactionTypeLabel(
    transaction?.TransTypeName,
    transaction?.TransTypeID,
    {
      sectionKey,
      recordType: transaction?.RecordType,
    }
  );

  return [
    { label: referenceLabel, value: transaction.RefNo || "-" },
    { label: "التاريخ", value: formatDateValue(transaction.TransDate) },
    { label: "نوع الحركة", value: transactionTypeLabel },
    { label: "المنفذ", value: transaction.PortName || "-" },
  ];
}

export function buildInvoiceExportSections(
  transaction = {},
  sectionKey,
  targetKey = "invoice"
) {
  const transactionTypeLabel = getTransactionTypeLabel(
    transaction?.TransTypeName,
    transaction?.TransTypeID,
    {
      sectionKey,
      recordType: transaction?.RecordType,
    }
  );
  const fieldDefs = getSectionTargetFields(sectionKey, targetKey);
  const layout = getSectionFormLayout(sectionKey, targetKey);
  const activeLayout = layout.length
    ? layout
    : FALLBACK_LAYOUTS[targetKey] || FALLBACK_LAYOUTS.invoice;
  const fieldMap = new Map(fieldDefs.map(field => [field.key, field]));

  return activeLayout
    .map((section, sectionIndex) => ({
      key: section.key || `${targetKey}-section-${sectionIndex + 1}`,
      title: section.title || "",
      subtitle: section.subtitle || "",
      items: (section.keys || []).map(fieldKey => {
        const field = fieldMap.get(fieldKey) || {
          key: fieldKey,
          label: fieldKey,
          type: "text",
        };
        return {
          key: fieldKey,
          label:
            fieldKey === "ref_no"
              ? getTransactionReferenceLabel(transaction?.TransTypeID, {
                  sectionKey,
                  recordType: transaction?.RecordType,
                })
              : field.label,
          type: field.type || "text",
          value: resolveInvoiceFieldValue(
            transaction,
            fieldKey,
            transactionTypeLabel
          ),
        };
      }),
    }))
    .filter(section => section.items.length > 0);
}

import { getCurrencyLabel } from "./currencyLabels";
import {
  getTransactionTypeLabel,
  isTransportSectionKey,
} from "./transactionTypeLabels";
import { evaluateCustomFormula } from "./customFields";
import { fmtNum, fmtUSD, fmtIQD } from "./formatNumber";

function mapColumnTypeToExportFormat(type) {
  if (type === "currency") return "currency";
  if (type === "money_iqd" || type === "money_iqd_bold") return "money_iqd";
  if (type === "money_generic") return "number";
  if (type?.includes("money")) return "money";
  if (type === "number") return "number";
  if (type === "date") return "date";
  return undefined;
}

function mapExportFormatToViewType(format) {
  if (format === "currency") return "currency";
  if (format === "money_iqd") return "money_iqd";
  if (format === "money") return "money_usd";
  if (format === "number") return "number";
  if (format === "date") return "date";
  return "text";
}

function isTransportAmountColumn(column, options = {}) {
  if (!isTransportSectionKey(options.sectionKey)) {
    return false;
  }

  const key = String(column?.key || column?.dataKey || "").toLowerCase();
  return (
    key === "amount_usd" ||
    key === "amount_iqd" ||
    key === "amountusd" ||
    key === "amountiqd"
  );
}

export function toExportColumn(column, options = {}) {
  const exportColumn = {
    key: column.dataKey,
    label: column.label,
    format: mapColumnTypeToExportFormat(column.type),
  };

  if (typeof column.getValue === "function") {
    exportColumn.getValue = column.getValue;
  } else if (column.key === "direction") {
    exportColumn.getValue = row =>
      getTransactionTypeLabel(row?.TransTypeName, row?.TransTypeID, {
        ...options,
        recordType: row?.RecordType,
      });
  }

  return exportColumn;
}

export function toPreviewColumn(column, index) {
  const key = column.key || `preview-column-${index}`;
  return {
    key,
    dataKey: key,
    label: column.label,
    type: mapExportFormatToViewType(column.format),
    getValue: column.getValue,
  };
}

export function renderPortCell(column, row, options = {}) {
  if (column.type === "formula" && column.formula) {
    const result = evaluateCustomFormula(column.formula, row);
    if (result === null) return "-";
    return (
      <span
        className={`font-bold ${result < 0 ? "text-red-600" : "text-green-700"}`}
      >
        {fmtNum(Math.round(result * 100) / 100)}
      </span>
    );
  }

  const value =
    typeof column.getValue === "function"
      ? column.getValue(row)
      : row[column.dataKey];
  const transportAmountTone = isTransportAmountColumn(column, options)
    ? (value || 0) < 0
      ? "text-emerald-700"
      : "text-rose-700"
    : (value || 0) < 0
      ? "text-red-600"
      : "text-green-700";

  switch (column.type) {
    case "date":
      return (
        <span className="whitespace-nowrap">{value?.split("T")[0].split(" ")[0] || "-"}</span>
      );
    case "badge":
      return (
        <span
          className={`rounded px-2 py-0.5 text-xs font-semibold ${
            row.TransTypeID === 1
              ? "bg-orange-500/10 text-orange-500"
              : row.TransTypeID === 2
                ? "bg-[#8eb8ad]/10 text-[#8eb8ad]"
                : row.TransTypeID === 3
                  ? "bg-[#b76169]/10 text-[#b76169]"
                  : "bg-blue-500/10 text-blue-500"
          }`}
        >
          {getTransactionTypeLabel(value, row.TransTypeID, {
            ...options,
            recordType: row?.RecordType,
          })}
        </span>
      );
    case "currency":
      return getCurrencyLabel(value);
    case "number":
      return value ? fmtNum(value) : "-";
    case "money_usd":
      return value ? `$${fmtUSD(value)}` : "-";
    case "money_generic":
      return value ? fmtNum(value) : "-";
    case "money_usd_bold":
      return (
        <span className={`font-bold ${transportAmountTone}`}>
          {value ? `$${fmtUSD(value)}` : "-"}
        </span>
      );
    case "money_iqd":
      return value ? fmtIQD(value) : "-";
    case "money_iqd_bold":
      return (
        <span
          className={
            isTransportAmountColumn(column, options)
              ? transportAmountTone
              : `${(value || 0) < 0 ? "text-red-600" : "text-gray-700"}`
          }
        >
          {value ? fmtIQD(value) : "-"}
        </span>
      );
    case "notes":
      return (
        <span className="block max-w-[200px] truncate text-xs text-gray-500">
          {value || row.TraderNote || "-"}
        </span>
      );
    default:
      return value || "-";
  }
}

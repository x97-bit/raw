import { fmtNum, fmtUSD, fmtIQD } from "./formatNumber";

const PORT_SUMMARY_TONES = {
  usd: "text-[#9ab6ca]",
  iqd: "text-[#eef3f7]",
  filteredUsd: "text-[#8eb8ad]",
  filteredIqd: "text-[#c8d4df]",
  weight: "text-[#9aa8b7]",
  payableUsd: "text-[#f0d7dd]",
  payableIqd: "text-[#eadfe2]",
};

export const EMPTY_PORT_SUMMARY = {
  count: 0,
  shipmentCount: 0,
  totalWeight: 0,
  totalMeters: 0,
  totalInvoicesUSD: 0,
  totalInvoicesIQD: 0,
  totalPaymentsUSD: 0,
  totalPaymentsIQD: 0,
  totalCostUSD: 0,
  totalCostIQD: 0,
  totalProfitUSD: 0,
  totalProfitIQD: 0,
  balanceUSD: 0,
  balanceIQD: 0,
};

export const PORT_SECTION_SUMMARY_META = {
  "transport-1": {
    list: [
      {
        key: "totalInvoicesIQD",
        label: "إجمالي استحقاق النقل",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.payableIqd,
      },
      {
        key: "totalPaymentsIQD",
        label: "المسدد",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.filteredIqd,
      },
      {
        key: "balanceIQD",
        label: "المتبقي علينا",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.payableIqd,
      },
    ],
    statement: [
      {
        key: "totalInvoicesIQD",
        label: "إجمالي استحقاق النقل",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.payableIqd,
      },
      {
        key: "totalPaymentsIQD",
        label: "المسدد",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.filteredIqd,
      },
      {
        key: "balanceIQD",
        label: "المتبقي علينا",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.payableIqd,
      },
    ],
  },
  "port-1": {
    list: [
      {
        key: "balanceUSD",
        label: "المبلغ الكلي دولار",
        format: "usd",
        accent: PORT_SUMMARY_TONES.usd,
      },
      {
        key: "balanceIQD",
        label: "المبلغ الكلي دينار",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.iqd,
      },
      {
        key: "totalMeters",
        label: "مجموع الامتار الكلي",
        format: "number",
        accent: PORT_SUMMARY_TONES.weight,
      },
    ],
    statement: [
      {
        key: "balanceUSD",
        label: "المبلغ الكلي دولار",
        format: "usd",
        accent: PORT_SUMMARY_TONES.usd,
      },
      {
        key: "filteredBalanceUSD",
        label: "المبلغ المحدد دولار",
        format: "usd",
        accent: PORT_SUMMARY_TONES.filteredUsd,
      },
      {
        key: "balanceIQD",
        label: "المبلغ الكلي دينار",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.iqd,
      },
      {
        key: "filteredBalanceIQD",
        label: "المبلغ المحدد دينار",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.filteredIqd,
      },
      {
        key: "totalMeters",
        label: "مجموع الامتار الكلي",
        format: "number",
        accent: PORT_SUMMARY_TONES.weight,
      },
    ],
  },
  "port-2": {
    list: [
      {
        key: "balanceUSD",
        label: "المبلغ الكلي دولار",
        format: "usd",
        accent: PORT_SUMMARY_TONES.usd,
      },
      {
        key: "balanceIQD",
        label: "المبلغ الكلي دينار",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.iqd,
      },
    ],
    statement: [
      {
        key: "balanceUSD",
        label: "المبلغ الكلي دولار",
        format: "usd",
        accent: PORT_SUMMARY_TONES.usd,
      },
      {
        key: "filteredBalanceUSD",
        label: "المبلغ المحدد دولار",
        format: "usd",
        accent: PORT_SUMMARY_TONES.filteredUsd,
      },
      {
        key: "balanceIQD",
        label: "المبلغ الكلي دينار",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.iqd,
      },
      {
        key: "filteredBalanceIQD",
        label: "المبلغ المحدد دينار",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.filteredIqd,
      },
    ],
  },
  "port-3": {
    list: [
      {
        key: "balanceUSD",
        label: "المبلغ الكلي دولار",
        format: "usd",
        accent: PORT_SUMMARY_TONES.usd,
      },
      {
        key: "balanceIQD",
        label: "المبلغ الكلي دينار",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.iqd,
      },
    ],
    statement: [
      {
        key: "balanceUSD",
        label: "المبلغ الكلي دولار",
        format: "usd",
        accent: PORT_SUMMARY_TONES.usd,
      },
      {
        key: "filteredBalanceUSD",
        label: "المبلغ المحدد دولار",
        format: "usd",
        accent: PORT_SUMMARY_TONES.filteredUsd,
      },
      {
        key: "balanceIQD",
        label: "المبلغ الكلي دينار",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.iqd,
      },
      {
        key: "filteredBalanceIQD",
        label: "المبلغ المحدد دينار",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.filteredIqd,
      },
    ],
  },
  "partnership-1": {
    list: [
      {
        key: "balanceUSD",
        label: "المبلغ الكلي دولار",
        format: "usd",
        accent: PORT_SUMMARY_TONES.usd,
      },
      {
        key: "balanceIQD",
        label: "المبلغ الكلي دينار",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.iqd,
      },
    ],
    statement: [
      {
        key: "balanceUSD",
        label: "المبلغ الكلي دولار",
        format: "usd",
        accent: PORT_SUMMARY_TONES.usd,
      },
      {
        key: "filteredBalanceUSD",
        label: "المبلغ المحدد دولار",
        format: "usd",
        accent: PORT_SUMMARY_TONES.filteredUsd,
      },
      {
        key: "balanceIQD",
        label: "المبلغ الكلي دينار",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.iqd,
      },
      {
        key: "filteredBalanceIQD",
        label: "المبلغ المحدد دينار",
        format: "iqd",
        accent: PORT_SUMMARY_TONES.filteredIqd,
      },
    ],
  },
};

export function formatPortSummaryValue(value, format) {
  if (format === "usd") return `$${fmtUSD(value)}`;
  if (format === "iqd") return fmtIQD(value);
  if (format === "number") return fmtNum(value);
  return value;
}

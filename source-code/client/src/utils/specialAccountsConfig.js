import { fmtNum, fmtUSD, fmtIQD } from "./formatNumber";
import { Building2, Handshake } from "lucide-react";
import { getFieldLabel } from "./fieldConfigMetadata";
import { buildSpecialPartnerTotals } from "./specialPartnerMath";
import { buildSpecialHaiderTotals } from "./specialHaiderMath";


const SPECIAL_CARD_TONES = {
  usd: "text-[#9ab6ca]",
  iqd: "text-[#eef3f7]",
  success: "text-[#8eb8ad]",
  warning: "text-[#d1b58b]",
  rose: "text-[#c697a1]",
  muted: "text-[#9aa8b7]",
  soft: "text-[#c8d4df]",
};

const HAIDER_COLUMNS = [
  {
    key: "trans_date",
    dataKey: "TransDate",
    label: "التاريخ",
    format: "date",
    render: value => value?.split("T")[0].split(" ")[0] || "-",
  },
  {
    key: "destination",
    dataKey: "Destination",
    label: "المحافظة",
    render: value => value || "-",
  },
  {
    key: "driver_name",
    dataKey: "DriverName",
    label: "اسم السائق",
    render: value => value || "-",
  },
  {
    key: "vehicle_plate",
    dataKey: "PlateNumber",
    label: "رقم السيارة",
    render: value => value || "-",
  },
  {
    key: "good_type",
    dataKey: "GoodType",
    label: "نوع البضاعة",
    render: value => value || "-",
  },
  {
    key: "weight",
    dataKey: "Weight",
    label: "الوزن",
    format: "number",
    render: value => (value ? fmtNum(value) : "-"),
  },
  {
    key: "meters",
    dataKey: "Meters",
    label: "الأمتار",
    format: "number",
    render: value => (value ? fmtNum(value) : "-"),
  },
  {
    key: "cost_usd",
    dataKey: "CostUSD",
    label: "الكلفة دولار",
    format: "money",
    render: value => (value ? `$${fmtUSD(value)}` : "0"),
  },
  {
    key: "amount_usd",
    dataKey: "AmountUSD",
    label: "المبلغ دولار",
    format: "money",
    render: value => (value ? `$${fmtUSD(value)}` : "0"),
  },
  {
    key: "cost_iqd",
    dataKey: "CostIQD",
    label: "الكلفة دينار",
    format: "money_iqd",
    render: value => (value ? fmtNum(value) : "0"),
  },
  {
    key: "amount_iqd",
    dataKey: "AmountIQD",
    label: "المبلغ دينار",
    format: "money_iqd",
    render: value => (value ? fmtNum(value) : "0"),
  },
  {
    key: "difference_iqd",
    dataKey: "DifferenceIQD",
    label: "الفرق دينار",
    format: "money_iqd",
    render: value => (value ? fmtNum(value) : "0"),
  },
  {
    key: "batch_name",
    dataKey: "BatchName",
    label: "الوجبة",
    render: value => value || "-",
  },
  {
    key: "notes",
    dataKey: "TraderNote",
    label: "ملاحظات",
    render: value => value || "-",
    isNotes: true,
  },
];

const PARTNER_COLUMNS = [
  {
    key: "trans_date",
    dataKey: "TransDate",
    label: "التاريخ",
    format: "date",
    render: value => value?.split("T")[0].split(" ")[0] || "-",
  },
  {
    key: "trader_name",
    dataKey: "TraderName",
    label: "التاجر",
    render: value => value || "-",
    isMedium: true,
  },
  {
    key: "driver_name",
    dataKey: "DriverName",
    label: "اسم السائق",
    render: value => value || "-",
  },
  {
    key: "vehicle_plate",
    dataKey: "VehiclePlate",
    label: "رقم السيارة",
    render: value => value || "-",
  },
  {
    key: "good_type",
    dataKey: "GoodType",
    label: "نوع البضاعة",
    render: value => value || "-",
  },
  {
    key: "gov_name",
    dataKey: "GovName",
    label: "الجهة الحكومية",
    render: value => value || "-",
  },
  {
    key: "company_name",
    dataKey: "CompanyName",
    label: "الشركة",
    render: value => value || "-",
  },
  {
    key: "qty",
    dataKey: "Qty",
    label: "العدد",
    format: "number",
    render: value => value || "-",
  },
  {
    key: "amount_usd",
    dataKey: "AmountUSD",
    label: "المبلغ عليه ($)",
    format: "money",
    render: value => `$${fmtUSD(value)}`,
    isBold: true,
  },
  {
    key: "amount_usd_partner",
    dataKey: "AmountUSD_Partner",
    label: "المبلغ له ($)",
    format: "money",
    render: value => (value ? `$${fmtUSD(value)}` : "-"),
  },
  {
    key: "difference_iqd",
    dataKey: "DifferenceIQD",
    label: "الفرق",
    format: "number",
    render: value => (value ? fmtNum(value) : "-"),
  },
  {
    key: "clr",
    dataKey: "CLR",
    label: "التخليص",
    format: "number",
    render: value => value || "-",
  },
  {
    key: "taxi_and_officer",
    dataKey: "TaxiWater",
    label: "التكسي والمأمور",
    format: "number",
    render: (_value, row) => {
      const combined = Number(row?.TaxiWater || 0) + Number(row?.TX || 0);
      return combined ? fmtNum(combined) : "-";
    },
  },
  {
    key: "notes",
    dataKey: "Notes",
    label: "ملاحظات",
    render: value => value || "-",
    isNotes: true,
  },
];

export const SPECIAL_ACCOUNT_DEFS = {
  haider: {
    id: "haider",
    label: "حيدر شركة الأنوار",
    endpoint: "/special/haider",
    icon: Building2,
    accent: "#648ea9",
    accentSoft: "rgba(100,142,169,0.18)",
    surfaceGradient:
      "linear-gradient(155deg, rgba(14,19,25,0.98) 0%, rgba(22,29,38,0.96) 58%, rgba(41,58,76,0.92) 100%)",
    hoverShadow: "0 26px 56px rgba(100,142,169,0.18)",
    description: "كشف خاص بحيدر وشركة الأنوار ضمن نفس هوية النظام الداكنة.",
    sectionKey: "special-haider",
    rowsKey: "statement",
    columns: HAIDER_COLUMNS,
    searchKeys: [
      "TraderNote",
      "Notes",
      "GoodType",
      "DriverName",
      "PlateNumber",
      "Destination",
      "BatchName",
    ],
    buildTotals: buildSpecialHaiderTotals,
    buildSummaryCards: totals => [
      {
        label: "إجمالي الكلفة ($)",
        value: `$${fmtUSD(totals.totalCostUSD)}`,
        tone: SPECIAL_CARD_TONES.soft,
      },
      {
        label: "إجمالي المبلغ ($)",
        value: `$${fmtUSD(totals.totalAmountUSD)}`,
        tone: SPECIAL_CARD_TONES.usd,
      },
      {
        label: "إجمالي الكلفة (د.ع)",
        value: fmtNum(totals.totalCostIQD),
        tone: SPECIAL_CARD_TONES.soft,
      },
      {
        label: "إجمالي المبلغ (د.ع)",
        value: fmtNum(totals.totalAmountIQD),
        tone: SPECIAL_CARD_TONES.iqd,
      },
      {
        label: "إجمالي الفرق (د.ع)",
        value: fmtNum(totals.totalDifferenceIQD),
        tone: SPECIAL_CARD_TONES.warning,
      },
      {
        label: "مجموع الطلب الكلي",
        value: fmtNum(totals.totalNetIQD),
        tone:
          totals.totalNetIQD >= 0
            ? SPECIAL_CARD_TONES.success
            : SPECIAL_CARD_TONES.rose,
      },
      {
        label: "مجموع الوزن الكلي",
        value: fmtNum(totals.totalWeight),
        tone: SPECIAL_CARD_TONES.muted,
      },
    ],
    buildExportSummaryCards: (totals, accountName) => [
      { label: "اسم التاجر", value: accountName },
      { label: "الاجمالي دينار", value: fmtNum(totals.totalAmountIQD) },
      {
        label: "المبلغ الكلي دينار",
        value: fmtNum(totals.totalGrandIQD),
        color: "#d82534",
      },
      { label: "اجمالي الفرق", value: fmtNum(totals.totalDifferenceIQD) },
      {
        label: "المبلغ الكلي دولار",
        value: fmtNum(totals.totalAmountUSD),
        color: "#d82534",
      },
    ],
    buildExportTotalsRow: totals => ({
      CostUSD: totals.totalCostUSD,
      AmountUSD: totals.totalAmountUSD,
      CostIQD: totals.totalCostIQD,
      AmountIQD: totals.totalAmountIQD,
      DifferenceIQD: totals.totalDifferenceIQD,
    }),
    getFooterValue: (columnKey, totals) =>
      ({
        weight: fmtNum(totals.totalWeight),
        meters: fmtNum(totals.totalMeters),
        cost_usd: `$${fmtUSD(totals.totalCostUSD)}`,
        amount_usd: `$${fmtUSD(totals.totalAmountUSD)}`,
        cost_iqd: fmtNum(totals.totalCostIQD),
        amount_iqd: fmtNum(totals.totalAmountIQD),
        difference_iqd: fmtNum(totals.totalDifferenceIQD),
      })[columnKey],
  },
  "partnership-yaser": {
    id: "partnership-yaser",
    label: "ياسر عادل",
    endpoint: "/special/partnership",
    icon: Handshake,
    accent: "#4f7d74",
    accentSoft: "rgba(79,125,116,0.18)",
    surfaceGradient:
      "linear-gradient(155deg, rgba(14,19,25,0.98) 0%, rgba(22,29,38,0.96) 58%, rgba(37,56,51,0.92) 100%)",
    hoverShadow: "0 26px 56px rgba(79,125,116,0.18)",
    description: "عرض عمليات الشراكة بصياغة بصرية هادئة ومتناسقة.",
    sectionKey: "special-partner",
    rowsKey: "rows",
    columns: PARTNER_COLUMNS,
    searchKeys: [
      "TraderName",
      "Notes",
      "GoodType",
      "GovName",
      "VehiclePlate",
      "CompanyName",
    ],
    buildTotals: buildSpecialPartnerTotals,
    buildSummaryCards: totals => [
      {
        label: "إجمالي المبلغ عليه ($)",
        value: `$${fmtUSD(totals.totalAmountUSD)}`,
        tone: SPECIAL_CARD_TONES.warning,
      },
      {
        label: "إجمالي المبلغ له ($)",
        value: `$${fmtUSD(totals.totalPartnerUSD)}`,
        tone: SPECIAL_CARD_TONES.iqd,
      },
      {
        label: "الصافي (عليه - له) ($)",
        value: `$${fmtUSD(totals.totalNetUSD)}`,
        tone:
          totals.totalNetUSD >= 0
            ? SPECIAL_CARD_TONES.success
            : SPECIAL_CARD_TONES.rose,
      },
      {
        label: "عدد المعاملات",
        value: totals.count,
        tone: SPECIAL_CARD_TONES.muted,
      },
    ],
    buildExportTotalsRow: totals => ({
      AmountUSD: totals.totalAmountUSD,
      AmountUSD_Partner: totals.totalPartnerBaseUSD,
      DifferenceIQD: totals.totalDifferenceIQD,
      CLR: totals.totalCLR,
      TaxiWater: totals.totalTaxiAndOfficer,
    }),
    getFooterValue: (columnKey, totals) =>
      ({
        amount_usd: `$${fmtUSD(totals.totalAmountUSD)}`,
        amount_usd_partner: `$${fmtUSD(totals.totalPartnerBaseUSD)}`,
        difference_iqd: fmtNum(totals.totalDifferenceIQD),
        clr: fmtNum(totals.totalCLR),
        taxi_and_officer: fmtNum(totals.totalTaxiAndOfficer),
      })[columnKey],
  },
};

export const SPECIAL_FORM_FIELDS = {
  haider: [
    { key: "date", label: "التاريخ", type: "date" },
    { key: "destination", label: "المحافظة", type: "text" },
    { key: "driverName", label: "اسم السائق", type: "text" },
    { key: "vehiclePlate", label: "رقم السيارة", type: "text" },
    { key: "goodType", label: "نوع البضاعة", type: "text" },
    { key: "weight", label: "الوزن", type: "number", step: "0.01" },
    { key: "meters", label: "الأمتار", type: "number", step: "0.01" },
    { key: "costUSD", label: "الكلفة دولار", type: "number", step: "0.01" },
    { key: "amountUSD", label: "المبلغ دولار", type: "number", step: "0.01" },
    { key: "costIQD", label: "الكلفة دينار", type: "number", step: "1" },
    { key: "amountIQD", label: "المبلغ دينار", type: "number", step: "1" },
    { key: "differenceIQD", label: "الفرق دينار", type: "number", step: "1" },
    { key: "batchName", label: "الوجبة", type: "text" },
    {
      key: "notes",
      label: "ملاحظات",
      type: "textarea",
      className: "md:col-span-2 xl:col-span-3",
    },
  ],
  "partnership-yaser": [
    { key: "date", label: "التاريخ", type: "date" },
    { key: "traderName", label: "اسم التاجر", type: "text" },
    { key: "driverName", label: "اسم السائق", type: "text" },
    { key: "vehiclePlate", label: "رقم السيارة", type: "text" },
    { key: "goodType", label: "نوع البضاعة", type: "text" },
    { key: "companyName", label: "الشركة", type: "text" },
    { key: "qty", label: "العدد", type: "number", step: "1" },
    {
      key: "amountUSD",
      label: "المبلغ عليه ($)",
      type: "number",
      step: "0.01",
    },
    {
      key: "amountUSDPartner",
      label: "المبلغ له ($)",
      type: "number",
      step: "0.01",
    },
    { key: "differenceIQD", label: "الفرق", type: "number", step: "1" },
    { key: "clr", label: "التخليص", type: "number", step: "0.01" },
    {
      key: "taxiAndOfficer",
      label: "التكسي والمأمور",
      type: "number",
      step: "0.01",
    },
    {
      key: "notes",
      label: "ملاحظات",
      type: "textarea",
      className: "md:col-span-2 xl:col-span-3",
    },
  ],
};

export function createInitialSpecialFieldState() {
  return {
    "special-haider": {
      visibleKeys: SPECIAL_ACCOUNT_DEFS.haider.columns.map(
        column => column.key
      ),
      configMap: {},
    },
    "special-partner": {
      visibleKeys: SPECIAL_ACCOUNT_DEFS["partnership-yaser"].columns.map(
        column => column.key
      ),
      configMap: {},
    },
  };
}

export function buildVisibleSpecialColumns(columns, visibleKeys, configMap) {
  const ALWAYS_VISIBLE_KEYS = new Set(["destination"]);
  const seenKeys = new Set(visibleKeys);
  const orderedKeys = [...visibleKeys];

  columns.forEach(column => {
    if (ALWAYS_VISIBLE_KEYS.has(column.key) && !seenKeys.has(column.key)) {
      const dateIndex = orderedKeys.findIndex(key => key === "trans_date");
      const insertAt = dateIndex >= 0 ? dateIndex + 1 : orderedKeys.length;
      orderedKeys.splice(insertAt, 0, column.key);
      seenKeys.add(column.key);
    }
  });

  return orderedKeys
    .map(key => {
      const column = columns.find(entry => entry.key === key);
      return column
        ? { ...column, label: getFieldLabel(configMap, key, column.label) }
        : null;
    })
    .filter(Boolean);
}

export function filterSpecialAccountRows(
  rows,
  search,
  columns,
  searchKeys = [],
  options = {}
) {
  const normalizedSearch = String(search || "")
    .trim()
    .toLowerCase();
  const normalizedBatchName = String(options.batchName || "")
    .trim()
    .toLowerCase();
  const keys = [
    ...new Set([...columns.map(column => column.dataKey), ...searchKeys]),
  ];

  return rows.filter(row => {
    const matchesSearch =
      !normalizedSearch ||
      keys.some(key =>
        String(row?.[key] ?? "")
          .toLowerCase()
          .includes(normalizedSearch)
      );
    if (!matchesSearch) return false;

    if (!normalizedBatchName) return true;
    return (
      String(row?.BatchName ?? "")
        .trim()
        .toLowerCase() === normalizedBatchName
    );
  });
}

export function getInitialSpecialForm(accountId, accountLabel, record = null) {
  const type = accountId === "haider" ? "haider" : "partnership";
  const combinedTaxiAndOfficer = record
    ? Number(record.TaxiWater || 0) + Number(record.TX || 0) || ""
    : "";
  return {
    type,
    name: accountLabel,
    date:
      record?.TransDate?.split("T")[0].split(" ")[0] ||
      new Date().toISOString().split("T")[0],
    traderName: record?.TraderName || "",
    driverName: record?.DriverName || "",
    vehiclePlate: record?.VehiclePlate || record?.PlateNumber || "",
    goodType: record?.GoodType || "",
    govName: record?.GovName || "",
    companyName: record?.CompanyName || "",
    batchName: record?.BatchName || "",
    destination: record?.Destination || "",
    amountUSD: record?.AmountUSD ?? "",
    amountIQD: record?.AmountIQD ?? "",
    costUSD: record?.CostUSD ?? "",
    costIQD: record?.CostIQD ?? "",
    amountUSDPartner: record?.AmountUSD_Partner ?? "",
    differenceIQD: record?.DifferenceIQD ?? "",
    clr: record?.CLR ?? "",
    taxiAndOfficer: combinedTaxiAndOfficer,
    weight: record?.Weight ?? "",
    meters: record?.Meters ?? "",
    qty: record?.Qty ?? "",
    notes: record?.Notes || record?.TraderNote || "",
  };
}

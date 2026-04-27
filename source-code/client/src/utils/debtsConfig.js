const formatNum = value =>
  value ? Number(value).toLocaleString("en-US") : "0";

export const STATUS_OPTIONS = [
  { value: "pending", label: "غير مسدد" },
  { value: "partial", label: "تسديد جزئي" },
  { value: "paid", label: "مسدد" },
];

export const DEBTOR_CONFIGS = {
  basim: {
    label: "باسم",
    columns: [
      {
        key: "trans_date",
        dataKey: "TransDate",
        label: "التاريخ",
        render: value => value?.split("T")[0].split(" ")[0] || "-",
      },
      {
        key: "amount_usd",
        dataKey: "AmountUSD",
        label: "المبلغ ($)",
        render: value => (value ? `$${formatNum(value)}` : "-"),
        bold: true,
        color: true,
      },
      {
        key: "fee_usd",
        dataKey: "FeeUSD",
        label: "الرسوم ($)",
        render: value => (value ? `$${formatNum(value)}` : "-"),
      },
      {
        key: "amount_iqd",
        dataKey: "AmountIQD",
        label: "المبلغ (د.ع)",
        render: value => (value ? formatNum(value) : "-"),
      },
      {
        key: "fee_iqd",
        dataKey: "FeeIQD",
        label: "الرسوم (د.ع)",
        render: value => (value ? formatNum(value) : "-"),
      },
      {
        key: "trans_type",
        dataKey: "TransType",
        label: "نوع الحركة",
        render: value => value || "-",
      },
      {
        key: "state",
        dataKey: "State",
        label: "الحالة",
        render: value => value || "-",
      },
      {
        key: "notes",
        dataKey: "Notes",
        label: "ملاحظات",
        render: value => value || "",
        isNotes: true,
      },
    ],
    formFields: [
      { key: "TransDate", label: "التاريخ", type: "date" },
      { key: "AmountUSD", label: "المبلغ ($)", type: "number", step: "0.01" },
      { key: "FeeUSD", label: "الرسوم ($)", type: "number", step: "0.01" },
      { key: "AmountIQD", label: "المبلغ (د.ع)", type: "number", step: "1" },
      { key: "FeeIQD", label: "الرسوم (د.ع)", type: "number", step: "1" },
      { key: "TransType", label: "نوع الحركة", type: "text" },
    ],
  },
  noman: {
    label: "نعمان",
    columns: [
      {
        key: "trans_date",
        dataKey: "TransDate",
        label: "التاريخ",
        render: value => value?.split("T")[0].split(" ")[0] || "-",
      },
      {
        key: "amount_usd",
        dataKey: "AmountUSD",
        label: "المبلغ ($)",
        render: value => (value ? `$${formatNum(value)}` : "-"),
        bold: true,
        color: true,
      },
      {
        key: "fee_usd",
        dataKey: "FeeUSD",
        label: "الرسوم ($)",
        render: value => (value ? `$${formatNum(value)}` : "-"),
      },
      {
        key: "amount_iqd",
        dataKey: "AmountIQD",
        label: "المبلغ (د.ع)",
        render: value => (value ? formatNum(value) : "-"),
      },
      {
        key: "fee_iqd",
        dataKey: "FeeIQD",
        label: "الرسوم (د.ع)",
        render: value => (value ? formatNum(value) : "-"),
      },
      {
        key: "trans_type",
        dataKey: "TransType",
        label: "نوع الحركة",
        render: value => value || "-",
      },
      {
        key: "state",
        dataKey: "State",
        label: "الحالة",
        render: value => value || "-",
      },
      {
        key: "notes",
        dataKey: "Notes",
        label: "ملاحظات",
        render: value => value || "",
        isNotes: true,
      },
    ],
    formFields: [
      { key: "TransDate", label: "التاريخ", type: "date" },
      { key: "AmountUSD", label: "المبلغ ($)", type: "number", step: "0.01" },
      { key: "FeeUSD", label: "الرسوم ($)", type: "number", step: "0.01" },
      { key: "AmountIQD", label: "المبلغ (د.ع)", type: "number", step: "1" },
      { key: "FeeIQD", label: "الرسوم (د.ع)", type: "number", step: "1" },
      { key: "TransType", label: "نوع الحركة", type: "text" },
    ],
  },
  luay: {
    label: "لؤي",
    columns: [
      {
        key: "trans_date",
        dataKey: "TransDate",
        label: "التاريخ",
        render: value => value?.split("T")[0].split(" ")[0] || "-",
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
        dataKey: "GoodTypeName",
        label: "نوع البضاعة",
        render: value => value || "-",
      },
      {
        key: "weight",
        dataKey: "Weight",
        label: "الوزن",
        render: value => (value ? formatNum(value) : "-"),
      },
      {
        key: "amount_usd",
        dataKey: "AmountUSD",
        label: "المبلغ ($)",
        render: value => (value ? `$${formatNum(value)}` : "-"),
        bold: true,
        color: true,
      },
      {
        key: "notes",
        dataKey: "Notes",
        label: "ملاحظات",
        render: value => value || "",
        isNotes: true,
      },
    ],
    formFields: [
      { key: "TransDate", label: "التاريخ", type: "date" },
      { key: "DriverName", label: "اسم السائق", type: "text" },
      { key: "VehiclePlate", label: "رقم السيارة", type: "text" },
      { key: "GoodTypeName", label: "نوع البضاعة", type: "text" },
      { key: "Weight", label: "الوزن", type: "number", step: "0.01" },
      { key: "AmountUSD", label: "المبلغ ($)", type: "number", step: "0.01" },
    ],
  },
  luay2: {
    label: "لؤي 2",
    columns: [
      {
        key: "trans_date",
        dataKey: "TransDate",
        label: "التاريخ",
        render: value => value?.split("T")[0].split(" ")[0] || "-",
      },
      {
        key: "amount_usd",
        dataKey: "AmountUSD",
        label: "المبلغ ($)",
        render: value => (value ? `$${formatNum(value)}` : "-"),
        bold: true,
        color: true,
      },
      {
        key: "trans_type",
        dataKey: "TransType",
        label: "نوع الحركة",
        render: value => value || "-",
      },
      {
        key: "amount_iqd",
        dataKey: "AmountIQD",
        label: "المبلغ (د.ع)",
        render: value => (value ? formatNum(value) : "-"),
      },
      {
        key: "notes",
        dataKey: "Notes",
        label: "ملاحظات",
        render: value => value || "",
        isNotes: true,
      },
    ],
    formFields: [
      { key: "TransDate", label: "التاريخ", type: "date" },
      { key: "AmountUSD", label: "المبلغ ($)", type: "number", step: "0.01" },
      { key: "TransType", label: "نوع الحركة", type: "text" },
      { key: "AmountIQD", label: "المبلغ (د.ع)", type: "number", step: "1" },
    ],
  },
  abdalkarem: {
    label: "عبد الكريم",
    columns: [
      {
        key: "trans_date",
        dataKey: "TransDate",
        label: "التاريخ",
        render: value => value?.split("T")[0].split(" ")[0] || "-",
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
        dataKey: "GoodTypeName",
        label: "نوع البضاعة",
        render: value => value || "-",
      },
      {
        key: "amount_usd",
        dataKey: "AmountUSD",
        label: "المبلغ ($)",
        render: value => (value ? `$${formatNum(value)}` : "-"),
        bold: true,
        color: true,
      },
      {
        key: "amount_iqd",
        dataKey: "AmountIQD",
        label: "المبلغ (د.ع)",
        render: value => (value ? formatNum(value) : "-"),
      },
      {
        key: "account_name",
        dataKey: "AccountName",
        label: "اسم الحساب",
        render: value => value || "-",
      },
      {
        key: "notes",
        dataKey: "Notes",
        label: "ملاحظات",
        render: value => value || "",
        isNotes: true,
      },
    ],
    formFields: [
      { key: "TransDate", label: "التاريخ", type: "date" },
      { key: "DriverName", label: "اسم السائق", type: "text" },
      { key: "VehiclePlate", label: "رقم السيارة", type: "text" },
      { key: "GoodTypeName", label: "نوع البضاعة", type: "text" },
      { key: "AmountUSD", label: "المبلغ ($)", type: "number", step: "0.01" },
      { key: "AmountIQD", label: "المبلغ (د.ع)", type: "number", step: "1" },
    ],
  },
};

export const DEFAULT_DEBT_COLUMNS = [
  {
    key: "account_name",
    dataKey: "AccountName",
    label: "اسم الحساب",
    render: value => value || "-",
  },
  {
    key: "trans_date",
    dataKey: "TransDate",
    label: "التاريخ",
    render: value => value?.split("T")[0].split(" ")[0] || "-",
  },
  {
    key: "amount_usd",
    dataKey: "AmountUSD",
    label: "المبلغ ($)",
    render: value => (value ? `$${formatNum(value)}` : "-"),
    bold: true,
    color: true,
  },
  {
    key: "amount_iqd",
    dataKey: "AmountIQD",
    label: "المبلغ (د.ع)",
    render: value => (value ? formatNum(value) : "-"),
  },
  {
    key: "remaining_usd",
    dataKey: "RemainingUSD",
    label: "المتبقي ($)",
    render: value => (value ? `$${formatNum(value)}` : "-"),
  },
  {
    key: "state",
    dataKey: "State",
    label: "الحالة",
    render: value => value || "-",
  },
  {
    key: "notes",
    dataKey: "Notes",
    label: "ملاحظات",
    render: value => value || "",
    isNotes: true,
  },
];

export const DEFAULT_DEBT_FORM_FIELDS = [
  { key: "TransDate", label: "التاريخ", type: "date" },
  { key: "AmountUSD", label: "المبلغ ($)", type: "number", step: "0.01" },
  { key: "AmountIQD", label: "المبلغ (د.ع)", type: "number", step: "1" },
];

export const COMMON_DEBT_FORM_FIELDS = [
  { key: "State", label: "الحالة", type: "select", options: STATUS_OPTIONS },
  { key: "PaidAmountUSD", label: "المسدد ($)", type: "number", step: "0.01" },
  { key: "PaidAmountIQD", label: "المسدد (د.ع)", type: "number", step: "1" },
  { key: "FXRate", label: "سعر الصرف", type: "number", step: "0.01" },
  { key: "FxNote", label: "ملاحظة الصرف", type: "text" },
  {
    key: "Notes",
    label: "ملاحظات",
    type: "textarea",
    className: "md:col-span-2 xl:col-span-3",
  },
];

export function getDebtorKey(accountName) {
  if (!accountName) return null;
  const normalized = accountName.trim().toLowerCase();
  if (normalized.includes("باسم")) return "basim";
  if (normalized.includes("نعمان") || normalized.includes("نومان"))
    return "noman";
  if (normalized.includes("لؤي 2") || normalized.includes("لؤي2"))
    return "luay2";
  if (normalized.includes("لؤي")) return "luay";
  if (normalized.includes("عبد الكريم") || normalized.includes("عبدالكريم"))
    return "abdalkarem";
  return null;
}

export function getDebtorConfig(accountName) {
  const key = getDebtorKey(accountName);
  return key ? DEBTOR_CONFIGS[key] : null;
}

export function filterDebtByDate(transDate, from, to) {
  const value = transDate?.split("T")[0].split(" ")[0] || "";
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
}

export function buildDebtSummaryRows(rows) {
  const summaryMap = new Map();

  for (const row of rows) {
    const key = row.AccountName || "غير محدد";
    if (!summaryMap.has(key)) {
      summaryMap.set(key, {
        AccountID: key,
        AccountName: key,
        totalUSD: 0,
        totalIQD: 0,
        paidUSD: 0,
        paidIQD: 0,
        remainingUSD: 0,
        remainingIQD: 0,
        count: 0,
      });
    }

    const entry = summaryMap.get(key);
    entry.totalUSD += Number(row.AmountUSD || 0);
    entry.totalIQD += Number(row.AmountIQD || 0);
    entry.paidUSD += Number(row.PaidAmountUSD || 0);
    entry.paidIQD += Number(row.PaidAmountIQD || 0);
    entry.remainingUSD += Number(row.RemainingUSD || 0);
    entry.remainingIQD += Number(row.RemainingIQD || 0);
    entry.count += 1;
  }

  return [...summaryMap.values()].sort(
    (a, b) => Math.abs(b.remainingUSD) - Math.abs(a.remainingUSD)
  );
}

export function buildDebtTotals(rows) {
  return rows.reduce(
    (totals, row) => ({
      count: totals.count + 1,
      totalUSD: totals.totalUSD + Number(row.AmountUSD || 0),
      totalIQD: totals.totalIQD + Number(row.AmountIQD || 0),
      paidUSD: totals.paidUSD + Number(row.PaidAmountUSD || 0),
      paidIQD: totals.paidIQD + Number(row.PaidAmountIQD || 0),
      remainingUSD: totals.remainingUSD + Number(row.RemainingUSD || 0),
      remainingIQD: totals.remainingIQD + Number(row.RemainingIQD || 0),
    }),
    {
      count: 0,
      totalUSD: 0,
      totalIQD: 0,
      paidUSD: 0,
      paidIQD: 0,
      remainingUSD: 0,
      remainingIQD: 0,
    }
  );
}

export function getInitialDebtFormState(debt = null) {
  return {
    AccountName: debt?.AccountName || "",
    TransDate:
      debt?.TransDate?.split("T")[0].split(" ")[0] || new Date().toISOString().split("T")[0],
    AmountUSD: debt?.AmountUSD ?? "",
    AmountIQD: debt?.AmountIQD ?? "",
    FeeUSD: debt?.FeeUSD ?? "",
    FeeIQD: debt?.FeeIQD ?? "",
    PaidAmountUSD: debt?.PaidAmountUSD ?? "",
    PaidAmountIQD: debt?.PaidAmountIQD ?? "",
    TransType: debt?.TransType || "",
    DriverName: debt?.DriverName || "",
    VehiclePlate: debt?.VehiclePlate || "",
    GoodTypeName: debt?.GoodTypeName || "",
    Weight: debt?.Weight ?? "",
    Meters: debt?.Meters ?? "",
    FXRate: debt?.FXRate ?? "",
    FxNote: debt?.FxNote || "",
    State: debt?.Status || "pending",
    Notes: debt?.Notes || "",
  };
}

export function mergeUniqueDebtNames(items, label) {
  const normalized = String(label || "").trim();
  if (!normalized) return items;
  return items.some(item => String(item.name || "").trim() === normalized)
    ? items
    : [...items, { id: normalized, name: normalized }];
}

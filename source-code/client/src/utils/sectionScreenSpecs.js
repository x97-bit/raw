import { getFieldDisplayLabel } from "./fieldDisplayLabels";

const asFieldType = columnType => {
  switch (columnType) {
    case "date":
      return "date";
    case "number":
      return "number";
    case "money_usd":
    case "money_iqd":
    case "money_usd_bold":
    case "money_iqd_bold":
    case "money_generic":
      return "money";
    default:
      return "text";
  }
};

const createColumn = (key, dataKey, label, type = "text", extra = {}) => ({
  key,
  dataKey,
  label,
  type,
  ...extra,
});
const createField = (key, label, type = "text", extra = {}) => ({
  key,
  label,
  type,
  ...extra,
});
const createFormSection = (title, keys, subtitle = "") => ({
  title,
  subtitle,
  keys,
});
export const STATEMENT_CORE_COLUMN_KEYS = [
  "ref_no",
  "direction",
  "trans_date",
  "currency",
  "amount_usd",
  "amount_iqd",
];
const STATEMENT_PREFIX_COLUMN_KEYS = [
  "ref_no",
  "direction",
  "trans_date",
  "currency",
];
const STATEMENT_FINANCIAL_COLUMN_KEYS = [
  "cost_usd",
  "amount_usd",
  "cost_iqd",
  "amount_iqd",
];
const createStatementCoreColumns = () => [
  createColumn("ref_no", "RefNo", "رقم الفاتورة"),
  createColumn("direction", "TransTypeName", "نوع الحركة", "badge"),
  createColumn("trans_date", "TransDate", "التاريخ", "date"),
  createColumn("currency", "Currency", "العملة", "currency"),
  createColumn("amount_usd", "AmountUSD", "المبلغ دولار", "money_usd_bold"),
  createColumn("amount_iqd", "AmountIQD", "المبلغ دينار", "money_iqd_bold"),
];
const withStatementCoreColumns = columns => {
  const combinedColumns = [
    ...createStatementCoreColumns(),
    ...(columns || []),
  ].filter(
    (column, index, list) =>
      list.findIndex(entry => entry.key === column.key) === index
  );
  const reservedKeys = new Set([
    ...STATEMENT_PREFIX_COLUMN_KEYS,
    ...STATEMENT_FINANCIAL_COLUMN_KEYS,
  ]);

  return [
    ...STATEMENT_PREFIX_COLUMN_KEYS.map(key =>
      combinedColumns.find(column => column.key === key)
    ).filter(Boolean),
    ...STATEMENT_FINANCIAL_COLUMN_KEYS.map(key =>
      combinedColumns.find(column => column.key === key)
    ).filter(Boolean),
    ...combinedColumns.filter(column => !reservedKeys.has(column.key)),
  ];
};

function shouldKeepSectionFallbackLabel(sectionKey, fieldKey) {
  return sectionKey === "transport-1" && fieldKey === "ref_no";
}

const normalizeColumns = (columns = [], sectionKey) =>
  columns.map(column => ({
    ...column,
    label: shouldKeepSectionFallbackLabel(sectionKey, column.key)
      ? column.label
      : getFieldDisplayLabel(column.key, { fallback: column.label }),
  }));

const normalizeFields = (fields = [], targetKey, sectionKey) =>
  fields.map(field => ({
    ...field,
    label: shouldKeepSectionFallbackLabel(sectionKey, field.key)
      ? field.label
      : getFieldDisplayLabel(field.key, {
          variant:
            targetKey === "payment" || targetKey === "debit-note"
              ? "payment-ref"
              : "screen",
          fallback: field.label,
        }),
  }));

const normalizeSectionScreenSpecs = specs =>
  Object.fromEntries(
    Object.entries(specs).map(([sectionKey, spec]) => [
      sectionKey,
      {
        ...spec,
        ...(spec.list
          ? {
              list: {
                ...spec.list,
                columns: normalizeColumns(spec.list.columns, sectionKey),
              },
            }
          : {}),
        ...(spec.statement
          ? {
              statement: {
                ...spec.statement,
                columns: normalizeColumns(spec.statement.columns, sectionKey),
              },
            }
          : {}),
        ...(spec.invoice
          ? {
              invoice: {
                ...spec.invoice,
                fields: normalizeFields(
                  spec.invoice.fields,
                  "invoice",
                  sectionKey
                ),
              },
            }
          : {}),
        ...(spec.payment
          ? {
              payment: {
                ...spec.payment,
                fields: normalizeFields(
                  spec.payment.fields,
                  "payment",
                  sectionKey
                ),
              },
            }
          : {}),
        ...(spec["debit-note"]
          ? {
              "debit-note": {
                ...spec["debit-note"],
                fields: normalizeFields(
                  spec["debit-note"].fields,
                  "debit-note",
                  sectionKey
                ),
              },
            }
          : {}),
      },
    ])
  );

const createDebitNoteSpec = () => ({
  fields: [
    createField("ref_no", "رقم سند الإضافة", "text"),
    createField("trans_date", "التاريخ", "date"),
    createField("account_name", "اسم التاجر", "text"),
    createField("currency", "العملة", "text"),
    createField("driver_name", "اسم السائق", "text"),
    createField("vehicle_plate", "رقم السيارة", "text"),
    createField("good_type", "نوع البضاعة", "text"),
    createField("gov_name", "المحافظة", "text"),
    createField("weight", "الوزن", "number"),
    createField("amount_usd", "المبلغ دولار", "money"),
    createField("amount_iqd", "المبلغ دينار", "money"),
    createField("trader_note", "ملاحظات التاجر", "text"),
    createField("notes", "الملاحظات", "text"),
  ],
  layout: [
    createFormSection("المعلومات الأساسية", [
      "ref_no",
      "trans_date",
      "account_name",
      "currency",
    ]),
    createFormSection("بيانات الشحنة", [
      "driver_name",
      "vehicle_plate",
      "good_type",
      "gov_name",
      "weight",
    ]),
    createFormSection("القيم المالية", ["amount_usd", "amount_iqd"]),
    createFormSection("الملاحظات", ["trader_note", "notes"]),
  ],
});

const RAW_SECTION_SCREEN_SPECS = {
  "transport-1": {
    targets: ["list", "statement", "invoice", "payment"],
    list: {
      columns: [
        createColumn("ref_no", "RefNo", "رقم الفاتورة"),
        createColumn("direction", "TransTypeName", "نوع الحركة", "badge"),
        createColumn("trans_date", "TransDate", "التاريخ", "date"),
        createColumn("account_name", "AccountName", "اسم الناقل"),
        createColumn("currency", "Currency", "العملة", "currency"),
        createColumn(
          "amount_usd",
          "AmountUSD",
          "المبلغ دولار",
          "money_usd_bold"
        ),
        createColumn(
          "amount_iqd",
          "AmountIQD",
          "المبلغ دينار",
          "money_iqd_bold"
        ),
        createColumn("good_type", "GoodTypeName", "نوع الحمل"),
        createColumn("trader_note", "TraderNote", "اسم التاجر"),
        createColumn("car_qty", "CarQty", "عدد السيارات", "number"),
      ],
    },
    statement: {
      columns: withStatementCoreColumns([
        createColumn("good_type", "GoodTypeName", "نوع الحمل"),
        createColumn("trader_note", "TraderNote", "اسم التاجر"),
        createColumn("car_qty", "CarQty", "عدد السيارات", "number"),
        createColumn("gov_name", "Governorate", "المحافظة"),
        createColumn("notes", "Notes", "الملاحظات", "notes"),
      ]),
    },
    invoice: {
      fields: [
        createField("ref_no", "رقم الفاتورة", "text", { readOnly: true }),
        createField("trans_date", "التاريخ", "date"),
        createField("account_name", "اسم الناقل", "text"),
        createField("currency", "العملة", "text"),
        createField("trader_note", "اسم التاجر", "text"),
        createField("good_type", "نوع الحمل", "text"),
        createField("amount_usd", "المبلغ دولار", "money"),
        createField("amount_iqd", "المبلغ دينار", "money"),
        createField("car_qty", "عدد السيارات", "number"),
        createField("gov_name", "المحافظة", "text"),
        createField("notes", "الملاحظات", "text"),
      ],
      layout: [
        createFormSection("المعلومات الأساسية", [
          "ref_no",
          "trans_date",
          "account_name",
          "currency",
          "trader_note",
        ]),
        createFormSection("تفاصيل الحركة", [
          "good_type",
          "car_qty",
          "gov_name",
        ]),
        createFormSection("القيم المالية", ["amount_usd", "amount_iqd"]),
        createFormSection("الملاحظات", ["notes"]),
      ],
    },
    payment: {
      fields: [
        createField("ref_no", "رقم سند القبض", "text", { readOnly: true }),
        createField("trans_date", "التاريخ", "date"),
        createField("currency", "العملة", "text"),
        createField("account_name", "اسم الناقل", "text"),
        createField("amount_usd", "المبلغ دولار", "money"),
        createField("amount_iqd", "المبلغ دينار", "money"),
        createField("notes", "الملاحظات", "text"),
      ],
      layout: [
        createFormSection("المعلومات الأساسية", [
          "ref_no",
          "trans_date",
          "currency",
          "account_name",
        ]),
        createFormSection("القيم المالية", ["amount_usd", "amount_iqd"]),
        createFormSection("الملاحظات", ["notes"]),
      ],
    },
  },
  "port-1": {
    targets: ["list", "statement", "invoice", "payment", "debit-note"],
    "debit-note": createDebitNoteSpec(),
    list: {
      columns: [
        createColumn("ref_no", "RefNo", "رقم الفاتورة"),
        createColumn("direction", "TransTypeName", "نوع الحركة", "badge"),
        createColumn("trans_date", "TransDate", "التاريخ", "date"),
        createColumn("currency", "Currency", "العملة", "currency"),
        createColumn("driver_name", "DriverName", "اسم السائق"),
        createColumn("vehicle_plate", "VehiclePlate", "رقم السيارة"),
        createColumn("good_type", "GoodTypeName", "نوع البضاعة"),
        createColumn("weight", "Weight", "الوزن", "number"),
        createColumn("meters", "Meters", "الامتار", "number"),
        createColumn("cost_usd", "CostUSD", "الكلفة دولار", "money_usd"),
        createColumn(
          "amount_usd",
          "AmountUSD",
          "المبلغ دولار",
          "money_usd_bold"
        ),
        createColumn("cost_iqd", "CostIQD", "الكلفة دينار", "money_iqd"),
        createColumn(
          "amount_iqd",
          "AmountIQD",
          "المبلغ دينار",
          "money_iqd_bold"
        ),
        createColumn("gov_name", "Governorate", "المحافظة"),
        createColumn("fee_usd", "FeeUSD", "النقل السعودي $", "money_usd"),
        createColumn(
          "trans_price",
          "TransPrice",
          "نقل عراقي (دينار)",
          "money_iqd"
        ),
      ],
    },
    statement: {
      columns: [
        createColumn("ref_no", "RefNo", "رقم الفاتورة"),
        createColumn("direction", "TransTypeName", "نوع الحركة", "badge"),
        createColumn("trans_date", "TransDate", "التاريخ", "date"),
        createColumn("currency", "Currency", "العملة", "currency"),
        createColumn("driver_name", "DriverName", "اسم السائق"),
        createColumn("vehicle_plate", "VehiclePlate", "رقم السيارة"),
        createColumn("good_type", "GoodTypeName", "نوع البضاعة"),
        createColumn("weight", "Weight", "الوزن", "number"),
        createColumn("meters", "Meters", "الامتار", "number"),
        createColumn("cost_usd", "CostUSD", "الكلفة دولار", "money_usd"),
        createColumn(
          "amount_usd",
          "AmountUSD",
          "المبلغ دولار",
          "money_usd_bold"
        ),
        createColumn("cost_iqd", "CostIQD", "الكلفة دينار", "money_iqd"),
        createColumn(
          "amount_iqd",
          "AmountIQD",
          "المبلغ دينار",
          "money_iqd_bold"
        ),
        createColumn("fee_usd", "FeeUSD", "النقل السعودي $", "money_usd"),
        createColumn("gov_name", "Governorate", "المحافظة"),
        createColumn("trader_note", "TraderNote", "ملاحظات التاجر", "notes"),
        createColumn("notes", "Notes", "ملاحظات المالك", "notes"),
      ],
    },
    invoice: {
      fields: [
        createField("ref_no", "رقم الفاتورة", "text", { readOnly: true }),
        createField("trans_date", "التاريخ", "date"),
        createField("account_name", "اسم التاجر", "text"),
        createField("currency", "العملة", "text"),
        createField("driver_name", "اسم السائق", "text"),
        createField("vehicle_plate", "رقم السيارة", "text"),
        createField("good_type", "نوع البضاعة", "text"),
        createField("weight", "الوزن", "number"),
        createField("meters", "الامتار", "number"),
        createField("cost_usd", "الكلفة دولار", "money"),
        createField("amount_usd", "المبلغ دولار", "money"),
        createField("cost_iqd", "الكلفة دينار", "money"),
        createField("amount_iqd", "المبلغ دينار", "money"),
        createField("gov_name", "المحافظة", "text"),
        createField("fee_usd", "النقل السعودي $", "money"),
        createField("trans_price", "نقل عراقي (دينار)", "money"),
        createField("trader_note", "ملاحظات التاجر", "text"),
        createField("notes", "ملاحظات المالك", "text"),
        createField("invoice_notes", "ملاحظات الفاتورة", "text"),
        createField("invoice_details", "تفاصيل الفاتورة", "text"),
      ],
      layout: [
        createFormSection("المعلومات الأساسية", [
          "ref_no",
          "trans_date",
          "account_name",
          "currency",
        ]),
        createFormSection("بيانات الشحنة", [
          "driver_name",
          "vehicle_plate",
          "good_type",
          "weight",
          "meters",
        ]),
        createFormSection("القيم المالية", [
          "cost_usd",
          "amount_usd",
          "cost_iqd",
          "amount_iqd",
        ]),
        createFormSection("تفاصيل إضافية", [
          "gov_name",
          "fee_usd",
          "trans_price",
        ]),
        createFormSection("الملاحظات", ["trader_note", "notes"]),
        createFormSection("بيانات الفاتورة", ["invoice_notes", "invoice_details"]),
      ],
    },
    payment: {
      fields: [
        createField("ref_no", "رقم سند القبض", "text", { readOnly: true }),
        createField("trans_date", "التاريخ", "date"),
        createField("account_name", "اسم التاجر", "text"),
        createField("currency", "العملة", "text"),
        createField("amount_usd", "المبلغ دولار", "money"),
        createField("amount_iqd", "المبلغ دينار", "money"),
        createField("trader_note", "ملاحظات التاجر", "text"),
        createField("notes", "ملاحظات المالك", "text"),
      ],
      layout: [
        createFormSection("المعلومات الأساسية", [
          "ref_no",
          "trans_date",
          "account_name",
          "currency",
        ]),
        createFormSection("القيم المالية", ["amount_usd", "amount_iqd"]),
        createFormSection("الملاحظات", ["trader_note", "notes"]),
      ],
    },
  },
  "port-2": {
    targets: ["list", "statement", "invoice", "payment", "debit-note"],
    "debit-note": createDebitNoteSpec(),
    list: {
      columns: [
        createColumn("ref_no", "RefNo", "رقم الفاتورة"),
        createColumn("direction", "TransTypeName", "نوع الحركة", "badge"),
        createColumn("trans_date", "TransDate", "التاريخ", "date"),
        createColumn("account_name", "AccountName", "اسم التاجر"),
        createColumn("currency", "Currency", "العملة", "currency"),
        createColumn("driver_name", "DriverName", "اسم السائق"),
        createColumn("vehicle_plate", "VehiclePlate", "رقم السيارة"),
        createColumn("good_type", "GoodTypeName", "نوع البضاعة"),
        createColumn("weight", "Weight", "الوزن", "number"),
        createColumn("qty", "Qty", "العدد", "number"),
        createColumn("cost_usd", "CostUSD", "الكلفة دولار", "money_usd"),
        createColumn(
          "amount_usd",
          "AmountUSD",
          "المبلغ دولار",
          "money_usd_bold"
        ),
      ],
    },
    statement: {
      columns: withStatementCoreColumns([
        createColumn("account_name", "AccountName", "اسم التاجر", "text", {
          defaultVisible: false,
        }),
        createColumn("currency", "Currency", "العملة", "currency"),
        createColumn("driver_name", "DriverName", "اسم السائق"),
        createColumn("vehicle_plate", "VehiclePlate", "رقم السيارة"),
        createColumn("good_type", "GoodTypeName", "نوع البضاعة"),
        createColumn("weight", "Weight", "الوزن", "number"),
        createColumn("qty", "Qty", "العدد", "number"),
        createColumn("cost_usd", "CostUSD", "الكلفة دولار", "money_usd"),
        createColumn(
          "amount_usd",
          "AmountUSD",
          "المبلغ دولار",
          "money_usd_bold"
        ),
        createColumn("cost_iqd", "CostIQD", "الكلفة دينار", "money_iqd"),
        createColumn(
          "amount_iqd",
          "AmountIQD",
          "المبلغ دينار",
          "money_iqd_bold"
        ),
        createColumn("syr_cus", "SyrCus", "الكمرك السوري", "money_usd", {
          defaultVisible: false,
        }),
        createColumn("trader_note", "TraderNote", "ملاحظات التاجر", "notes", {
          defaultVisible: false,
        }),
        createColumn("notes", "Notes", "ملاحظات المالك", "notes", {
          defaultVisible: false,
        }),
      ]),
    },
    invoice: {
      fields: [
        createField("ref_no", "رقم الفاتورة", "text", { readOnly: true }),
        createField("trans_date", "التاريخ", "date"),
        createField("account_name", "اسم التاجر", "text"),
        createField("currency", "العملة", "text"),
        createField("driver_name", "اسم السائق", "text"),
        createField("vehicle_plate", "رقم السيارة", "text"),
        createField("good_type", "نوع البضاعة", "text"),
        createField("weight", "الوزن", "number"),
        createField("qty", "العدد", "number"),
        createField("cost_usd", "الكلفة دولار", "money"),
        createField("amount_usd", "المبلغ دولار", "money"),
        createField("cost_iqd", "الكلفة دينار", "money"),
        createField("amount_iqd", "المبلغ دينار", "money"),
        createField("syr_cus", "الكمرك السوري", "money"),
        createField("trader_note", "ملاحظات التاجر", "text"),
        createField("notes", "ملاحظات المالك", "text"),
        createField("invoice_notes", "ملاحظات الفاتورة", "text"),
        createField("invoice_details", "تفاصيل الفاتورة", "text"),
      ],
      layout: [
        createFormSection("المعلومات الأساسية", [
          "ref_no",
          "trans_date",
          "account_name",
          "currency",
        ]),
        createFormSection("بيانات الشحنة", [
          "driver_name",
          "vehicle_plate",
          "good_type",
          "weight",
          "qty",
        ]),
        createFormSection("القيم المالية", [
          "cost_usd",
          "amount_usd",
          "cost_iqd",
          "amount_iqd",
        ]),
        createFormSection("تفاصيل إضافية", ["syr_cus"]),
        createFormSection("الملاحظات", ["trader_note", "notes"]),
        createFormSection("بيانات الفاتورة", ["invoice_notes", "invoice_details"]),
      ],
    },
    payment: {
      fields: [
        createField("ref_no", "رقم سند القبض", "text", { readOnly: true }),
        createField("trans_date", "التاريخ", "date"),
        createField("account_name", "اسم التاجر", "text"),
        createField("currency", "العملة", "text"),
        createField("amount_usd", "المبلغ دولار", "money"),
        createField("amount_iqd", "المبلغ دينار", "money"),
        createField("trader_note", "ملاحظات التاجر", "text"),
        createField("notes", "ملاحظات المالك", "text"),
      ],
      layout: [
        createFormSection("المعلومات الأساسية", [
          "ref_no",
          "trans_date",
          "account_name",
          "currency",
        ]),
        createFormSection("القيم المالية", ["amount_usd", "amount_iqd"]),
        createFormSection("الملاحظات", ["trader_note", "notes"]),
      ],
    },
  },
  "port-3": {
    targets: ["list", "statement", "invoice", "payment", "debit-note"],
    "debit-note": createDebitNoteSpec(),
    list: {
      columns: [
        createColumn("ref_no", "RefNo", "رقم الفاتورة"),
        createColumn("direction", "TransTypeName", "نوع الحركة", "badge"),
        createColumn("trans_date", "TransDate", "التاريخ", "date"),
        createColumn("currency", "Currency", "العملة", "currency"),
        createColumn("driver_name", "DriverName", "اسم السائق"),
        createColumn("vehicle_plate", "VehiclePlate", "رقم السيارة"),
        createColumn("good_type", "GoodTypeName", "نوع البضاعة"),
        createColumn("weight", "Weight", "الوزن", "number"),
        createColumn("qty", "Qty", "العدد", "number"),
        createColumn("cost_usd", "CostUSD", "الكلفة دولار", "money_usd"),
        createColumn(
          "amount_usd",
          "AmountUSD",
          "المبلغ دولار",
          "money_usd_bold"
        ),
        createColumn("cost_iqd", "CostIQD", "الكلفة دينار", "money_iqd"),
        createColumn(
          "amount_iqd",
          "AmountIQD",
          "المبلغ دينار",
          "money_iqd_bold"
        ),
      ],
    },
    statement: {
      columns: [
        createColumn("ref_no", "RefNo", "رقم الفاتورة"),
        createColumn("direction", "TransTypeName", "نوع الحركة", "badge"),
        createColumn("trans_date", "TransDate", "التاريخ", "date"),
        createColumn("currency", "Currency", "العملة", "currency"),
        createColumn("driver_name", "DriverName", "اسم السائق"),
        createColumn("vehicle_plate", "VehiclePlate", "رقم السيارة"),
        createColumn("good_type", "GoodTypeName", "نوع البضاعة"),
        createColumn("weight", "Weight", "الوزن", "number"),
        createColumn("qty", "Qty", "العدد", "number"),
        createColumn("cost_usd", "CostUSD", "الكلفة دولار", "money_usd"),
        createColumn(
          "amount_usd",
          "AmountUSD",
          "المبلغ دولار",
          "money_usd_bold"
        ),
        createColumn("cost_iqd", "CostIQD", "الكلفة دينار", "money_iqd"),
        createColumn(
          "amount_iqd",
          "AmountIQD",
          "المبلغ دينار",
          "money_iqd_bold"
        ),
        createColumn("company_name", "CompanyName", "الشركة"),
        createColumn("trader_note", "TraderNote", "ملاحظات التاجر", "notes"),
        createColumn("notes", "Notes", "ملاحظات المالك", "notes"),
      ],
    },
    invoice: {
      fields: [
        createField("ref_no", "رقم الفاتورة", "text", { readOnly: true }),
        createField("trans_date", "التاريخ", "date"),
        createField("account_name", "اسم التاجر", "text"),
        createField("currency", "العملة", "text"),
        createField("driver_name", "اسم السائق", "text"),
        createField("vehicle_plate", "رقم السيارة", "text"),
        createField("good_type", "نوع البضاعة", "text"),
        createField("weight", "الوزن", "number"),
        createField("qty", "العدد", "number"),
        createField("cost_usd", "الكلفة دولار", "money"),
        createField("amount_usd", "المبلغ دولار", "money"),
        createField("cost_iqd", "الكلفة دينار", "money"),
        createField("amount_iqd", "المبلغ دينار", "money"),
        createField("trader_note", "ملاحظات التاجر", "text"),
        createField("notes", "ملاحظات المالك", "text"),
        createField("company_name", "الشركة", "text"),
        createField("invoice_notes", "ملاحظات الفاتورة", "text"),
        createField("invoice_details", "تفاصيل الفاتورة", "text"),
      ],
      layout: [
        createFormSection("المعلومات الأساسية", [
          "ref_no",
          "trans_date",
          "account_name",
          "currency",
        ]),
        createFormSection("بيانات الشحنة", [
          "driver_name",
          "vehicle_plate",
          "good_type",
          "weight",
          "qty",
        ]),
        createFormSection("القيم المالية", [
          "cost_usd",
          "amount_usd",
          "cost_iqd",
          "amount_iqd",
        ]),
        createFormSection("تفاصيل إضافية", ["company_name"]),
        createFormSection("الملاحظات", ["trader_note", "notes"]),
        createFormSection("بيانات الفاتورة", ["invoice_notes", "invoice_details"]),
      ],
    },
    payment: {
      fields: [
        createField("ref_no", "رقم سند القبض", "text"),
        createField("trans_date", "التاريخ", "date"),
        createField("account_name", "اسم التاجر", "text"),
        createField("currency", "العملة", "text"),
        createField("amount_usd", "المبلغ دولار", "money"),
        createField("amount_iqd", "المبلغ دينار", "money"),
        createField("trader_note", "ملاحظات التاجر", "text"),
        createField("notes", "الملاحظات", "text"),
      ],
      layout: [
        createFormSection("المعلومات الأساسية", [
          "ref_no",
          "trans_date",
          "account_name",
          "currency",
        ]),
        createFormSection("القيم المالية", ["amount_usd", "amount_iqd"]),
        createFormSection("الملاحظات", ["trader_note", "notes"]),
      ],
    },
  },
  "partnership-1": {
    targets: ["list", "statement", "invoice", "payment"],
    list: {
      columns: [
        createColumn("ref_no", "RefNo", "رقم الفاتورة"),
        createColumn("direction", "TransTypeName", "نوع الحركة", "badge"),
        createColumn("trans_date", "TransDate", "التاريخ", "date"),
        createColumn("account_name", "AccountName", "اسم الحساب"),
        createColumn("currency", "Currency", "العملة", "currency"),
        createColumn("driver_name", "DriverName", "اسم السائق"),
        createColumn("vehicle_plate", "VehiclePlate", "رقم السيارة"),
        createColumn("good_type", "GoodTypeName", "نوع البضاعة"),
        createColumn(
          "amount_usd",
          "AmountUSD",
          "المبلغ دولار",
          "money_usd_bold"
        ),
        createColumn(
          "amount_iqd",
          "AmountIQD",
          "المبلغ دينار",
          "money_iqd_bold"
        ),
        createColumn("notes", "Notes", "الملاحظات", "notes"),
      ],
    },
    statement: {
      columns: withStatementCoreColumns([
        createColumn("account_name", "AccountName", "اسم الحساب"),
        createColumn("currency", "Currency", "العملة", "currency"),
        createColumn("driver_name", "DriverName", "اسم السائق"),
        createColumn("vehicle_plate", "VehiclePlate", "رقم السيارة"),
        createColumn("good_type", "GoodTypeName", "نوع البضاعة"),
        createColumn(
          "amount_usd",
          "AmountUSD",
          "المبلغ دولار",
          "money_usd_bold"
        ),
        createColumn(
          "amount_iqd",
          "AmountIQD",
          "المبلغ دينار",
          "money_iqd_bold"
        ),
        createColumn("notes", "Notes", "الملاحظات", "notes"),
      ]),
    },
    invoice: {
      fields: [
        createField("ref_no", "رقم الفاتورة", "text", { readOnly: true }),
        createField("trans_date", "التاريخ", "date"),
        createField("account_name", "اسم الشريك", "text"),
        createField("currency", "العملة", "text"),
        createField("good_type", "نوع البضاعة", "text"),
        createField("vehicle_plate", "رقم السيارة", "text"),
        createField("driver_name", "اسم السائق", "text"),
        createField("amount_iqd", "المبلغ دينار", "money"),
        createField("amount_usd", "المبلغ دولار", "money"),
        createField("notes", "ملاحظات المالك", "text"),
      ],
      layout: [
        createFormSection("المعلومات الأساسية", [
          "ref_no",
          "trans_date",
          "account_name",
          "currency",
        ]),
        createFormSection("بيانات الشحنة", [
          "good_type",
          "vehicle_plate",
          "driver_name",
        ]),
        createFormSection("القيم المالية", ["amount_iqd", "amount_usd"]),
        createFormSection("الملاحظات", ["notes"]),
      ],
    },
    payment: {
      fields: [
        createField("ref_no", "رقم سند القبض", "text", { readOnly: true }),
        createField("trans_date", "التاريخ", "date"),
        createField("currency", "العملة", "text"),
        createField("account_name", "اسم التاجر", "text"),
        createField("amount_usd", "المبلغ دولار", "money"),
        createField("amount_iqd", "المبلغ دينار", "money"),
        createField("notes", "ملاحظات المالك", "text"),
      ],
      layout: [
        createFormSection("المعلومات الأساسية", [
          "ref_no",
          "trans_date",
          "currency",
          "account_name",
        ]),
        createFormSection("القيم المالية", ["amount_usd", "amount_iqd"]),
        createFormSection("الملاحظات", ["notes"]),
      ],
    },
  },
  "fx-1": {
    targets: ["list", "statement", "invoice", "payment", "debit-note"],
    "debit-note": createDebitNoteSpec(),
    list: {
      columns: [
        createColumn("ref_no", "RefNo", "رقم الفاتورة"),
        createColumn("direction", "TransTypeName", "نوع الحركة", "badge"),
        createColumn("trans_date", "TransDate", "التاريخ", "date"),
        createColumn("account_name", "AccountName", "اسم الحساب"),
        createColumn("currency", "Currency", "العملة", "currency"),
        createColumn(
          "amount_usd",
          "AmountUSD",
          "المبلغ دولار",
          "money_usd_bold"
        ),
        createColumn(
          "amount_iqd",
          "AmountIQD",
          "المبلغ دينار",
          "money_iqd_bold"
        ),
        createColumn("trader_note", "TraderNote", "ملاحظات الحساب", "notes"),
        createColumn("notes", "Notes", "الملاحظات", "notes"),
      ],
    },
    statement: {
      columns: withStatementCoreColumns([
        createColumn("account_name", "AccountName", "اسم الحساب", "text", {
          defaultVisible: false,
        }),
        createColumn("currency", "Currency", "العملة", "currency"),
        createColumn(
          "amount_usd",
          "AmountUSD",
          "المبلغ دولار",
          "money_usd_bold"
        ),
        createColumn(
          "amount_iqd",
          "AmountIQD",
          "المبلغ دينار",
          "money_iqd_bold"
        ),
        createColumn("trader_note", "TraderNote", "ملاحظات الحساب", "notes"),
        createColumn("notes", "Notes", "الملاحظات", "notes"),
      ]),
    },
    invoice: {
      fields: [
        createField("ref_no", "رقم الفاتورة", "text", { readOnly: true }),
        createField("trans_date", "التاريخ", "date"),
        createField("account_name", "اسم الحساب", "text"),
        createField("currency", "العملة", "text"),
        createField("amount_usd", "المبلغ دولار", "money"),
        createField("amount_iqd", "المبلغ دينار", "money"),
        createField("trader_note", "ملاحظات الحساب", "text"),
        createField("notes", "ملاحظات المالك", "text"),
      ],
      layout: [
        createFormSection("المعلومات الأساسية", [
          "ref_no",
          "trans_date",
          "account_name",
          "currency",
        ]),
        createFormSection("القيم المالية", ["amount_usd", "amount_iqd"]),
        createFormSection("الملاحظات", ["trader_note", "notes"]),
      ],
    },
    payment: {
      fields: [
        createField("ref_no", "رقم سند القبض", "text", { readOnly: true }),
        createField("trans_date", "التاريخ", "date"),
        createField("account_name", "اسم الحساب", "text"),
        createField("currency", "العملة", "text"),
        createField("amount_usd", "المبلغ دولار", "money"),
        createField("amount_iqd", "المبلغ دينار", "money"),
        createField("trader_note", "ملاحظات الحساب", "text"),
        createField("notes", "ملاحظات المالك", "text"),
      ],
      layout: [
        createFormSection("المعلومات الأساسية", [
          "ref_no",
          "trans_date",
          "account_name",
          "currency",
        ]),
        createFormSection("القيم المالية", ["amount_usd", "amount_iqd"]),
        createFormSection("الملاحظات", ["trader_note", "notes"]),
      ],
    },
  },
};

export const SECTION_SCREEN_SPECS = normalizeSectionScreenSpecs(
  RAW_SECTION_SCREEN_SPECS
);

export function isConfiguredTransactionSection(sectionKey) {
  return Boolean(SECTION_SCREEN_SPECS[sectionKey]);
}

export function getConfiguredTargetsForSection(sectionKey) {
  return SECTION_SCREEN_SPECS[sectionKey]?.targets || [];
}

export function getSectionScreenSpec(sectionKey, targetKey) {
  return SECTION_SCREEN_SPECS[sectionKey]?.[targetKey] || null;
}

export function getSectionColumns(sectionKey, targetKey) {
  return getSectionScreenSpec(sectionKey, targetKey)?.columns || [];
}

export function getSectionFormLayout(sectionKey, targetKey) {
  return getSectionScreenSpec(sectionKey, targetKey)?.layout || [];
}

export function getSectionTargetFields(sectionKey, targetKey) {
  const spec = getSectionScreenSpec(sectionKey, targetKey);
  if (!spec) return [];

  if (Array.isArray(spec.fields)) return spec.fields;
  if (Array.isArray(spec.columns)) {
    return spec.columns.map(({ key, label, type, defaultVisible }) => ({
      key,
      label,
      type: asFieldType(type),
      defaultVisible,
    }));
  }

  return [];
}

export function getSectionFieldLabelMap(sectionKey, targetKey) {
  return Object.fromEntries(
    getSectionTargetFields(sectionKey, targetKey).map(field => [
      field.key,
      field.label,
    ])
  );
}

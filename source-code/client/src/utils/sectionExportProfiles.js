import { getSectionColumns, isConfiguredTransactionSection } from './sectionScreenSpecs';
import { getFieldDisplayLabel } from './fieldDisplayLabels';
import { getTransactionTypeLabel } from './transactionTypeLabels';

const EXPORT_COLUMN_FORMATS = {
  date: 'date',
  number: 'number',
  money_usd: 'money',
  money_usd_bold: 'money',
  money_iqd: 'money_iqd',
  money_iqd_bold: 'money_iqd',
  money_generic: 'number',
};

const CURRENT_TEMPLATE_START_KEYS = [
  'ref_no',
  'direction',
  'trans_date',
  'account_name',
  'currency',
  'driver_name',
  'vehicle_plate',
  'good_type',
  'weight',
  'qty',
  'cost_usd',
  'amount_usd',
  'cost_iqd',
  'amount_iqd',
];

const createProfile = (id, label, columnKeys, extra = {}) => ({
  id,
  label,
  columnKeys,
  ...extra,
});

const createDirectColumn = (key, label, format, extra = {}) => ({
  key,
  label,
  format,
  ...extra,
});

const normalizeExportColumns = (columns = [], variant = 'compact-export') => columns.map((column) => ({
  ...column,
  label: getFieldDisplayLabel(column.key, {
    variant,
    fallback: column.label,
  }),
}));

const EXPORT_LABELS = {
  notes: '\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a',
  saudiUsd: '\u0646\u0645\u0648\u0630\u062c \u062f\u0648\u0644\u0627\u0631',
  saudiIqd: '\u0646\u0645\u0648\u0630\u062c \u062f\u064a\u0646\u0627\u0631',
  saudiBoth: '\u0646\u0645\u0648\u0630\u062c \u062f\u0648\u0644\u0627\u0631 + \u062f\u064a\u0646\u0627\u0631',
  saudiGovernorate: '\u0646\u0645\u0648\u0630\u062c \u0645\u062d\u0627\u0641\u0638\u0629',
  totalInvoicesUsd: '\u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0643\u0644\u064a \u062f\u0648\u0644\u0627\u0631',
  totalInvoicesIqd: '\u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0643\u0644\u064a \u062f\u064a\u0646\u0627\u0631',
  filteredUsd: '\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u0641\u0644\u062a\u0631 \u062f\u0648\u0644\u0627\u0631',
  filteredIqd: '\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u0641\u0644\u062a\u0631 \u062f\u064a\u0646\u0627\u0631',
  totalWeight: '\u0645\u062c\u0645\u0648\u0639 \u0627\u0644\u0648\u0632\u0646 \u0627\u0644\u0643\u0644\u064a',
};

const buildCombinedNotesColumn = () => createDirectColumn('__combinedNotes', EXPORT_LABELS.notes, undefined, {
  getValue: (row) => row.TraderNote || row.Notes || '',
});

const buildSaudiStatementSummaryCards = (printContext = {}) => {
  const totals = printContext?.totals || {};

  return [
    { label: EXPORT_LABELS.totalInvoicesUsd, value: `$${Number(totals.totalInvoicesUSD || 0).toLocaleString('en-US')}` },
    { label: EXPORT_LABELS.totalInvoicesIqd, value: Number(totals.totalInvoicesIQD || 0).toLocaleString('en-US') },
    { label: EXPORT_LABELS.filteredUsd, value: `$${Number(totals.balanceUSD || 0).toLocaleString('en-US')}` },
    { label: EXPORT_LABELS.filteredIqd, value: Number(totals.balanceIQD || 0).toLocaleString('en-US') },
    { label: EXPORT_LABELS.totalWeight, value: Number(totals.totalWeight || 0).toLocaleString('en-US') },
  ];
};

const buildSaudiStatementProfiles = ({ includeSummaryCards = false } = {}) => {
  const summaryCardConfig = includeSummaryCards
    ? { summaryCards: ({ printContext }) => buildSaudiStatementSummaryCards(printContext) }
    : {};

  return [
    {
      id: 'saudi-usd',
      label: EXPORT_LABELS.saudiUsd,
      filenameSuffix: 'usd',
      printRenderer: 'saudi-statement',
      templateVariant: 'usd',
      columns: [
        createDirectColumn('DriverName', 'DriverName'),
        createDirectColumn('VehiclePlate', 'VehiclePlate'),
        createDirectColumn('GoodTypeName', 'GoodTypeName'),
        createDirectColumn('TransDate', 'TransDate', 'date'),
        createDirectColumn('Weight', 'Weight', 'number'),
        createDirectColumn('Meters', 'Meters', 'number'),
        createDirectColumn('AmountUSD', 'AmountUSD', 'money'),
        buildCombinedNotesColumn(),
      ],
      ...summaryCardConfig,
    },
    {
      id: 'saudi-iqd',
      label: EXPORT_LABELS.saudiIqd,
      filenameSuffix: 'iqd',
      printRenderer: 'saudi-statement',
      templateVariant: 'iqd',
      columns: [
        createDirectColumn('DriverName', 'DriverName'),
        createDirectColumn('VehiclePlate', 'VehiclePlate'),
        createDirectColumn('GoodTypeName', 'GoodTypeName'),
        createDirectColumn('TransDate', 'TransDate', 'date'),
        createDirectColumn('Weight', 'Weight', 'number'),
        createDirectColumn('Meters', 'Meters', 'number'),
        createDirectColumn('AmountIQD', 'AmountIQD', 'money_iqd'),
        buildCombinedNotesColumn(),
      ],
      ...summaryCardConfig,
    },
    {
      id: 'saudi-both',
      label: EXPORT_LABELS.saudiBoth,
      filenameSuffix: 'both',
      printRenderer: 'saudi-statement',
      templateVariant: 'both',
      columns: [
        createDirectColumn('DriverName', 'DriverName'),
        createDirectColumn('VehiclePlate', 'VehiclePlate'),
        createDirectColumn('GoodTypeName', 'GoodTypeName'),
        createDirectColumn('TransDate', 'TransDate', 'date'),
        createDirectColumn('Weight', 'Weight', 'number'),
        createDirectColumn('Meters', 'Meters', 'number'),
        createDirectColumn('AmountUSD', 'AmountUSD', 'money'),
        createDirectColumn('AmountIQD', 'AmountIQD', 'money_iqd'),
        buildCombinedNotesColumn(),
      ],
      ...summaryCardConfig,
    },
    {
      id: 'saudi-governorate',
      label: EXPORT_LABELS.saudiGovernorate,
      filenameSuffix: 'governorate',
      printRenderer: 'saudi-statement',
      templateVariant: 'governorate',
      columns: [
        createDirectColumn('DriverName', 'DriverName'),
        createDirectColumn('VehiclePlate', 'VehiclePlate'),
        createDirectColumn('GoodTypeName', 'GoodTypeName'),
        createDirectColumn('Governorate', 'Governorate'),
        createDirectColumn('TransDate', 'TransDate', 'date'),
        createDirectColumn('Weight', 'Weight', 'number'),
        createDirectColumn('Meters', 'Meters', 'number'),
        createDirectColumn('AmountUSD', 'AmountUSD', 'money'),
        createDirectColumn('AmountIQD', 'AmountIQD', 'money_iqd'),
        buildCombinedNotesColumn(),
      ],
      ...summaryCardConfig,
    },
  ];
};

const PROFILE_SPECS = {
  'transport-1': {
    list: [
      createProfile('transport-ops', 'تشغيلي', [
        'trans_date',
        'ref_no',
        'account_name',
        'carrier_name',
        'good_type',
        'car_qty',
        'gov_name',
        'amount_usd',
        'amount_iqd',
      ], { filenameSuffix: 'تشغيلي' }),
      createProfile('transport-finance', 'مالي', [
        'ref_no',
        'direction',
        'trans_date',
        'currency',
        'amount_usd',
        'amount_iqd',
        'account_name',
        'carrier_name',
      ], { filenameSuffix: 'مالي' }),
    ],
    statement: [
      createProfile('transport-statement-detail', 'تفصيلي', [
        'ref_no',
        'direction',
        'trans_date',
        'account_name',
        'carrier_name',
        'good_type',
        'car_qty',
        'gov_name',
        'notes',
        'amount_usd',
        'amount_iqd',
      ], { filenameSuffix: 'تفصيلي' }),
      createProfile('transport-statement-finance', 'مالي', [
        'ref_no',
        'direction',
        'trans_date',
        'currency',
        'amount_usd',
        'amount_iqd',
        'account_name',
        'carrier_name',
        'notes',
      ], { filenameSuffix: 'مالي' }),
    ],
  },
  'port-1': {
    list: [
      createProfile('saudi-ops', 'تشغيلي', [
        'trans_date',
        'ref_no',
        'account_name',
        'driver_name',
        'vehicle_plate',
        'good_type',
        'weight',
        'meters',
        'gov_name',
        'trader_note',
        'notes',
      ], { filenameSuffix: 'تشغيلي' }),
      createProfile('saudi-finance', 'مالي', [
        'ref_no',
        'trans_date',
        'account_name',
        'currency',
        'cost_usd',
        'amount_usd',
        'cost_iqd',
        'amount_iqd',
        'fee_usd',
        'trans_price',
      ], { filenameSuffix: 'مالي' }),
    ],
    statement: buildSaudiStatementProfiles(),
  },
  'port-2': {
    list: [
      createProfile('mondhiriya-ops', 'تشغيلي', [
        'ref_no',
        'trans_date',
        'account_name',
        'driver_name',
        'vehicle_plate',
        'good_type',
        'weight',
        'trader_note',
        'notes',
      ], { filenameSuffix: 'تشغيلي' }),
      createProfile('mondhiriya-finance', 'مالي', [
        'ref_no',
        'direction',
        'trans_date',
        'currency',
        'cost_usd',
        'amount_usd',
        'cost_iqd',
        'amount_iqd',
        'syr_cus',
      ], { filenameSuffix: 'مالي' }),
    ],    statement: [
      {
        id: 'mondhiriya-usd',
        label: 'نموذج دولار',
        filenameSuffix: 'usd',
        columns: [
          createDirectColumn('DriverName', 'اسم السائق'),
          createDirectColumn('VehiclePlate', 'رقم السيارة'),
          createDirectColumn('GoodTypeName', 'نوع البضاعة'),
          createDirectColumn('TransDate', 'التاريخ', 'date'),
          createDirectColumn('Weight', 'الوزن', 'number'),
          createDirectColumn('AmountUSD', 'المبلغ $', 'money'),
          createDirectColumn('SyrCus', 'الكمرك السوري', 'money'),
          createDirectColumn('__combinedNotes', 'الملاحظات', undefined, {
            getValue: (row) => row.TraderNote || row.Notes || '',
          }),
        ],
      },
      createProfile('mondhiriya-statement-ops', 'تشغيلي', [
        'ref_no',
        'direction',
        'trans_date',
        'account_name',
        'driver_name',
        'vehicle_plate',
        'good_type',
        'weight',
        'trader_note',
        'notes',
      ], { filenameSuffix: 'تشغيلي' }),
      createProfile('mondhiriya-statement-finance', 'مالي', [
        'ref_no',
        'direction',
        'trans_date',
        'currency',
        'cost_usd',
        'amount_usd',
        'cost_iqd',
        'amount_iqd',
        'syr_cus',
      ], { filenameSuffix: 'مالي' }),
    ],
  },
  'port-3': {
    list: [
      createProfile('qaim-ops', 'تشغيلي', [
        'ref_no',
        'direction',
        'trans_date',
        'account_name',
        'driver_name',
        'vehicle_plate',
        'good_type',
        'weight',
        'qty',
      ], { filenameSuffix: 'تشغيلي' }),
      createProfile('qaim-finance', 'مالي', [
        'ref_no',
        'direction',
        'trans_date',
        'currency',
        'cost_usd',
        'amount_usd',
        'cost_iqd',
        'amount_iqd',
      ], { filenameSuffix: 'مالي' }),
    ],
    statement: buildSaudiStatementProfiles(),
  },
  'partnership-1': {
    list: [
      createProfile('partnership-ops', 'تشغيلي', [
        'ref_no',
        'direction',
        'trans_date',
        'account_name',
        'driver_name',
        'vehicle_plate',
        'good_type',
        'notes',
      ], { filenameSuffix: 'تشغيلي' }),
      createProfile('partnership-finance', 'مالي', [
        'ref_no',
        'direction',
        'trans_date',
        'currency',
        'amount_usd',
        'amount_iqd',
        'account_name',
        'good_type',
      ], { filenameSuffix: 'مالي' }),
    ],
    statement: [
      createProfile('partnership-statement-ops', 'تشغيلي', [
        'ref_no',
        'direction',
        'trans_date',
        'account_name',
        'driver_name',
        'vehicle_plate',
        'good_type',
        'notes',
      ], { filenameSuffix: 'تشغيلي' }),
      createProfile('partnership-statement-finance', 'مالي', [
        'ref_no',
        'direction',
        'trans_date',
        'currency',
        'amount_usd',
        'amount_iqd',
        'account_name',
        'notes',
      ], { filenameSuffix: 'مالي' }),
    ],
  },
};

function getSectionColumnLibrary(sectionKey) {
  const columnMap = new Map();

  ['list', 'statement'].forEach((targetKey) => {
    getSectionColumns(sectionKey, targetKey).forEach((column) => {
      if (!columnMap.has(column.key)) {
        columnMap.set(column.key, column);
      }
    });
  });

  return columnMap;
}

function resolveExportColumns(sectionKey, columnKeys, labelOverrides = {}) {
  const columnLibrary = getSectionColumnLibrary(sectionKey);

  return (columnKeys || [])
    .map((columnKey) => {
      const column = columnLibrary.get(columnKey);
      if (!column) return null;

      return {
        key: column.dataKey,
        label: columnKey === 'ref_no' && sectionKey === 'transport-1'
          ? 'رقم المستند'
          : (labelOverrides[columnKey] || column.label),
        format: EXPORT_COLUMN_FORMATS[column.type],
        ...(columnKey === 'direction'
          ? {
              getValue: (row) => getTransactionTypeLabel(row?.TransTypeName, row?.TransTypeID, {
                sectionKey,
                recordType: row?.RecordType,
              }),
            }
          : {}),
      };
    })
    .filter(Boolean);
}

export function buildCurrentTemplateColumns(sectionKey, fallbackColumns = []) {
  const columnLibrary = getSectionColumnLibrary(sectionKey);
  const fallbackByExportKey = new Map((fallbackColumns || []).map((column) => [column.key, column]));
  const usedKeys = new Set();
  const orderedColumns = [];

  CURRENT_TEMPLATE_START_KEYS.forEach((columnKey) => {
    const sectionColumn = columnLibrary.get(columnKey);
    if (!sectionColumn) return;

    const exportKey = sectionColumn.dataKey;
    if (usedKeys.has(exportKey)) return;

    orderedColumns.push(
      fallbackByExportKey.get(exportKey) || {
        key: exportKey,
        label: sectionColumn.label,
        format: EXPORT_COLUMN_FORMATS[sectionColumn.type],
      },
    );
    usedKeys.add(exportKey);
  });

  (fallbackColumns || []).forEach((column) => {
    if (usedKeys.has(column.key)) return;
    orderedColumns.push(column);
    usedKeys.add(column.key);
  });

  return orderedColumns;
}

export function getSectionExportProfiles(sectionKey, targetKey) {
  if (!isConfiguredTransactionSection(sectionKey)) return [];

  return (PROFILE_SPECS[sectionKey]?.[targetKey] || [])
    .map((profile) => ({
      ...profile,
      columns: normalizeExportColumns(
        Array.isArray(profile.columns)
          ? profile.columns
          : resolveExportColumns(sectionKey, profile.columnKeys, profile.labelOverrides),
        profile.labelVariant || 'compact-export',
      ),
    }))
    .filter((profile) => profile.columns.length > 0);
}

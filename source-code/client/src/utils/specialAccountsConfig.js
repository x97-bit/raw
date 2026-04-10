import { Building2, Handshake } from 'lucide-react';
import { getFieldLabel } from './fieldConfigMetadata';
import { buildSpecialPartnerTotals } from './specialPartnerMath';
import { buildSpecialHaiderTotals } from './specialHaiderMath';

const formatNum = (value) => (value ? Number(value).toLocaleString('en-US') : '0');

const SPECIAL_CARD_TONES = {
  usd: 'text-[#9ab6ca]',
  iqd: 'text-[#eef3f7]',
  success: 'text-[#8eb8ad]',
  warning: 'text-[#d1b58b]',
  rose: 'text-[#c697a1]',
  muted: 'text-[#9aa8b7]',
  soft: 'text-[#c8d4df]',
};

const HAIDER_COLUMNS = [
  { key: 'trans_date', dataKey: 'TransDate', label: 'التاريخ', format: 'date', render: (value) => value?.split(' ')[0] || '-' },
  { key: 'driver_name', dataKey: 'DriverName', label: 'اسم السائق', render: (value) => value || '-' },
  { key: 'vehicle_plate', dataKey: 'PlateNumber', label: 'رقم السيارة', render: (value) => value || '-' },
  { key: 'good_type', dataKey: 'GoodType', label: 'نوع البضاعة', render: (value) => value || '-' },
  { key: 'weight', dataKey: 'Weight', label: 'الوزن', format: 'number', render: (value) => (value ? formatNum(value) : '-') },
  { key: 'amount_usd', dataKey: 'AmountUSD', label: 'المبلغ دولار', format: 'money', render: (value) => (value ? `$${formatNum(value)}` : '0') },
  { key: 'amount_iqd', dataKey: 'AmountIQD', label: 'المبلغ دينار', format: 'money_iqd', render: (value) => (value ? formatNum(value) : '0') },
  { key: 'difference_iqd', dataKey: 'DifferenceIQD', label: 'الفرق دينار', format: 'money_iqd', render: (value) => (value ? formatNum(value) : '0') },
  { key: 'notes', dataKey: 'TraderNote', label: 'ملاحظات', render: (value) => value || '-', isNotes: true },
];

const PARTNER_COLUMNS = [
  { key: 'trans_date', dataKey: 'TransDate', label: 'التاريخ', format: 'date', render: (value) => value?.split(' ')[0] || '-' },
  { key: 'port_name', dataKey: 'PortName', label: 'المنفذ', render: (value) => value || '-' },
  { key: 'trader_name', dataKey: 'TraderName', label: 'التاجر', render: (value) => value || '-', isMedium: true },
  { key: 'driver_name', dataKey: 'DriverName', label: 'اسم السائق', render: (value) => value || '-' },
  { key: 'vehicle_plate', dataKey: 'VehiclePlate', label: 'رقم السيارة', render: (value) => value || '-' },
  { key: 'good_type', dataKey: 'GoodType', label: 'نوع البضاعة', render: (value) => value || '-' },
  { key: 'gov_name', dataKey: 'GovName', label: 'الجهة الحكومية', render: (value) => value || '-' },
  { key: 'company_name', dataKey: 'CompanyName', label: 'الشركة', render: (value) => value || '-' },
  { key: 'qty', dataKey: 'Qty', label: 'العدد', format: 'number', render: (value) => value || '-' },
  { key: 'amount_usd', dataKey: 'AmountUSD', label: 'المبلغ عليه ($)', format: 'money', render: (value) => `$${formatNum(value)}`, isBold: true },
  { key: 'amount_usd_partner', dataKey: 'AmountUSD_Partner', label: 'المبلغ له ($)', format: 'money', render: (value) => (value ? `$${formatNum(value)}` : '-') },
  { key: 'difference_iqd', dataKey: 'DifferenceIQD', label: 'الفرق', format: 'number', render: (value) => (value ? formatNum(value) : '-') },
  { key: 'clr', dataKey: 'CLR', label: 'التخليص', format: 'number', render: (value) => value || '-' },
  { key: 'tx', dataKey: 'TX', label: 'المأمور', format: 'number', render: (value) => value || '-' },
  { key: 'taxi_water', dataKey: 'TaxiWater', label: 'التكسي', format: 'number', render: (value) => (value ? formatNum(value) : '-') },
  { key: 'notes', dataKey: 'Notes', label: 'ملاحظات', render: (value) => value || '-', isNotes: true },
];

export const SPECIAL_ACCOUNT_DEFS = {
  haider: {
    id: 'haider',
    label: 'حيدر شركة الأنوار',
    endpoint: '/special/haider',
    icon: Building2,
    color: 'from-teal-500 to-emerald-700',
    glow: 'hover:shadow-teal-500/20',
    sectionKey: 'special-haider',
    rowsKey: 'statement',
    columns: HAIDER_COLUMNS,
    searchKeys: ['TraderNote', 'Notes', 'GoodType', 'DriverName', 'PlateNumber', 'Destination', 'BatchName'],
    buildTotals: buildSpecialHaiderTotals,
    buildSummaryCards: (totals) => ([
      { label: 'المبلغ الكلي دولار', value: `$${formatNum(totals.totalAmountUSD)}`, tone: SPECIAL_CARD_TONES.usd },
      { label: 'الإجمالي دينار', value: formatNum(totals.totalAmountIQD), tone: SPECIAL_CARD_TONES.iqd },
      { label: 'إجمالي الفرق', value: formatNum(totals.totalDifferenceIQD), tone: SPECIAL_CARD_TONES.soft },
      { label: 'المبلغ الكلي دينار', value: formatNum(totals.totalGrandIQD), tone: SPECIAL_CARD_TONES.warning },
      { label: 'مجموع الوزن الكلي', value: formatNum(totals.totalWeight), tone: SPECIAL_CARD_TONES.muted },
    ]),
    buildExportTotalsRow: (totals) => ({
      AmountUSD: totals.totalAmountUSD,
      AmountIQD: totals.totalAmountIQD,
      DifferenceIQD: totals.totalDifferenceIQD,
    }),
    getFooterValue: (columnKey, totals) => ({
      weight: formatNum(totals.totalWeight),
      amount_usd: `$${formatNum(totals.totalAmountUSD)}`,
      amount_iqd: formatNum(totals.totalAmountIQD),
      difference_iqd: formatNum(totals.totalDifferenceIQD),
    }[columnKey]),
  },
  'partnership-yaser': {
    id: 'partnership-yaser',
    label: 'ياسر عادل',
    endpoint: '/special/partnership',
    icon: Handshake,
    color: 'from-violet-500 to-purple-700',
    glow: 'hover:shadow-violet-500/20',
    sectionKey: 'special-partner',
    rowsKey: 'rows',
    columns: PARTNER_COLUMNS,
    searchKeys: ['TraderName', 'Notes', 'PortName', 'GoodType', 'GovName', 'VehiclePlate', 'CompanyName'],
    buildTotals: buildSpecialPartnerTotals,
    buildSummaryCards: (totals) => ([
      { label: 'إجمالي المبلغ عليه ($)', value: `$${formatNum(totals.totalAmountUSD)}`, tone: SPECIAL_CARD_TONES.warning },
      { label: 'إجمالي المبلغ له ($)', value: `$${formatNum(totals.totalPartnerUSD)}`, tone: SPECIAL_CARD_TONES.iqd },
      { label: 'الصافي (عليه - له) ($)', value: `$${formatNum(totals.totalNetUSD)}`, tone: totals.totalNetUSD >= 0 ? SPECIAL_CARD_TONES.success : SPECIAL_CARD_TONES.rose },
      { label: 'أصل المبلغ له ($)', value: `$${formatNum(totals.totalPartnerBaseUSD)}`, tone: SPECIAL_CARD_TONES.usd },
      { label: 'إجمالي الفرق', value: formatNum(totals.totalDifferenceIQD), tone: SPECIAL_CARD_TONES.soft },
      { label: 'إجمالي التخليص', value: formatNum(totals.totalCLR), tone: SPECIAL_CARD_TONES.iqd },
      { label: 'إجمالي تكسي + المأمور', value: formatNum(totals.totalTaxiAndOfficer), tone: SPECIAL_CARD_TONES.muted },
      { label: 'عدد المعاملات', value: totals.count, tone: SPECIAL_CARD_TONES.muted },
    ]),
    buildExportTotalsRow: (totals) => ({
      AmountUSD: totals.totalAmountUSD,
      AmountUSD_Partner: totals.totalPartnerBaseUSD,
      DifferenceIQD: totals.totalDifferenceIQD,
      CLR: totals.totalCLR,
      TaxiWater: totals.totalTaxiWater,
      TX: totals.totalTX,
    }),
    getFooterValue: (columnKey, totals) => ({
      amount_usd: `$${formatNum(totals.totalAmountUSD)}`,
      amount_usd_partner: `$${formatNum(totals.totalPartnerBaseUSD)}`,
      difference_iqd: formatNum(totals.totalDifferenceIQD),
      clr: formatNum(totals.totalCLR),
      taxi_water: formatNum(totals.totalTaxiWater),
      tx: formatNum(totals.totalTX),
    }[columnKey]),
  },
};

export const SPECIAL_FORM_FIELDS = {
  haider: [
    { key: 'date', label: 'التاريخ', type: 'date' },
    { key: 'driverName', label: 'اسم السائق', type: 'text' },
    { key: 'vehiclePlate', label: 'رقم السيارة', type: 'text' },
    { key: 'goodType', label: 'نوع البضاعة', type: 'text' },
    { key: 'weight', label: 'الوزن', type: 'number', step: '0.01' },
    { key: 'amountUSD', label: 'المبلغ دولار', type: 'number', step: '0.01' },
    { key: 'amountIQD', label: 'المبلغ دينار', type: 'number', step: '1' },
    { key: 'differenceIQD', label: 'الفرق دينار', type: 'number', step: '1' },
    { key: 'notes', label: 'ملاحظات', type: 'textarea', className: 'md:col-span-2 xl:col-span-3' },
  ],
  'partnership-yaser': [
    { key: 'date', label: 'التاريخ', type: 'date' },
    { key: 'traderName', label: 'اسم التاجر', type: 'text' },
    { key: 'driverName', label: 'اسم السائق', type: 'text' },
    { key: 'vehiclePlate', label: 'رقم السيارة', type: 'text' },
    { key: 'goodType', label: 'نوع البضاعة', type: 'text' },
    { key: 'portName', label: 'المنفذ', type: 'text' },
    { key: 'companyName', label: 'الشركة', type: 'text' },
    { key: 'qty', label: 'العدد', type: 'number', step: '1' },
    { key: 'amountUSD', label: 'المبلغ عليه ($)', type: 'number', step: '0.01' },
    { key: 'amountUSDPartner', label: 'المبلغ له ($)', type: 'number', step: '0.01' },
    { key: 'differenceIQD', label: 'الفرق', type: 'number', step: '1' },
    { key: 'clr', label: 'التخليص', type: 'number', step: '0.01' },
    { key: 'tx', label: 'المأمور', type: 'number', step: '0.01' },
    { key: 'taxiWater', label: 'التكسي', type: 'number', step: '0.01' },
    { key: 'notes', label: 'ملاحظات', type: 'textarea', className: 'md:col-span-2 xl:col-span-3' },
  ],
};

export function createInitialSpecialFieldState() {
  return {
    'special-haider': { visibleKeys: SPECIAL_ACCOUNT_DEFS.haider.columns.map((column) => column.key), configMap: {} },
    'special-partner': { visibleKeys: SPECIAL_ACCOUNT_DEFS['partnership-yaser'].columns.map((column) => column.key), configMap: {} },
  };
}

export function buildVisibleSpecialColumns(columns, visibleKeys, configMap) {
  return visibleKeys
    .map((key) => {
      const column = columns.find((entry) => entry.key === key);
      return column ? { ...column, label: getFieldLabel(configMap, key, column.label) } : null;
    })
    .filter(Boolean);
}

export function filterSpecialAccountRows(rows, search, columns, searchKeys = []) {
  const normalized = String(search || '').trim().toLowerCase();
  if (!normalized) return rows;

  const keys = [...new Set([...columns.map((column) => column.dataKey), ...searchKeys])];
  return rows.filter((row) => keys.some((key) => String(row?.[key] ?? '').toLowerCase().includes(normalized)));
}

export function getInitialSpecialForm(accountId, accountLabel, record = null) {
  const type = accountId === 'haider' ? 'haider' : 'partnership';
  return {
    type,
    name: accountLabel,
    date: record?.TransDate?.split(' ')[0] || new Date().toISOString().split('T')[0],
    traderName: record?.TraderName || '',
    driverName: record?.DriverName || '',
    vehiclePlate: record?.VehiclePlate || record?.PlateNumber || '',
    goodType: record?.GoodType || '',
    govName: record?.GovName || '',
    portName: record?.PortName || '',
    companyName: record?.CompanyName || '',
    batchName: record?.BatchName || '',
    destination: record?.Destination || '',
    amountUSD: record?.AmountUSD ?? '',
    amountIQD: record?.AmountIQD ?? '',
    costUSD: record?.CostUSD ?? '',
    costIQD: record?.CostIQD ?? '',
    amountUSDPartner: record?.AmountUSD_Partner ?? '',
    differenceIQD: record?.DifferenceIQD ?? '',
    clr: record?.CLR ?? '',
    tx: record?.TX ?? '',
    taxiWater: record?.TaxiWater ?? '',
    weight: record?.Weight ?? '',
    meters: record?.Meters ?? '',
    qty: record?.Qty ?? '',
    notes: record?.Notes || record?.TraderNote || '',
  };
}

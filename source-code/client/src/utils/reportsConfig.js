export const REPORT_PORTS = [
  { id: 'port-1', name: 'السعودية', icon: '🇸🇦' },
  { id: 'port-2', name: 'المنذرية', icon: '🚛' },
  { id: 'port-3', name: 'القائم', icon: '🧾' },
];

export const EXPENSES_EXPORT_COLUMNS = [
  { key: 'TransDate', label: 'التاريخ', format: 'date' },
  { key: 'RefNo', label: 'المرجع' },
  { key: 'AccountName', label: 'التاجر' },
  { key: 'GoodType', label: 'البضاعة' },
  { key: 'Weight', label: 'الوزن', format: 'number' },
  { key: 'CostUSD', label: 'التكلفة ($)', format: 'money' },
  { key: 'AmountUSD', label: 'المبلغ ($)', format: 'money' },
];

export const PROFITS_EXPORT_COLUMNS = [
  { key: 'TransDate', label: 'التاريخ', format: 'date' },
  { key: 'RefNo', label: 'المرجع' },
  { key: 'AccountName', label: 'التاجر' },
  { key: 'GoodTypeName', label: 'البضاعة' },
  { key: 'CostUSD', label: 'التكلفة ($)', format: 'money' },
  { key: 'AmountUSD', label: 'المبلغ ($)', format: 'money' },
  { key: 'ProfitUSD', label: 'الربح ($)', format: 'money' },
];

export const PROFITS_BY_TRADER_EXPORT_COLUMNS = [
  { key: 'AccountName', label: 'التاجر' },
  { key: 'shipmentCount', label: 'عدد الشحنات', format: 'number' },
  { key: 'totalCostUSD', label: 'التكلفة ($)', format: 'money' },
  { key: 'totalAmountUSD', label: 'المبلغ ($)', format: 'money' },
  { key: 'totalProfitUSD', label: 'الربح ($)', format: 'money' },
  { key: 'totalProfitIQD', label: 'الربح (د.ع)', format: 'money_iqd' },
];

const formatNum = (value) => (value ? Number(value).toLocaleString('en-US') : '0');

export function buildExpensesSummaryCards(data) {
  return [
    { label: 'عدد الفواتير', value: data?.rows?.length || 0 },
    { label: 'إجمالي التكلفة', value: `$${formatNum(data?.totals?.totalCostUSD)}` },
    { label: 'إجمالي المبلغ', value: `$${formatNum(data?.totals?.totalAmountUSD)}` },
  ];
}

export function buildProfitSummaryCards(totals = {}) {
  return [
    { label: 'عدد الشحنات', value: totals.shipmentCount || 0 },
    { label: 'إجمالي التكلفة', value: `$${formatNum(totals.totalCostUSD)}` },
    { label: 'إجمالي المبلغ', value: `$${formatNum(totals.totalAmountUSD)}` },
    { label: 'إجمالي الربح', value: `$${formatNum(totals.totalProfitUSD)}` },
  ];
}

export function buildReportPrintMetaItems(activePort, filters = {}) {
  return [
    { label: 'المنفذ', value: activePort?.name || '---' },
    { label: 'من تاريخ', value: filters?.from || 'كل الفترة' },
    { label: 'إلى تاريخ', value: filters?.to || 'كل الفترة' },
  ];
}

export function buildProfitsPrintSections({ traderProfits = [], profitRows = [], profitTotals = {} } = {}) {
  const sections = [];

  if (traderProfits.length > 0) {
    sections.push({
      key: 'profits-by-trader',
      title: 'ملخص الأرباح حسب التاجر',
      columns: PROFITS_BY_TRADER_EXPORT_COLUMNS,
      rows: traderProfits,
      totalsRow: {
        shipmentCount: profitTotals.shipmentCount,
        totalCostUSD: profitTotals.totalCostUSD,
        totalAmountUSD: profitTotals.totalAmountUSD,
        totalProfitUSD: profitTotals.totalProfitUSD,
        totalProfitIQD: profitTotals.totalProfitIQD,
      },
      highlightRows: false,
      emptyMessage: 'لا توجد أرباح مجمعة حسب التاجر.',
    });
  }

  sections.push({
    key: 'profit-shipment-details',
    title: 'تفاصيل الشحنات',
    columns: PROFITS_EXPORT_COLUMNS,
    rows: profitRows,
    totalsRow: {
      CostUSD: profitTotals.totalCostUSD,
      AmountUSD: profitTotals.totalAmountUSD,
      ProfitUSD: profitTotals.totalProfitUSD,
    },
    highlightRows: false,
    emptyMessage: 'لا توجد شحنات مطابقة.',
  });

  return sections;
}

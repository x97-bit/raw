export const REPORT_PORTS = [
  { id: 'port-1', name: 'السعودية', iconLines: ['السعودية'] },
  { id: 'port-2', name: 'المنذرية', iconLines: ['المنذرية'] },
  { id: 'port-3', name: 'القائم', iconLines: ['القائم'] },
];

export const EXPENSES_EXPORT_COLUMNS = [
  { key: 'expenseDate', label: 'التاريخ', format: 'date' },
  { key: 'description', label: 'البيان' },
  { key: 'chargeTarget', label: 'التحميل' },
  { key: 'accountName', label: 'التاجر' },
  { key: 'amountUSD', label: 'المبلغ ($)', format: 'money' },
  { key: 'amountIQD', label: 'المبلغ (د.ع)', format: 'money_iqd' },
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
    { label: 'عدد المصاريف', value: data?.totals?.count || data?.rows?.length || 0 },
    { label: 'على المنفذ ($)', value: `$${formatNum(data?.totals?.directExpenseUSD)}` },
    { label: 'على المنفذ (د.ع)', value: formatNum(data?.totals?.directExpenseIQD) },
    { label: 'محمل على التاجر ($)', value: `$${formatNum(data?.totals?.chargedToTraderUSD)}` },
    { label: 'محمل على التاجر (د.ع)', value: formatNum(data?.totals?.chargedToTraderIQD) },
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

export function formatExpenseNumber(value) {
  return value ? Number(value).toLocaleString('en-US') : '0';
}

export const PORT_OPTIONS = [
  { value: 'general', label: 'مصاريف عامة' },
  { value: 'port-1', label: 'مصاريف السعودية' },
  { value: 'port-2', label: 'مصاريف المنذرية' },
  { value: 'port-3', label: 'مصاريف القائم' },
];

export function getExpensePortLabel(value) {
  return PORT_OPTIONS.find((option) => option.value === value)?.label || value || '-';
}

export const EXPENSE_TARGET_OPTIONS = [
  { value: 'port', label: 'على المنفذ' },
  { value: 'trader', label: 'على التاجر' },
];

export function getExpenseChargeTargetLabel(value) {
  return EXPENSE_TARGET_OPTIONS.find((option) => option.value === value)?.label || 'على المنفذ';
}

export const EXPENSE_COLUMNS = [
  {
    key: 'expense_date',
    dataKey: 'expenseDate',
    label: 'التاريخ',
    render: (value) => value?.split(' ')[0] || '-',
  },
  {
    key: 'description',
    dataKey: 'description',
    label: 'الوصف',
    render: (value) => value || '-',
  },
  {
    key: 'charge_target',
    dataKey: 'chargeTarget',
    label: 'التحميل',
    render: (value) => getExpenseChargeTargetLabel(value),
  },
  {
    key: 'account_name',
    dataKey: 'accountName',
    label: 'اسم التاجر',
    render: (value, row) => (row?.chargeTarget === 'trader' ? (value || '-') : '-'),
  },
  {
    key: 'amount_usd',
    dataKey: 'amountUSD',
    label: 'المبلغ ($)',
    render: (value) => (value && value !== '0' ? `$${formatExpenseNumber(value)}` : '-'),
    bold: true,
  },
  {
    key: 'amount_iqd',
    dataKey: 'amountIQD',
    label: 'المبلغ (د.ع)',
    render: (value) => (value && value !== '0' ? formatExpenseNumber(value) : '-'),
  },
  {
    key: 'port_id',
    dataKey: 'portId',
    label: 'القسم',
    render: (value) => getExpensePortLabel(value),
  },
];

export function buildExpenseExportColumns(columns = EXPENSE_COLUMNS) {
  return columns.map((column) => ({ key: column.dataKey, label: column.label }));
}

export function createInitialExpenseForm() {
  return {
    expenseDate: new Date().toISOString().split('T')[0],
    portId: 'general',
    chargeTarget: 'port',
    accountId: null,
    accountName: '',
    amountUSD: '',
    amountIQD: '',
    description: '',
  };
}

export function createExpenseFormFromRow(expense = {}) {
  return {
    expenseDate: expense.expenseDate?.split(' ')[0] || '',
    amountUSD: expense.amountUSD || '',
    amountIQD: expense.amountIQD || '',
    description: expense.description || '',
    portId: expense.portId || 'general',
    chargeTarget: expense.chargeTarget || 'port',
    accountId: expense.accountId || null,
    accountName: expense.accountName || '',
  };
}

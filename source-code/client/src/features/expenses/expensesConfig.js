export function formatExpenseNumber(value) {
  return value ? Number(value).toLocaleString('en-US') : '0';
}

export const PORT_OPTIONS = [
  { value: 'general', label: 'مصاريف عامة' },
  { value: 'port-2', label: 'مصاريف المنذرية' },
  { value: 'port-3', label: 'مصاريف القائم' },
];

export function getExpensePortLabel(value) {
  return PORT_OPTIONS.find((option) => option.value === value)?.label || value || '-';
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
  };
}

export const formatTrialBalanceNumber = (value) => (
  value ? Number(value).toLocaleString('en-US') : '0'
);

const POSITIVE_TONE = 'text-[#8eb8ad]';
const NEGATIVE_TONE = 'text-[#c697a1]';
const ACCENT_TONE = 'text-[#9ab6ca]';
const NEUTRAL_TONE = 'text-[#c8d4df]';

const getBalanceTone = (value) => ((value || 0) >= 0 ? POSITIVE_TONE : NEGATIVE_TONE);
const renderMoneyValue = (value) => (value ? formatTrialBalanceNumber(value) : '-');

export const TRIAL_BALANCE_ALL_COLUMNS = [
  { key: 'account_name', dataKey: 'AccountName', label: 'الحساب', render: (value) => value || '-', isMedium: true },
  { key: 'account_type', dataKey: 'AccountTypeName', label: 'النوع', render: (value) => value || '-', isSmall: true },
  { key: 'shipment_count', dataKey: 'shipment_count', label: 'عدد الشحنات', format: 'number', render: (value) => value || 0, isCenter: true, colorClass: `${ACCENT_TONE} font-semibold` },
  { key: 'opening_usd', dataKey: 'opening_usd', label: 'رصيد افتتاحي ($)', format: 'money', render: renderMoneyValue, colorFn: getBalanceTone },
  { key: 'opening_iqd', dataKey: 'opening_iqd', label: 'رصيد افتتاحي (د.ع)', format: 'money_iqd', render: renderMoneyValue, colorFn: getBalanceTone },
  { key: 'debit_usd', dataKey: 'debit_usd', label: 'مدين ($)', format: 'money', render: renderMoneyValue, colorClass: POSITIVE_TONE },
  { key: 'credit_usd', dataKey: 'credit_usd', label: 'دائن ($)', format: 'money', render: renderMoneyValue, colorClass: NEGATIVE_TONE },
  { key: 'balance_usd', dataKey: 'balance_usd', label: 'الرصيد ($)', format: 'money', render: (value) => formatTrialBalanceNumber(value || 0), isBold: true, colorFn: getBalanceTone },
  { key: 'debit_iqd', dataKey: 'debit_iqd', label: 'مدين (د.ع)', format: 'money_iqd', render: renderMoneyValue, colorClass: POSITIVE_TONE },
  { key: 'credit_iqd', dataKey: 'credit_iqd', label: 'دائن (د.ع)', format: 'money_iqd', render: renderMoneyValue, colorClass: NEGATIVE_TONE },
  { key: 'balance_iqd', dataKey: 'balance_iqd', label: 'الرصيد (د.ع)', format: 'money_iqd', render: (value) => formatTrialBalanceNumber(value || 0), isBold: true, colorFn: getBalanceTone },
  { key: 'profit_usd', dataKey: 'profit_usd', label: 'الربح ($)', format: 'money', render: renderMoneyValue, isBold: true, colorFn: getBalanceTone },
  { key: 'profit_iqd', dataKey: 'profit_iqd', label: 'الربح (د.ع)', format: 'money_iqd', render: renderMoneyValue, colorFn: getBalanceTone },
  { key: 'transaction_count', dataKey: 'trans_count', label: 'المعاملات', format: 'number', render: (value) => value || 0, isCenter: true, colorClass: NEUTRAL_TONE },
];

export const TRIAL_BALANCE_SUMMABLE_KEYS = [
  'shipment_count',
  'opening_usd',
  'opening_iqd',
  'debit_usd',
  'credit_usd',
  'balance_usd',
  'debit_iqd',
  'credit_iqd',
  'balance_iqd',
  'profit_usd',
  'profit_iqd',
  'transaction_count',
];

const CURRENCY_LABELS = {
  USD: 'دولار',
  IQD: 'دينار',
  BOTH: 'دولار ودينار',
};

export function getCurrencyLabel(value) {
  return CURRENCY_LABELS[value] || value || '-';
}

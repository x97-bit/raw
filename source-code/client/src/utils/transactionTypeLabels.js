const INVOICE_LABEL = 'فاتورة';
const RECEIPT_VOUCHER_LABEL = 'سند قبض';
const TRANSPORT_INVOICE_LABEL = 'استحقاق نقل';
const TRANSPORT_PAYMENT_LABEL = 'دفعة نقل';
const TRANSPORT_INVOICE_REFERENCE_LABEL = 'رقم استحقاق النقل';
const TRANSPORT_PAYMENT_REFERENCE_LABEL = 'رقم سند الصرف';
const INVOICE_REFERENCE_LABEL = 'رقم الفاتورة';
const PAYMENT_REFERENCE_LABEL = 'رقم سند القبض';

const INVOICE_ALIASES = [
  'له',
  INVOICE_LABEL,
  TRANSPORT_INVOICE_LABEL,
  'استحقاق',
  'invoice',
  'in',
  'dr',
];

const RECEIPT_VOUCHER_ALIASES = [
  'عليه',
  'سند',
  'سند صرف',
  RECEIPT_VOUCHER_LABEL,
  TRANSPORT_PAYMENT_LABEL,
  'payment',
  'receipt',
  'voucher',
  'out',
  'cr',
];

export function isTransportSectionKey(sectionKey) {
  return String(sectionKey || '').trim().toLowerCase() === 'transport-1';
}

function isTransportTransactionContext(options = {}) {
  return (
    isTransportSectionKey(options.sectionKey)
    || String(options.portId || '').trim().toLowerCase() === 'transport-1'
    || String(options.accountType || '').trim() === '2'
  );
}

function getScopedTransactionLabels(options = {}) {
  if (isTransportTransactionContext(options)) {
    return {
      invoice: TRANSPORT_INVOICE_LABEL,
      payment: TRANSPORT_PAYMENT_LABEL,
      invoiceReference: TRANSPORT_INVOICE_REFERENCE_LABEL,
      paymentReference: TRANSPORT_PAYMENT_REFERENCE_LABEL,
    };
  }

  return {
    invoice: INVOICE_LABEL,
    payment: RECEIPT_VOUCHER_LABEL,
    invoiceReference: INVOICE_REFERENCE_LABEL,
    paymentReference: PAYMENT_REFERENCE_LABEL,
  };
}

export function getTransactionTypeLabel(value, transTypeId, options = {}) {
  const labels = getScopedTransactionLabels(options);

  if (transTypeId === 1 || transTypeId === '1') return labels.invoice;
  if (transTypeId === 2 || transTypeId === '2') return labels.payment;

  const normalized = String(value ?? '').trim().toLowerCase();

  if (INVOICE_ALIASES.includes(normalized)) {
    return labels.invoice;
  }

  if (RECEIPT_VOUCHER_ALIASES.includes(normalized)) {
    return labels.payment;
  }

  return value || '-';
}

export function getTransactionReferenceLabel(transTypeId, options = {}) {
  const labels = getScopedTransactionLabels(options);
  return transTypeId === 2 || transTypeId === '2'
    ? labels.paymentReference
    : labels.invoiceReference;
}

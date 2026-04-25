const INVOICE_LABEL = "فاتورة";
const RECEIPT_VOUCHER_LABEL = "سند قبض";
const DEBIT_NOTE_LABEL = "سند إضافة";
const EXPENSE_CHARGE_LABEL = "مصروف محمل على التاجر";
const TRANSPORT_INVOICE_LABEL = "استحقاق نقل";
const TRANSPORT_PAYMENT_LABEL = "سند دفع";
const TRANSPORT_INVOICE_REFERENCE_LABEL = "رقم استحقاق النقل";
const TRANSPORT_PAYMENT_REFERENCE_LABEL = "رقم سند الدفع";
const INVOICE_REFERENCE_LABEL = "رقم الفاتورة";
const PAYMENT_REFERENCE_LABEL = "رقم سند القبض";
const DEBIT_NOTE_REFERENCE_LABEL = "رقم سند الإضافة";
const GENERIC_REFERENCE_LABEL = "رقم المرجع";

const INVOICE_ALIASES = [
  "له",
  INVOICE_LABEL,
  TRANSPORT_INVOICE_LABEL,
  "استحقاق",
  "invoice",
  "in",
  "dr",
];

const RECEIPT_VOUCHER_ALIASES = [
  "عليه",
  "سند",
  "سند صرف",
  "سند دفع",
  RECEIPT_VOUCHER_LABEL,
  TRANSPORT_PAYMENT_LABEL,
  "payment",
  "receipt",
  "voucher",
  "out",
  "cr",
];

function normalizeRecordType(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function isDebitNoteRecordType(value) {
  const normalized = normalizeRecordType(value);
  return (
    normalized === "debit-note" ||
    String(value ?? "").trim() === DEBIT_NOTE_LABEL
  );
}

function isExpenseChargeRecordType(value) {
  return normalizeRecordType(value) === "expense-charge";
}

function getCustomRecordTypeLabel(recordType) {
  if (isDebitNoteRecordType(recordType)) return DEBIT_NOTE_LABEL;
  if (isExpenseChargeRecordType(recordType)) return EXPENSE_CHARGE_LABEL;
  return null;
}

function getCustomReferenceLabel(recordType) {
  if (isDebitNoteRecordType(recordType)) return DEBIT_NOTE_REFERENCE_LABEL;
  if (isExpenseChargeRecordType(recordType)) return GENERIC_REFERENCE_LABEL;
  return null;
}

export function isTransportSectionKey(sectionKey) {
  return (
    String(sectionKey || "")
      .trim()
      .toLowerCase() === "transport-1"
  );
}

function isTransportTransactionContext(options = {}) {
  return (
    isTransportSectionKey(options.sectionKey) ||
    String(options.portId || "")
      .trim()
      .toLowerCase() === "transport-1" ||
    String(options.accountType || "").trim() === "2"
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
  const customLabel = getCustomRecordTypeLabel(options.recordType);
  if (customLabel) return customLabel;

  if (transTypeId === 1 || transTypeId === "1") return labels.invoice;
  if (transTypeId === 2 || transTypeId === "2") return labels.payment;

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (INVOICE_ALIASES.includes(normalized)) {
    return labels.invoice;
  }

  if (RECEIPT_VOUCHER_ALIASES.includes(normalized)) {
    return labels.payment;
  }

  return value || "-";
}

export function getTransactionReferenceLabel(transTypeId, options = {}) {
  const labels = getScopedTransactionLabels(options);
  const customReferenceLabel = getCustomReferenceLabel(options.recordType);
  if (customReferenceLabel) return customReferenceLabel;

  return transTypeId === 2 || transTypeId === "2"
    ? labels.paymentReference
    : labels.invoiceReference;
}

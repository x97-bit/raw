const INVOICE_ALIASES = new Set(['IN', 'DR', '1']);
const PAYMENT_ALIASES = new Set(['OUT', 'CR', '2']);

function parseAmount(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? '0'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeDirectionValue(value: unknown): string {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (INVOICE_ALIASES.has(normalized)) return 'IN';
  if (PAYMENT_ALIASES.has(normalized)) return 'OUT';
  return normalized;
}

export function isInvoiceDirection(value: unknown): boolean {
  return normalizeDirectionValue(value) === 'IN';
}

export function isPaymentDirection(value: unknown): boolean {
  return normalizeDirectionValue(value) === 'OUT';
}

export function getStoredDirectionValue(value: unknown): 'IN' | 'OUT' {
  return isInvoiceDirection(value) ? 'IN' : 'OUT';
}

export function getDirectionAliases(value: unknown): string[] {
  return isInvoiceDirection(value)
    ? ['IN', 'in', 'DR', 'dr']
    : ['OUT', 'out', 'CR', 'cr'];
}

export function getAbsoluteAmount(value: unknown): number {
  return Math.abs(parseAmount(value));
}

export function getSignedDirectionAmount(value: unknown, direction: unknown): number {
  const amount = getAbsoluteAmount(value);
  return isInvoiceDirection(direction) ? amount : -amount;
}

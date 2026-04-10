export function normalizeDateValue(value: unknown) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  return normalized.split(" ")[0];
}

export function hasBodyValue(value: unknown) {
  return value !== undefined && value !== null && value !== "";
}

export function hasAnyBodyKey(body: Record<string, any>, keys: string[]) {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(body ?? {}, key));
}

export function pickBodyField(body: Record<string, any>, ...keys: string[]) {
  for (const key of keys) {
    if (hasBodyValue(body?.[key])) return body[key];
  }
  return undefined;
}

export function normalizeText(value: unknown, emptyValue: string | null = null) {
  if (!hasBodyValue(value)) return emptyValue;
  const normalized = String(value).trim();
  return normalized || emptyValue;
}

export function normalizeDecimal(value: unknown, zeroFallback = false) {
  if (!hasBodyValue(value)) return zeroFallback ? "0" : null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return zeroFallback ? "0" : null;
  return String(parsed);
}

export function normalizeInteger(value: unknown) {
  if (!hasBodyValue(value)) return null;
  const parsed = parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function withinDateRange(dateValue: string, from?: string, to?: string) {
  if (!dateValue) return !from && !to;
  if (from && dateValue < from) return false;
  if (to && dateValue > to) return false;
  return true;
}

export function sortByDateDesc<T extends { TransDate?: string; id?: number }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const dateCompare = String(b.TransDate || "").localeCompare(String(a.TransDate || ""));
    if (dateCompare !== 0) return dateCompare;
    return Number(b.id || 0) - Number(a.id || 0);
  });
}

export function getDefaultSpecialAccountName(type: string) {
  if (type === "haider") return "\u062D\u064A\u062F\u0631 \u0634\u0631\u0643\u0629 \u0627\u0644\u0623\u0646\u0648\u0627\u0631";
  if (type === "partnership" || type === "yaser") return "\u064A\u0627\u0633\u0631 \u0639\u0627\u062F\u0644";
  return "";
}

export function hasBodyValue(value: unknown) {
  return value !== undefined && value !== null && value !== "";
}

export function parseOptionalInt(value: unknown) {
  if (!hasBodyValue(value)) return undefined;
  const parsed = parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseOptionalDecimal(value: unknown) {
  if (!hasBodyValue(value)) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : undefined;
}

export function parseNullableNumber(value: unknown) {
  if (!hasBodyValue(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function pickBodyField(body: Record<string, any>, ...keys: string[]) {
  for (const key of keys) {
    if (hasBodyValue(body?.[key])) return body[key];
  }
  return undefined;
}

export function hasBodyKey(body: Record<string, any>, ...keys: string[]) {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(body, key));
}

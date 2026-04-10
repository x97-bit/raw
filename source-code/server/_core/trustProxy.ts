export function parseTrustProxySetting(value?: string) {
  const normalized = value?.trim();
  if (!normalized) {
    return "loopback";
  }

  if (/^\d+$/.test(normalized)) {
    return Number.parseInt(normalized, 10);
  }

  if (normalized.toLowerCase() === "true") {
    return true;
  }

  if (normalized.toLowerCase() === "false") {
    return false;
  }

  return normalized;
}

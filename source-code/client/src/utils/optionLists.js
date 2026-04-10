export function normalizeStringOptions(options = []) {
  const seen = new Set();
  const normalized = [];

  for (const option of options) {
    const value = String(option ?? '').trim();
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

export function normalizeAutocompleteOptions(options = [], { labelKey = 'name', valueKey = 'id' } = {}) {
  const seen = new Set();
  const normalized = [];

  for (const option of options) {
    const label = String(option?.[labelKey] ?? '').trim();
    const value = option?.[valueKey];
    const hasValue = value !== undefined && value !== null && String(value).trim() !== '';

    if (!label && !hasValue) continue;

    const dedupeKey = `${hasValue ? String(value) : ''}::${label}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    normalized.push({
      option,
      label,
      value,
      reactKey: dedupeKey || `label::${label}`,
    });
  }

  return normalized;
}

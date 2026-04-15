import { buildFieldConfigMap } from '../../utils/fieldConfigMetadata';

function resolveFieldConfigEntry(configRows, fallbackEntry) {
  if (!Array.isArray(configRows) || configRows.length === 0) {
    return fallbackEntry;
  }

  const configuredKeys = new Set(configRows.map((field) => field.fieldKey));
  const fallbackVisibleKeys = Array.isArray(fallbackEntry?.visibleKeys)
    ? fallbackEntry.visibleKeys.filter((key) => !configuredKeys.has(key))
    : [];

  return {
    configMap: buildFieldConfigMap(configRows),
    visibleKeys: [
      ...configRows
      .filter((field) => field.visible)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((field) => field.fieldKey),
      ...fallbackVisibleKeys,
    ],
  };
}

export function applyLoadedSpecialFieldConfigs(current, haiderConfig, partnerConfig) {
  return {
    ...current,
    'special-haider': resolveFieldConfigEntry(haiderConfig, current['special-haider']),
    'special-partner': resolveFieldConfigEntry(partnerConfig, current['special-partner']),
  };
}

export function buildSpecialAccountQuery(filters = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  return params.toString();
}

export function createSpecialAccountFilters() {
  return { from: '', to: '', search: '', batchName: '' };
}

export function createAuditFilters(overrides = {}) {
  return {
    entityType: '',
    action: '',
    username: '',
    from: '',
    to: '',
    limit: 100,
    ...overrides,
  };
}

export function buildAuditLogsQuery(filters = {}) {
  const params = new URLSearchParams();

  if (filters.entityType) params.set('entityType', filters.entityType);
  if (filters.action) params.set('action', filters.action);
  if (filters.username) params.set('username', filters.username);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  params.set('limit', String(filters.limit || 100));

  return params.toString();
}

export function parseAuditField(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function formatAuditDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString('ar-IQ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildAuditStats(rows = []) {
  return {
    total: rows.length,
    creates: rows.filter((row) => row.action === 'create').length,
    updates: rows.filter((row) => row.action === 'update').length,
    deletes: rows.filter((row) => row.action === 'delete').length,
  };
}

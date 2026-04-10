import { Filter } from 'lucide-react';
import { ACTION_OPTIONS, ENTITY_OPTIONS } from '../auditLogsConfig';

export default function AuditLogsFiltersPanel({ filters, onFieldChange, onApply }) {
  return (
    <div className="surface-card grid gap-4 p-4 lg:grid-cols-[170px_170px_180px_180px_170px_140px_auto]">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">من تاريخ</label>
        <input
          type="date"
          value={filters.from}
          onChange={(event) => onFieldChange('from', event.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">إلى تاريخ</label>
        <input
          type="date"
          value={filters.to}
          onChange={(event) => onFieldChange('to', event.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">الكيان</label>
        <select
          value={filters.entityType}
          onChange={(event) => onFieldChange('entityType', event.target.value)}
          className="input-field"
        >
          {ENTITY_OPTIONS.map((option) => (
            <option key={option.value || 'all-entities'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">العملية</label>
        <select
          value={filters.action}
          onChange={(event) => onFieldChange('action', event.target.value)}
          className="input-field"
        >
          {ACTION_OPTIONS.map((option) => (
            <option key={option.value || 'all-actions'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">المستخدم</label>
        <input
          value={filters.username}
          onChange={(event) => onFieldChange('username', event.target.value)}
          className="input-field"
          placeholder="admin"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">عدد السجلات</label>
        <input
          type="number"
          min="1"
          max="500"
          value={filters.limit}
          onChange={(event) => onFieldChange('limit', Number(event.target.value) || 100)}
          className="input-field"
        />
      </div>

      <button onClick={onApply} className="btn-primary h-[44px] self-end">
        <Filter size={16} />
        عرض
      </button>
    </div>
  );
}

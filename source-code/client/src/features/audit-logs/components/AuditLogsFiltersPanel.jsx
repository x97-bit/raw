import { Filter, X } from "lucide-react";
import { ACTION_OPTIONS, ENTITY_OPTIONS } from "../auditLogsConfig";
import { createAuditFilters } from "../auditLogsHelpers";

export default function AuditLogsFiltersPanel({
  filters,
  onFieldChange,
  onApply,
  onReset,
}) {
  const hasActiveFilters = Boolean(
    filters.entityType ||
      filters.action ||
      filters.username ||
      filters.from ||
      filters.to
  );

  const handleSubmit = event => {
    event.preventDefault();
    onApply();
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
      return;
    }
    const fresh = createAuditFilters();
    Object.entries(fresh).forEach(([key, value]) => onFieldChange(key, value));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-panel-border bg-panel p-5 shadow-lg transition-all"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-panel-text">
          <Filter size={18} className="text-primary" />
          فلاتر البحث والمطابقة
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-danger-text transition-colors hover:bg-danger-bg hover:opacity-80"
          >
            <X size={14} />
            إعادة تعيين
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-panel-muted">
            من تاريخ
          </label>
          <input
            type="date"
            value={filters.from}
            onChange={event => onFieldChange("from", event.target.value)}
            className="w-full rounded-xl border border-panel-border bg-panel/50 px-3 py-2.5 text-sm text-panel-text shadow-sm transition-colors focus:border-primary focus:bg-panel focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-panel-muted">
            إلى تاريخ
          </label>
          <input
            type="date"
            value={filters.to}
            onChange={event => onFieldChange("to", event.target.value)}
            className="w-full rounded-xl border border-panel-border bg-panel/50 px-3 py-2.5 text-sm text-panel-text shadow-sm transition-colors focus:border-primary focus:bg-panel focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-panel-muted">
            الكيان (الجدول)
          </label>
          <select
            value={filters.entityType}
            onChange={event => onFieldChange("entityType", event.target.value)}
            className="w-full rounded-xl border border-panel-border bg-panel/50 px-3 py-2.5 text-sm text-panel-text shadow-sm transition-colors focus:border-primary focus:bg-panel focus:outline-none [&>option]:bg-panel"
          >
            {ENTITY_OPTIONS.map(option => (
              <option key={option.value || "all-entities"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-panel-muted">
            نوع العملية
          </label>
          <select
            value={filters.action}
            onChange={event => onFieldChange("action", event.target.value)}
            className="w-full rounded-xl border border-panel-border bg-panel/50 px-3 py-2.5 text-sm text-panel-text shadow-sm transition-colors focus:border-primary focus:bg-panel focus:outline-none [&>option]:bg-panel"
          >
            {ACTION_OPTIONS.map(option => (
              <option key={option.value || "all-actions"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-panel-muted">
            المستخدم
          </label>
          <input
            value={filters.username}
            onChange={event => onFieldChange("username", event.target.value)}
            placeholder="ابحث باسم المستخدم..."
            className="w-full rounded-xl border border-panel-border bg-panel/50 px-3 py-2.5 text-sm text-panel-text placeholder-panel-muted/60 shadow-sm transition-colors focus:border-primary focus:bg-panel focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-panel-muted">
            الحد الأقصى (للعرض)
          </label>
          <select
            value={filters.limit}
            onChange={event =>
              onFieldChange("limit", Number(event.target.value) || 100)
            }
            className="w-full rounded-xl border border-panel-border bg-panel/50 px-3 py-2.5 text-sm text-panel-text shadow-sm transition-colors focus:border-primary focus:bg-panel focus:outline-none [&>option]:bg-panel"
          >
            <option value={50}>50 سجل</option>
            <option value={100}>100 سجل</option>
            <option value={200}>200 سجل</option>
            <option value={500}>500 سجل</option>
          </select>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold tracking-wide text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] hover:shadow-primary/20 active:scale-95"
        >
          <Filter size={16} />
          تطبيق وإظهار النتائج
        </button>
      </div>
    </form>
  );
}

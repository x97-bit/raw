import { Search } from "lucide-react";
import { getAccountAccentLineStyle } from "../specialAccountsTheme";

export default function SpecialAccountsFiltersBar({
  account,
  batchOptions = [],
  filters,
  onFieldChange,
  onApply,
  onReset,
}) {
  const accentLineStyle = getAccountAccentLineStyle(account);
  const hasBatchFilter = account?.id === "haider";
  const gridClassName = hasBatchFilter
    ? "surface-card relative grid gap-4 overflow-hidden p-4 lg:grid-cols-[180px_180px_180px_minmax(0,1fr)_auto_auto]"
    : "surface-card relative grid gap-4 overflow-hidden p-4 lg:grid-cols-[180px_180px_minmax(0,1fr)_auto_auto]";

  return (
    <div className={gridClassName}>
      <div
        className="pointer-events-none absolute inset-x-5 top-0 h-px opacity-70"
        style={accentLineStyle}
      />

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-muted-foreground">
          من تاريخ
        </label>
        <input
          type="date"
          value={filters.from}
          onChange={event => onFieldChange("from", event.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-muted-foreground">
          إلى تاريخ
        </label>
        <input
          type="date"
          value={filters.to}
          onChange={event => onFieldChange("to", event.target.value)}
          className="input-field"
        />
      </div>

      {hasBatchFilter && (
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-muted-foreground">
            الوجبة
          </label>
          <select
            value={filters.batchName}
            onChange={event => onFieldChange("batchName", event.target.value)}
            className="input-field"
          >
            <option value="">كل الوجبات</option>
            {batchOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-muted-foreground">
          بحث داخل النتائج
        </label>
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: account.accent }}
          />
          <input
            value={filters.search}
            onChange={event => onFieldChange("search", event.target.value)}
            className="input-field pr-9"
            placeholder="ابحث بالتاريخ، الملاحظات، أو الحقول الظاهرة..."
          />
        </div>
      </div>

      <button
        onClick={onApply}
        className="btn-primary h-[48px] self-end"
        style={{
          background: account.accent,
          color: "#ffffff",
        }}
      >
        عرض
      </button>

      <button onClick={onReset} className="btn-outline h-[48px] self-end">
        مسح
      </button>
    </div>
  );
}

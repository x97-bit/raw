import { Search } from 'lucide-react';

export default function SpecialAccountsFiltersBar({
  filters,
  onFieldChange,
  onApply,
  onReset,
}) {
  return (
    <div className="surface-card grid gap-4 p-4 lg:grid-cols-[180px_180px_minmax(0,1fr)_auto_auto]">
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
        <label className="mb-1.5 block text-sm font-medium text-gray-700">بحث داخل النتائج</label>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={(event) => onFieldChange('search', event.target.value)}
            className="input-field pr-9"
            placeholder="ابحث بالتاريخ، الملاحظات، أو الحقول الظاهرة..."
          />
        </div>
      </div>
      <button onClick={onApply} className="btn-primary h-[44px] self-end">
        عرض
      </button>
      <button onClick={onReset} className="btn-outline h-[44px] self-end">
        مسح
      </button>
    </div>
  );
}

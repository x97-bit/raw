import { Search } from 'lucide-react';

export default function SpecialAccountsFiltersBar({
  account,
  filters,
  onFieldChange,
  onApply,
  onReset,
}) {
  const panelStyle = {
    boxShadow: `0 18px 34px rgba(0,0,0,0.2), inset 0 0 0 1px ${account.accent}14`,
  };

  const primaryButtonStyle = {
    background: `linear-gradient(135deg, ${account.accent}22 0%, rgba(17,22,29,0.98) 100%)`,
    border: `1px solid ${account.accent}33`,
    boxShadow: '0 14px 28px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05)',
  };

  const secondaryButtonStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.18)',
  };

  const inputStyle = {
    borderColor: `${account.accent}18`,
  };

  return (
    <div className="surface-card relative grid gap-4 overflow-hidden p-4 lg:grid-cols-[180px_180px_minmax(0,1fr)_auto_auto]" style={panelStyle}>
      <div
        className="pointer-events-none absolute inset-x-5 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${account.accent} 50%, transparent 100%)` }}
      />

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[#c5d1db]">من تاريخ</label>
        <input
          type="date"
          value={filters.from}
          onChange={(event) => onFieldChange('from', event.target.value)}
          className="input-field"
          style={inputStyle}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[#c5d1db]">إلى تاريخ</label>
        <input
          type="date"
          value={filters.to}
          onChange={(event) => onFieldChange('to', event.target.value)}
          className="input-field"
          style={inputStyle}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[#c5d1db]">بحث داخل النتائج</label>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: account.accent }} />
          <input
            value={filters.search}
            onChange={(event) => onFieldChange('search', event.target.value)}
            className="input-field pr-9"
            style={inputStyle}
            placeholder="ابحث بالتاريخ، الملاحظات، أو الحقول الظاهرة..."
          />
        </div>
      </div>
      <button
        onClick={onApply}
        className="h-[48px] self-end rounded-2xl px-5 text-sm font-semibold text-[#eef3f7] transition-all duration-200 hover:-translate-y-0.5"
        style={primaryButtonStyle}
      >
        عرض
      </button>
      <button
        onClick={onReset}
        className="h-[48px] self-end rounded-2xl px-5 text-sm font-semibold text-[#d9e2ea] transition-all duration-200 hover:-translate-y-0.5 hover:text-white"
        style={secondaryButtonStyle}
      >
        مسح
      </button>
    </div>
  );
}

import { Search } from 'lucide-react';
import {
  getAccountAccentLineStyle,
  getAccountCardOutlineStyle,
  getAccountInputStyle,
  getAccountPrimaryButtonStyle,
  getAccountSecondaryButtonStyle,
} from '../specialAccountsTheme';

export default function SpecialAccountsFiltersBar({
  account,
  filters,
  onFieldChange,
  onApply,
  onReset,
}) {
  const panelStyle = getAccountCardOutlineStyle(account);
  const accentLineStyle = getAccountAccentLineStyle(account);
  const primaryButtonStyle = getAccountPrimaryButtonStyle(account);
  const secondaryButtonStyle = getAccountSecondaryButtonStyle(account);
  const inputStyle = getAccountInputStyle(account);

  return (
    <div className="surface-card relative grid gap-4 overflow-hidden p-4 lg:grid-cols-[180px_180px_minmax(0,1fr)_auto_auto]" style={panelStyle}>
      <div
        className="pointer-events-none absolute inset-x-5 top-0 h-px"
        style={accentLineStyle}
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

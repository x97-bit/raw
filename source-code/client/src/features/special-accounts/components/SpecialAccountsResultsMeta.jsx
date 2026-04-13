import {
  getAccountCardOutlineStyle,
  getAccountMetaBadgeStyle,
} from '../specialAccountsTheme';

export default function SpecialAccountsResultsMeta({
  account,
  filteredCount,
  totalCount,
  search,
}) {
  const panelStyle = getAccountCardOutlineStyle(account, '10');
  const badgeStyle = getAccountMetaBadgeStyle(account);

  return (
    <div
      className="surface-card flex flex-wrap items-center gap-4 px-5 py-3.5"
      style={panelStyle}
    >
      <span className="text-sm text-[#91a0ad]">النتائج المعروضة:</span>
      <span className="font-black" style={{ color: account.accent }}>{filteredCount}</span>
      <span className="text-xs text-[#7f8b97]">من أصل {totalCount}</span>
      {search && (
        <span
          className="mr-auto rounded-full px-3 py-1 text-xs font-semibold text-[#eef3f7]"
          style={badgeStyle}
        >
          البحث: {search}
        </span>
      )}
    </div>
  );
}

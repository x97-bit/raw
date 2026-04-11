export default function SpecialAccountsResultsMeta({
  account,
  filteredCount,
  totalCount,
  search,
}) {
  return (
    <div
      className="surface-card flex flex-wrap items-center gap-4 px-5 py-3.5"
      style={{ boxShadow: `0 16px 30px rgba(0,0,0,0.18), inset 0 0 0 1px ${account.accent}10` }}
    >
      <span className="text-sm text-[#91a0ad]">النتائج المعروضة:</span>
      <span className="font-black" style={{ color: account.accent }}>{filteredCount}</span>
      <span className="text-xs text-[#7f8b97]">من أصل {totalCount}</span>
      {search && (
        <span
          className="mr-auto rounded-full px-3 py-1 text-xs font-semibold text-[#eef3f7]"
          style={{
            background: `linear-gradient(135deg, ${account.accentSoft} 0%, rgba(255,255,255,0.04) 100%)`,
            border: `1px solid ${account.accent}26`,
          }}
        >
          البحث: {search}
        </span>
      )}
    </div>
  );
}

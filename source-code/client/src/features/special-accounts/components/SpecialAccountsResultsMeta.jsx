export default function SpecialAccountsResultsMeta({
  filteredCount,
  totalCount,
  search,
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/85 px-5 py-3.5 shadow-sm">
      <span className="text-sm text-gray-500">النتائج المعروضة:</span>
      <span className="font-bold text-primary-900">{filteredCount}</span>
      <span className="text-xs text-gray-400">من أصل {totalCount}</span>
      {search && (
        <span className="mr-auto rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
          البحث: {search}
        </span>
      )}
    </div>
  );
}

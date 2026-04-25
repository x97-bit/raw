export default function SpecialAccountsResultsMeta({
  account,
  filteredCount,
  totalCount,
  search,
}) {
  return (
    <div className="surface-card flex flex-wrap items-center gap-4 rounded-xl border border-border px-5 py-3.5 shadow-sm">
      <span className="text-sm text-muted-foreground">النتائج المعروضة:</span>
      <span className="font-black" style={{ color: account.accent }}>
        {filteredCount}
      </span>
      <span className="text-xs text-muted-foreground/80">
        من أصل {totalCount}
      </span>
      {search && (
        <span
          className="mr-auto rounded-full bg-secondary/50 px-3 py-1 text-xs font-semibold text-current"
          style={{
            color: account.accent,
          }}
        >
          البحث: {search}
        </span>
      )}
    </div>
  );
}

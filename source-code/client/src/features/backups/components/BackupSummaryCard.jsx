export default function BackupSummaryCard({
  title,
  value,
  hint,
  icon: Icon,
  accent = "#648ea9",
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-right">
          <div className="text-xs font-bold tracking-wide text-[#91a0ad]">
            {title}
          </div>
          <div className="mt-2 text-[1.75rem] font-black tracking-tight text-white">
            {value}
          </div>
          <div className="mt-2 text-sm text-[#b7c3ce]">{hint}</div>
        </div>
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px]"
          style={{
            background: `${accent}22`,
            color: accent,
            boxShadow: `inset 0 1px 0 ${accent}22`,
          }}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

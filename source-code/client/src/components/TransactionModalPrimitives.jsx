export function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200/85 bg-white/92 p-4 md:p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      {(title || subtitle) && (
        <div className="mb-4 border-b border-slate-100 pb-3">
          {title && <h3 className="text-[14px] font-black tracking-tight text-slate-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-[11.5px] leading-6 text-slate-500">{subtitle}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function DetailTile({ label, value, badge = false, type, bold = false, color }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/85 p-3.5 transition-all duration-200 hover:border-slate-300 hover:bg-white">
      <span className="mb-1 block text-[11px] font-semibold tracking-wide text-slate-400">{label}</span>
      {badge ? (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
          type === 2
            ? 'bg-emerald-100 text-emerald-700'
            : type === 3
              ? 'bg-amber-100 text-amber-700'
              : 'bg-blue-100 text-blue-700'
        }`}>
          {value}
        </span>
      ) : (
        <p className={`break-words font-semibold ${bold ? 'text-base' : 'text-sm'} ${color || 'text-slate-800'}`}>{value}</p>
      )}
    </div>
  );
}

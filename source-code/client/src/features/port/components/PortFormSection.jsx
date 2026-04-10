export default function PortFormSection({ title, subtitle, children }) {
  return (
    <section className="rounded-[1.35rem] bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_32px_rgba(0,0,0,0.16)] ring-1 ring-white/[0.05] md:p-5">
      <div className="mb-4 border-b border-white/[0.06] pb-3">
        <h3 className="text-sm font-bold text-[#eef3f7]">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-[#91a0ad]">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

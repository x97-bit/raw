export default function PortFormSection({ title, subtitle, children }) {
  return (
    <section className="rounded-[1.35rem] bg-utility-soft-bg p-4 shadow-sm border border-utility-soft-border md:p-5">
      <div className="mb-4 border-b border-utility-soft-border pb-3">
        <h3 className="text-sm font-bold text-utility-strong">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-utility-muted">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

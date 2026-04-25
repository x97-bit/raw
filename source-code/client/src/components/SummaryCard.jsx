export default function SummaryCard({
  label,
  value,
  tone = "text-utility-strong",
  className = "text-center",
}) {
  return (
    <div className={`stat-card-modern rounded-[24px] ${className}`}>
      <span className="text-[11px] font-semibold tracking-[0.04em] text-utility-muted">
        {label}
      </span>
      <p className={`mt-2 text-[1.85rem] font-black tracking-tight ${tone}`}>
        {value}
      </p>
    </div>
  );
}

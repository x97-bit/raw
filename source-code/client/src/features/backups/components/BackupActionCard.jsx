export default function BackupActionCard({
  title,
  description,
  icon: Icon,
  accentBgClass,
  accentTextClass,
  onClick,
  disabled = false,
}) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      disabled={disabled}
      className="surface-card surface-card-hover flex min-h-[140px] flex-col items-start justify-between p-4 text-right disabled:opacity-60"
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-[18px] ${accentBgClass} ${accentTextClass}`}
      >
        <Icon size={18} />
      </div>
      <div>
        <div className="text-base font-black text-white">{title}</div>
        <div className="mt-1 text-sm leading-6 text-[#91a0ad]">
          {description}
        </div>
      </div>
    </Component>
  );
}

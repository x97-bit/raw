export default function PortIconBadge({
  lines = [],
  accent = '#648ea9',
  background = 'rgba(255,255,255,0.06)',
  textColor,
  borderColor,
  className = '',
}) {
  if (!Array.isArray(lines) || lines.length === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-[8px] border text-center font-black leading-none tracking-normal ${className}`}
      style={{
        background,
        color: textColor || accent,
        borderColor: borderColor || `${accent}30`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 18px ${accent}14`,
      }}
    >
      <span className="max-w-full whitespace-nowrap leading-none">
        {lines.map((line) => (
          <span key={line} className="block">{line}</span>
        ))}
      </span>
    </span>
  );
}

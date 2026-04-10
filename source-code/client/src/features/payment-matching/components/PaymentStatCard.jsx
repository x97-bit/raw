export default function PaymentStatCard({ label, value, sub, variant = 'default' }) {
  const variants = {
    default: 'border-gray-100',
    success: 'border-emerald-100 bg-emerald-50/30',
    warning: 'border-amber-100 bg-amber-50/30',
    danger: 'border-red-100 bg-red-50/30',
    info: 'border-orange-100 bg-orange-50/30',
  };

  const textColors = {
    default: 'text-primary-900',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-red-700',
    info: 'text-orange-700',
  };

  return (
    <div className={`stat-card-modern border text-center ${variants[variant]}`}>
      <div className="mb-2 text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${textColors[variant]}`}>{value}</div>
      {sub && <div className="mt-1.5 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

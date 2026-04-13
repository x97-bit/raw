import { ChevronLeft } from 'lucide-react';
import PortIconBadge from '../../../components/PortIconBadge';

export default function MainDashboardCard({ item, onClick, index }) {
  const Icon = item.icon;
  const hasIconLabel = Array.isArray(item.iconLines) && item.iconLines.length > 0;

  return (
    <button
      onClick={onClick}
      className="surface-card surface-card-hover group w-full rounded-[22px] px-4 py-4 text-right"
      style={{
        animation: 'cardIn 0.34s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${index * 40}ms`,
      }}
    >
      <div
        className="mb-3 h-[3px] rounded-full opacity-80 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${item.accent} 100%)` }}
      />

      <div className="flex items-start justify-between gap-3">
        {hasIconLabel ? (
          <PortIconBadge
            lines={item.iconLines}
            accent={item.accent}
            background={item.bg}
            className="h-11 min-w-[5.5rem] px-3 text-[9px]"
          />
        ) : (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px]"
            style={{
              background: item.bg,
              color: item.accent,
              boxShadow: `0 10px 24px ${item.accent}14`,
            }}
          >
            <Icon size={21} strokeWidth={1.85} />
          </div>
        )}

        <ChevronLeft
          size={16}
          className="mt-1 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
          style={{ color: `${item.accent}bb` }}
        />
      </div>

      <div className="mt-4 text-right">
        <h3 className="text-[14px] font-black tracking-tight text-[#edf2f7]">{item.label}</h3>
        <p className="mt-1 text-[11px] font-medium text-[#8f9daa]">فتح القسم</p>
      </div>
    </button>
  );
}

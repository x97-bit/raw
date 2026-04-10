import { Calendar, Scale } from 'lucide-react';
import { formatTrialBalanceNumber } from '../trialBalanceConfig';

export default function TrialBalanceSummaryGrid({
  totals,
  summaryCards,
  hasPeriodFilter,
  filters,
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {summaryCards.map((card) => (
          <div key={card.label} className="stat-card-modern px-2 py-3 text-center">
            <div className="text-xs text-[#91a0ad]">{card.label}</div>
            <div className={`mt-1 text-xl font-bold ${card.valueClassName}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {hasPeriodFilter && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.05] px-3 py-1.5 font-medium text-[#dbe7f0] ring-1 ring-white/[0.08]">
            <Calendar size={14} className="text-[#9ab6ca]" />
            الفترة: {filters.from || 'البداية'} {'\u2192'} {filters.to || 'الآن'}
          </span>

          {(totals?.opening_usd || 0) !== 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.05] px-3 py-1.5 font-medium text-[#c8d4df] ring-1 ring-white/[0.08]">
              <Scale size={14} className="text-[#c8d4df]" />
              رصيد افتتاحي: ${formatTrialBalanceNumber(Math.round(totals?.opening_usd || 0))}
            </span>
          )}
        </div>
      )}
    </>
  );
}

import { DollarSign, Receipt } from 'lucide-react';
import { formatExpenseNumber } from '../expensesConfig';

const ACTIVE_CARD_CLASS = 'bg-[linear-gradient(180deg,rgba(24,31,40,0.98)_0%,rgba(31,41,52,0.98)_100%)] ring-1 ring-[#648ea9]/28 shadow-[0_22px_44px_rgba(0,0,0,0.28)]';
const IDLE_CARD_CLASS = 'hover:shadow-[0_18px_36px_rgba(0,0,0,0.24)]';

export default function ExpensesOverviewCards({ totals, summaryRows, filterPort, onTogglePort }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div
        className={`stat-card-modern cursor-pointer transition-all duration-200 ${!filterPort ? ACTIVE_CARD_CLASS : IDLE_CARD_CLASS}`}
        onClick={() => onTogglePort('')}
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/6 text-[#9ab6ca]">
            <Receipt size={20} />
          </div>
          <h3 className="font-bold text-[#eef3f7]">إجمالي المصاريف</h3>
        </div>
        <p className="text-xl font-bold text-[#9ab6ca]">${formatExpenseNumber(totals.totalUSD || 0)}</p>
        {(totals.totalIQD || 0) !== 0 && <p className="mt-1 text-sm text-[#c8d4df]">{formatExpenseNumber(totals.totalIQD)} د.ع</p>}
        <p className="mt-1.5 text-xs text-[#91a0ad]">{totals.count || 0} مصروف</p>
      </div>

      {summaryRows.map((summary) => (
        <div
          key={summary.portId}
          className={`stat-card-modern cursor-pointer transition-all duration-200 ${filterPort === summary.portId ? ACTIVE_CARD_CLASS : IDLE_CARD_CLASS}`}
          onClick={() => onTogglePort(filterPort === summary.portId ? '' : summary.portId)}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/6 text-[#c8d4df]">
              <DollarSign size={20} />
            </div>
            <h3 className="font-bold text-[#eef3f7]">{summary.label}</h3>
          </div>
          <p className="text-xl font-bold text-[#c8d4df]">${formatExpenseNumber(summary.totalUSD)}</p>
          {summary.totalIQD !== 0 && <p className="mt-1 text-sm text-[#a9b8c6]">{formatExpenseNumber(summary.totalIQD)} د.ع</p>}
          <p className="mt-1.5 text-xs text-[#91a0ad]">{summary.count} مصروف</p>
        </div>
      ))}
    </div>
  );
}

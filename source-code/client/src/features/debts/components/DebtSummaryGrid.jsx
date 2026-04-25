import { DollarSign } from "lucide-react";
import { getDebtorConfig } from "../../../utils/debtsConfig";
import { formatDebtNumber } from "../debtsPageHelpers";

const ACTIVE_CARD_CLASS =
  "bg-[linear-gradient(180deg,rgba(24,31,40,0.98)_0%,rgba(31,41,52,0.98)_100%)] ring-1 ring-[#648ea9]/28 shadow-[0_22px_44px_rgba(0,0,0,0.28)]";
const IDLE_CARD_CLASS = "hover:shadow-[0_18px_36px_rgba(0,0,0,0.24)]";

export default function DebtSummaryGrid({
  summaryRows,
  activeAccountName,
  onToggleAccount,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryRows.map(row => {
        const config = getDebtorConfig(row.AccountName);
        const isActive = activeAccountName === row.AccountName;

        return (
          <button
            key={row.AccountName}
            type="button"
            className={`stat-card-modern text-right transition-all duration-200 ${isActive ? ACTIVE_CARD_CLASS : IDLE_CARD_CLASS}`}
            onClick={() => onToggleAccount(row.AccountName, isActive)}
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/6 text-[#c697a1]">
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="font-bold text-[#eef3f7]">{row.AccountName}</h3>
                {config && (
                  <span className="text-xs text-[#91a0ad]">{config.label}</span>
                )}
              </div>
            </div>
            <p className="text-xl font-bold text-[#c697a1]">
              ${formatDebtNumber(row.remainingUSD)}
            </p>
            {row.remainingIQD !== 0 && (
              <p className="mt-1 text-sm text-[#d1b58b]">
                {formatDebtNumber(row.remainingIQD)} د.ع
              </p>
            )}
            <p className="mt-1.5 text-xs text-[#91a0ad]">{row.count} حركة</p>
          </button>
        );
      })}
    </div>
  );
}

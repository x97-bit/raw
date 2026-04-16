import { Building2, Receipt, TrendingUp, Users } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import PortIconBadge from '../../../components/PortIconBadge';
import { REPORT_PORTS, REPORT_SPECIAL_ACCOUNTS } from '../../../utils/reportsConfig';

const REPORT_ACTIONS = [
  {
    key: 'add-trader',
    label: 'إضافة تاجر',
    icon: Users,
    iconClassName: 'bg-[#9ab6ca]/12 text-[#d8e4ee]',
  },
  {
    key: 'expenses',
    label: 'المصاريف',
    icon: Receipt,
    iconClassName: 'bg-[#c8d4df]/10 text-[#dbe5ed]',
  },
  {
    key: 'profits',
    label: 'الأرباح',
    icon: TrendingUp,
    iconClassName: 'bg-[#8eb8ad]/12 text-[#b9d4cc]',
  },
];

const SPECIAL_ACCOUNT_ACTIONS = [
  {
    key: 'profits',
    label: 'الأرباح',
    icon: TrendingUp,
    iconClassName: 'bg-[#8eb8ad]/12 text-[#b9d4cc]',
  },
];

const ACTION_BUTTON_CLASS = `
  group flex items-center justify-between gap-3 rounded-[22px] bg-white/[0.05] px-4 py-3.5
  text-sm font-semibold text-[#eef3f7] shadow-[0_14px_28px_rgba(0,0,0,0.16)]
  ring-1 ring-white/[0.06] transition-all duration-200 hover:-translate-y-0.5
  hover:bg-white/[0.08] hover:shadow-[0_18px_32px_rgba(0,0,0,0.2)]
`;

export default function ReportsLandingView({ onBack, onOpenAction, onOpenSpecialAction }) {
  return (
    <div className="page-shell">
      <PageHeader title="التقارير" subtitle="الصفحة الرئيسية" onBack={onBack} />

      <div className="p-5">
        <div className="mx-auto max-w-4xl space-y-4">
          {REPORT_PORTS.map((port) => (
            <div key={port.id} className="surface-card overflow-hidden p-0">
              <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.04] px-5 py-4">
                <PortIconBadge
                  lines={port.iconLines}
                  background="rgba(255,255,255,0.06)"
                  textColor="#eef3f7"
                  borderColor="rgba(255,255,255,0.08)"
                  className="h-10 min-w-[5.5rem] px-3 text-[9px]"
                />
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-[#eef3f7]">{port.name}</h3>
                  <p className="mt-1 text-xs font-medium text-[#91a0ad]">إجراءات التقارير الخاصة بالمنفذ</p>
                </div>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-3">
                {REPORT_ACTIONS.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.key}
                      onClick={() => onOpenAction(port.id, action.key)}
                      className={ACTION_BUTTON_CLASS}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${action.iconClassName}`}>
                          <Icon size={17} />
                        </span>
                        <span>{action.label}</span>
                      </div>

                      <span className="text-xs font-bold tracking-[0.16em] text-[#778391] transition-colors duration-200 group-hover:text-[#c9d5df]">
                        GO
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {REPORT_SPECIAL_ACCOUNTS.map((account) => (
            <div key={account.id} className="surface-card overflow-hidden p-0">
              <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.04] px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#648ea9]/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <Building2 size={18} className="text-[#648ea9]" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-[#eef3f7]">{account.name}</h3>
                  <p className="mt-1 text-xs font-medium text-[#91a0ad]">تقارير الحسابات الخاصة</p>
                </div>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-3">
                {SPECIAL_ACCOUNT_ACTIONS.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.key}
                      onClick={() => onOpenSpecialAction(account.id, action.key)}
                      className={ACTION_BUTTON_CLASS}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${action.iconClassName}`}>
                          <Icon size={17} />
                        </span>
                        <span>{action.label}</span>
                      </div>

                      <span className="text-xs font-bold tracking-[0.16em] text-[#778391] transition-colors duration-200 group-hover:text-[#c9d5df]">
                        GO
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

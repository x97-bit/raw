import { Building2, Receipt, TrendingUp, Users, Trash2, Pen } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import PortIconBadge from "../../../components/PortIconBadge";
import {
  REPORT_PORTS,
  REPORT_SPECIAL_ACCOUNTS,
} from "../../../utils/reportsConfig";

const REPORT_ACTIONS = [
  {
    key: "add-trader",
    label: "إضافة حساب",
    icon: Users,
    iconClassName: "bg-utility-accent-bg text-utility-accent-text",
  },
  {
    key: "edit-trader",
    label: "تعديل حساب",
    icon: Pen,
    iconClassName: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  },
  {
    key: "delete-trader",
    label: "حذف حساب",
    icon: Trash2,
    iconClassName: "bg-red-50 text-red-600",
  },
  {
    key: "expenses",
    label: "المصاريف",
    icon: Receipt,
    iconClassName: "bg-utility-soft-bg text-utility-strong",
  },
  {
    key: "profits",
    label: "الأرباح",
    icon: TrendingUp,
    iconClassName: "bg-utility-success-bg text-utility-success-text",
  },
];

const SPECIAL_ACCOUNT_ACTIONS = [
  {
    key: "profits",
    label: "الأرباح",
    icon: TrendingUp,
    iconClassName: "bg-utility-success-bg text-utility-success-text",
  },
];

const ACTION_BUTTON_CLASS = `
  group flex items-center justify-between gap-3 rounded-[22px] bg-utility-soft-bg px-4 py-3.5
  text-sm font-semibold text-utility-strong shadow-sm
  ring-1 ring-utility-soft-border transition-all duration-200 hover:-translate-y-0.5
  hover:bg-utility-soft-bg-hover
`;

export default function ReportsLandingView({
  onBack,
  onOpenAction,
  onOpenSpecialAction,
}) {
  return (
    <div className="page-shell">
      <PageHeader title="التقارير" subtitle="الصفحة الرئيسية" onBack={onBack} />

      <div className="p-5">
        <div className="mx-auto max-w-4xl space-y-4">
          {REPORT_PORTS.map(port => (
            <div key={port.id} className="surface-card overflow-hidden p-0">
              <div className="flex items-center gap-3 border-b border-utility-soft-border bg-utility-soft-bg px-5 py-4">
                <PortIconBadge
                  lines={port.iconLines}
                  background="var(--utility-soft-bg)"
                  textColor="var(--utility-strong)"
                  borderColor="var(--utility-soft-border)"
                  className="h-10 min-w-[5.5rem] px-3 text-[9px]"
                />
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-utility-strong">
                    {port.name}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-utility-muted">
                    إجراءات التقارير الخاصة بالمنفذ
                  </p>
                </div>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-3">
                {REPORT_ACTIONS.map(action => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.key}
                      onClick={() => onOpenAction(port.id, action.key)}
                      className={ACTION_BUTTON_CLASS}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${action.iconClassName}`}
                        >
                          <Icon size={17} />
                        </span>
                        <span>{action.label}</span>
                      </div>

                      <span className="text-xs font-bold tracking-[0.16em] text-utility-muted transition-colors duration-200 group-hover:text-utility-strong">
                        GO
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {REPORT_SPECIAL_ACCOUNTS.map(account => (
            <div key={account.id} className="surface-card overflow-hidden p-0">
              <div className="flex items-center gap-3 border-b border-utility-soft-border bg-utility-soft-bg px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-utility-accent-bg shadow-sm">
                  <Building2 size={18} className="text-utility-accent-text" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-utility-strong">
                    {account.name}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-utility-muted">
                    تقارير الحسابات الخاصة
                  </p>
                </div>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-3">
                {SPECIAL_ACCOUNT_ACTIONS.map(action => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.key}
                      onClick={() =>
                        onOpenSpecialAction(account.id, action.key)
                      }
                      className={ACTION_BUTTON_CLASS}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${action.iconClassName}`}
                        >
                          <Icon size={17} />
                        </span>
                        <span>{action.label}</span>
                      </div>

                      <span className="text-xs font-bold tracking-[0.16em] text-utility-muted transition-colors duration-200 group-hover:text-utility-strong">
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

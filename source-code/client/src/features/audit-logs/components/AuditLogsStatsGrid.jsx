import { Database, Plus, Pencil, Trash2 } from "lucide-react";

const CARDS = [
  {
    key: "total",
    label: "إجمالي السجلات",
    icon: Database,
    accent: "from-slate-700 to-slate-900",
    iconBg: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
    valueColor: "text-panel-text",
  },
  {
    key: "creates",
    label: "إضافات",
    icon: Plus,
    accent: "from-emerald-600 to-emerald-700",
    iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    valueColor: "text-emerald-400",
  },
  {
    key: "updates",
    label: "تعديلات",
    icon: Pencil,
    accent: "from-amber-500 to-amber-600",
    iconBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    valueColor: "text-amber-400",
  },
  {
    key: "deletes",
    label: "عمليات حذف",
    icon: Trash2,
    accent: "from-rose-600 to-rose-700",
    iconBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    valueColor: "text-rose-400",
  },
];

export default function AuditLogsStatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, iconBg, valueColor }) => (
        <div
          key={key}
          className="flex items-center gap-4 rounded-2xl border border-panel-border bg-panel p-5 shadow-lg transition-transform hover:scale-[1.02]"
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
          >
            <Icon size={22} />
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm font-semibold text-panel-muted">{label}</p>
            <p
              className={`mt-0.5 text-2xl font-bold tracking-tight ${valueColor}`}
            >
              {(stats[key] ?? 0).toLocaleString("en-US")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

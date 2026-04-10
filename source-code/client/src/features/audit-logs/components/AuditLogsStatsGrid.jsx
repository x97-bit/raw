import SummaryCard from '../../../components/SummaryCard';

export default function AuditLogsStatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <SummaryCard label="إجمالي السجلات" value={stats.total} tone="text-primary-900" />
      <SummaryCard label="إضافات" value={stats.creates} tone="text-emerald-600" />
      <SummaryCard label="تعديلات" value={stats.updates} tone="text-amber-600" />
      <SummaryCard label="حذف" value={stats.deletes} tone="text-red-600" />
    </div>
  );
}

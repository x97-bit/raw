import EmptyTableRow from '../../../components/EmptyTableRow';
import {
  getAuditActionBadgeClass,
  getAuditActionLabel,
  getAuditEntityLabel,
} from '../auditLogsConfig';
import { formatAuditDateTime } from '../auditLogsHelpers';

export default function AuditLogsTable({ rows, onSelectLog }) {
  return (
    <div className="surface-card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
              <th className="px-4 py-3 font-semibold">الوقت</th>
              <th className="px-4 py-3 font-semibold">المستخدم</th>
              <th className="px-4 py-3 font-semibold">الكيان</th>
              <th className="px-4 py-3 font-semibold">المعرف</th>
              <th className="px-4 py-3 font-semibold">العملية</th>
              <th className="px-4 py-3 font-semibold">الملخص</th>
              <th className="w-28 px-4 py-3 font-semibold">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyTableRow
                colSpan={7}
                className="py-16 text-center text-slate-400"
                message="لا توجد سجلات مطابقة."
              />
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                  <td className="px-4 py-3 text-slate-600">{formatAuditDateTime(row.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{row.username || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{getAuditEntityLabel(row.entityType)}</td>
                  <td className="px-4 py-3 text-slate-600">{row.entityId ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getAuditActionBadgeClass(row.action)}`}>
                      {getAuditActionLabel(row.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.summary}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onSelectLog(row)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      عرض
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import {
  parseAuditField,
  getAuditFieldLabel,
  formatAuditValue,
} from "../auditLogsHelpers";

function DataTable({ data }) {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return <p className="text-xs text-slate-400">لا توجد بيانات</p>;
  }

  return (
    <table className="w-full text-sm">
      <tbody>
        {Object.entries(data).map(([key, value]) => (
          <tr key={key} className="border-b border-slate-100 last:border-0">
            <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-600">
              {getAuditFieldLabel(key)}
            </td>
            <td className="px-3 py-2 text-slate-800">
              {formatAuditValue(value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChangesTable({ data }) {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return <p className="text-xs text-slate-400">لا توجد تغييرات</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-100/60 text-right">
          <th className="px-3 py-2 font-semibold text-slate-600">الحقل</th>
          <th className="px-3 py-2 font-semibold text-red-600">قبل</th>
          <th className="px-3 py-2 font-semibold text-emerald-600">بعد</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(data).map(([key, change]) => {
          const beforeVal = change?.before ?? change;
          const afterVal = change?.after ?? change;
          const isBeforeAfter =
            change &&
            typeof change === "object" &&
            ("before" in change || "after" in change);

          return (
            <tr key={key} className="border-b border-slate-100 last:border-0">
              <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-600">
                {getAuditFieldLabel(key)}
              </td>
              {isBeforeAfter ? (
                <>
                  <td className="px-3 py-2 text-red-700 line-through decoration-red-300">
                    {formatAuditValue(beforeVal)}
                  </td>
                  <td className="px-3 py-2 font-medium text-emerald-700">
                    {formatAuditValue(afterVal)}
                  </td>
                </>
              ) : (
                <td colSpan={2} className="px-3 py-2 text-slate-800">
                  {formatAuditValue(change)}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function AuditLogDetailCard({ title, value, variant }) {
  const parsed = parseAuditField(value);
  if (
    !parsed ||
    (typeof parsed === "object" && Object.keys(parsed).length === 0)
  ) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <h4 className="mb-3 text-sm font-bold text-slate-700">{title}</h4>
      <div className="overflow-x-auto">
        {variant === "changes" ? (
          <ChangesTable data={parsed} />
        ) : (
          <DataTable data={parsed} />
        )}
      </div>
    </div>
  );
}

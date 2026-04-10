import { parseAuditField } from '../auditLogsHelpers';

export default function AuditLogDetailCard({ title, value }) {
  const parsed = parseAuditField(value);
  if (!parsed || (typeof parsed === 'object' && Object.keys(parsed).length === 0)) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <h4 className="mb-2 text-sm font-bold text-slate-700">{title}</h4>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-600">
        {typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)}
      </pre>
    </div>
  );
}

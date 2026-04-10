import { FileClock } from 'lucide-react';
import ModalPortal from '../../../components/ModalPortal';
import AuditLogDetailCard from './AuditLogDetailCard';

export default function AuditLogDetailModal({ log, onClose }) {
  if (!log) {
    return null;
  }

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      >
        <div className="w-full max-w-5xl rounded-t-2xl bg-white shadow-[0_10px_45px_rgba(15,23,42,0.18)] sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              إغلاق
            </button>
            <div className="flex items-center gap-2 text-right">
              <FileClock size={18} className="text-primary-700" />
              <div>
                <h2 className="text-lg font-bold text-primary-900">تفاصيل العملية</h2>
                <p className="mt-1 text-xs text-slate-400">{log.summary}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <AuditLogDetailCard title="قبل التعديل" value={log.beforeData} />
            <AuditLogDetailCard title="بعد التعديل" value={log.afterData} />
            <AuditLogDetailCard title="الحقول المتغيرة" value={log.changes} />
            <AuditLogDetailCard title="بيانات إضافية" value={log.metadata} />
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

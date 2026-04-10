import { Pencil, Trash2 } from 'lucide-react';
import DebtModalShell from './DebtModalShell';

export default function DebtPreviewModal({
  debt,
  previewItems,
  canManageDebts,
  deleting,
  onClose,
  onEdit,
  onDelete,
}) {
  if (!debt) {
    return null;
  }

  return (
    <DebtModalShell
      title="معاينة الدين"
      subtitle="نموذج إدخال موحد يدعم الأنواع المختلفة من الديون."
      onClose={onClose}
    >
      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {previewItems.map((item) => (
            <div key={item.key} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <span className="mb-2 block text-xs font-semibold text-slate-400">{item.label}</span>
              <p className="text-sm font-bold text-slate-800">{item.value || '-'}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={onClose} className="btn-outline w-full sm:w-auto">
            إغلاق
          </button>
          {canManageDebts && (
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                onClick={onEdit}
                className="btn-outline flex w-full items-center justify-center gap-2 sm:w-auto"
              >
                <Pencil size={16} /> تعديل
              </button>
              <button
                onClick={onDelete}
                disabled={deleting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60 sm:w-auto"
              >
                <Trash2 size={16} /> {deleting ? 'جارٍ الحذف...' : 'حذف'}
              </button>
            </div>
          )}
        </div>
      </div>
    </DebtModalShell>
  );
}

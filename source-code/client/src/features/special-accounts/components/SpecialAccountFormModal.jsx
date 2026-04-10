import { Save, X } from 'lucide-react';
import ModalPortal from '../../../components/ModalPortal';
import SpecialAccountFormField from './SpecialAccountFormField';

export default function SpecialAccountFormModal({
  activeLabel,
  editingRecord,
  formFields,
  form,
  saving,
  onClose,
  onSave,
  onFormChange,
}) {
  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-3 sm:p-4"
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      >
        <div
          className="my-auto max-h-[calc(100vh-1.5rem)] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-[0_10px_45px_rgba(15,23,42,0.18)] sm:max-h-[calc(100vh-2rem)]"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
            <div className="text-right">
              <h2 className="text-lg font-bold text-primary-900">
                {editingRecord ? 'تعديل سجل' : 'إضافة سجل جديد'}
              </h2>
              <p className="mt-1 text-xs text-slate-400">{activeLabel}</p>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {formFields.map((field) => (
                <SpecialAccountFormField key={field.key} field={field} value={form[field.key]} onChange={onFormChange} />
              ))}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button onClick={onClose} className="btn-outline w-full sm:w-auto">
                إلغاء
              </button>
              <button onClick={onSave} disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 sm:w-auto">
                <Save size={16} />
                {saving
                  ? 'جارٍ الحفظ...'
                  : editingRecord
                    ? 'حفظ التعديلات'
                    : 'حفظ السجل'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

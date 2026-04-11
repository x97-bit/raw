import { Save, X } from 'lucide-react';
import ModalPortal from '../../../components/ModalPortal';
import SpecialAccountFormField from './SpecialAccountFormField';

export default function SpecialAccountFormModal({
  account,
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
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/65 p-3 sm:p-4"
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      >
        <div
          className="relative my-auto max-h-[calc(100vh-1.5rem)] w-full max-w-5xl overflow-y-auto rounded-[30px] bg-[#11161d] text-[#edf2f7] shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:max-h-[calc(100vh-2rem)]"
          onMouseDown={(event) => event.stopPropagation()}
          style={{ border: `1px solid ${account.accent}1c` }}
        >
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent 0%, ${account.accent} 50%, transparent 100%)` }}
          />
          <div
            className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${account.accentSoft} 0%, transparent 72%)` }}
          />

          <div className="relative flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#aebbc7] transition-all duration-200 hover:-translate-y-0.5 hover:text-white"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <X size={18} />
            </button>
            <div className="text-right">
              <h2 className="text-lg font-black text-[#f4f8fb]">
                {editingRecord ? 'تعديل سجل' : 'إضافة سجل جديد'}
              </h2>
              <p className="mt-1 text-xs font-semibold" style={{ color: account.accent }}>
                {activeLabel}
              </p>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {formFields.map((field) => (
                <SpecialAccountFormField
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  onChange={onFormChange}
                  accent={account.accent}
                />
              ))}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={onClose}
                className="w-full rounded-2xl px-5 py-3 text-sm font-semibold text-[#d9e2ea] transition-all duration-200 hover:-translate-y-0.5 hover:text-white sm:w-auto"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                إلغاء
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-[#eef3f7] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto"
                style={{
                  background: `linear-gradient(135deg, ${account.accent}26 0%, rgba(17,22,29,0.98) 100%)`,
                  border: `1px solid ${account.accent}33`,
                  boxShadow: '0 16px 30px rgba(0,0,0,0.24)',
                }}
              >
                <Save size={16} />
                {saving ? 'جارٍ الحفظ...' : editingRecord ? 'حفظ التعديلات' : 'حفظ السجل'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

import { Plus } from 'lucide-react';
import AutocompleteInput from '../../../components/AutocompleteInput';
import DebtFormField from './DebtFormField';
import DebtModalShell from './DebtModalShell';

export default function DebtFormModal({
  editingDebt,
  accountText,
  accountOptions,
  form,
  formFields,
  saving,
  onClose,
  onSave,
  onFormChange,
  onAccountTextChange,
  onAccountSelect,
  onAddAccountName,
}) {
  return (
    <DebtModalShell
      title={editingDebt ? 'تعديل دين' : 'إضافة دين جديد'}
      subtitle="نموذج إدخال موحد يدعم الأنواع المختلفة من الديون."
      widthClass="w-[min(72rem,calc(100vw-1.5rem))]"
      onClose={onClose}
    >
      <div className="space-y-5 p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">اسم الحساب</label>
          <AutocompleteInput
            value={accountText}
            options={accountOptions}
            labelKey="name"
            valueKey="id"
            dropdownSide="top"
            onChange={onAccountTextChange}
            onSelect={onAccountSelect}
            onAddNew={onAddAccountName}
            addNewLabel="إضافة اسم جديد"
            placeholder="ابدأ بكتابة اسم الحساب..."
            className="input-field"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {formFields.map((field) => (
            <DebtFormField key={field.key} field={field} value={form[field.key]} onChange={onFormChange} />
          ))}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={onClose} className="btn-outline w-full sm:w-auto">
            إغلاق
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="btn-primary flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            <Plus size={16} />
            {saving
              ? 'جارٍ الحفظ...'
              : editingDebt
                ? 'حفظ التعديلات'
                : 'حفظ الدين'}
          </button>
        </div>
      </div>
    </DebtModalShell>
  );
}

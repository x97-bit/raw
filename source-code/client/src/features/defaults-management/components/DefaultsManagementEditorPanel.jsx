import { RefreshCw, Save } from 'lucide-react';
import DefaultsFormField from './DefaultsFormField';

export default function DefaultsManagementEditorPanel({
  formTitle,
  formSubtitle,
  activeForm,
  setActiveForm,
  activeFieldDefs,
  lookups,
  onReset,
  onSave,
  loadingLookups,
  loadingDefaults,
  saving,
  saveLabel,
}) {
  return (
    <section className="surface-card space-y-5 p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="text-right">
          <h2 className="text-sm font-bold text-slate-800">{formTitle}</h2>
          <p className="mt-1 text-xs text-slate-400">{formSubtitle}</p>
        </div>
        <button onClick={onReset} className="btn-outline flex items-center gap-2 text-xs">
          <RefreshCw size={14} />
          {'إعادة ضبط'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {activeFieldDefs.map((definition) => (
          <DefaultsFormField
            key={definition.formId}
            definition={definition}
            form={activeForm}
            setForm={setActiveForm}
            lookups={lookups}
          />
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <button onClick={onReset} className="btn-outline">
          {'إلغاء'}
        </button>
        <button
          onClick={onSave}
          disabled={saving || loadingLookups || loadingDefaults}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={15} />
          {saving ? 'جارٍ الحفظ...' : saveLabel}
        </button>
      </div>
    </section>
  );
}

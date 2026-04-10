import { Save } from 'lucide-react';
import { SectionCard } from './TransactionModalPrimitives';

export default function TransactionEditSections({
  orderedEditSections,
  renderOrderedEditItem,
  saving,
  onCancel,
  onSave,
}) {
  return (
    <div className="p-5 md:p-6">
      <div className="space-y-5">
        {orderedEditSections.map((section) => {
          const gridClass = section.items.length <= 2
            ? 'grid-cols-1 md:grid-cols-2'
            : section.items.length === 3
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4';

          return (
            <SectionCard
              key={section.title}
              title={section.title}
              subtitle={section.subtitle || 'ترتيب الحقول مطابق لإدارة الحقول'}
            >
              <div className={`grid gap-4 ${gridClass}`}>
                {section.items.map((item) => renderOrderedEditItem(item))}
              </div>
            </SectionCard>
          );
        })}

        <div className="rounded-[1.5rem] border border-slate-200/85 bg-slate-50/90 p-4 md:p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={onCancel} className="btn-outline w-full sm:w-auto">إلغاء</button>
            <button onClick={onSave} disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 sm:w-auto">
              <Save size={15} /> {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

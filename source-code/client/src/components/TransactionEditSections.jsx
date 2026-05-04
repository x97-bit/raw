import { Save } from "lucide-react";
import { SectionCard } from "./TransactionModalPrimitives";

export default function TransactionEditSections({
  orderedEditSections,
  renderOrderedEditItem,
  saving,
  onCancel,
  onSave,
}) {
  return (
    <div className="p-5 md:p-6 lg:px-8">
      <div className="space-y-5">
        {orderedEditSections.map(section => {
          const gridClass =
            section.items.length <= 2
              ? "grid-cols-1 md:grid-cols-2"
              : section.items.length === 3
                ? "grid-cols-1 md:grid-cols-3"
                : section.items.length <= 6
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

          return (
            <SectionCard
              key={section.title}
              title={section.title}
              subtitle={section.subtitle || "ترتيب الحقول مطابق لإدارة الحقول"}
            >
              <div className={`grid gap-4 ${gridClass}`}>
                {section.items.map(item => renderOrderedEditItem(item))}
              </div>
            </SectionCard>
          );
        })}

        <div className="sticky bottom-0 z-10 -mx-5 -mb-5 border-t border-slate-200/85 bg-slate-50/95 px-5 py-4 backdrop-blur-sm md:-mx-6 md:-mb-6 md:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={onCancel} className="btn-outline w-full sm:w-auto">
              إلغاء
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="btn-primary flex w-full items-center justify-center gap-2 px-8 sm:w-auto"
            >
              <Save size={15} /> {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

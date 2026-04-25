import { Plus, Save, X } from "lucide-react";
import { FIELD_TYPES, OPERATORS } from "../../../utils/fieldManagementConfig";

export default function FieldCustomFieldForm({
  showAddForm,
  onShow,
  onHide,
  newField,
  setNewField,
  availableTargets,
  selectedTargets,
  onToggleTarget,
  compatibleSections,
  onToggleSection,
  onSelectAllSections,
  getAvailableFormulaFields,
  onAddFormulaPart,
  onRemoveFormulaPart,
  onUpdateFormulaPart,
  getFormulaPreview,
  saving,
  onSave,
}) {
  if (!showAddForm) {
    return (
      <button
        onClick={onShow}
        className="w-full bg-white/[0.03] border-2 border-dashed border-white/[0.1] text-[#7bd3eb] py-4 rounded-xl font-bold hover:bg-white/[0.06] hover:border-[#7bd3eb]/[0.4] transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        إضافة حقل مخصص جديد
      </button>
    );
  }

  const hasMultipleTargets = availableTargets.length > 1;
  const isFormula = newField.fieldType === "formula";
  const hasFormulaPreview = newField.formulaParts.some(
    part => part.type === "field" && part.value
  );
  const compatibleSectionCount = compatibleSections.length;

  return (
    <div className="surface-card rounded-xl shadow-sm border border-white/[0.06] overflow-hidden p-0">
      <div className="px-4 py-3 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="font-bold text-[#eef3f7]">إضافة حقل مخصص جديد</h3>
        <button
          onClick={onHide}
          className="text-[#91a0ad] hover:text-[#dce8f2]"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#c8d4df] mb-1">
            اسم الحقل *
          </label>
          <input
            type="text"
            value={newField.label}
            onChange={e =>
              setNewField(prev => ({ ...prev, label: e.target.value }))
            }
            placeholder="مثال: رقم المعاملة"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#c8d4df] mb-1">
            نوع الحقل
          </label>
          <select
            value={newField.fieldType}
            onChange={e =>
              setNewField(prev => ({ ...prev, fieldType: e.target.value }))
            }
            className="input-field bg-transparent"
          >
            {FIELD_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {hasMultipleTargets && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-[#c8d4df]">
                الشاشات المستهدفة
              </label>
              <span className="text-xs text-[#91a0ad]">
                يمكن تحديد أكثر من شاشة عند الحاجة
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTargets.map(target => (
                <button
                  key={target.key}
                  type="button"
                  onClick={() => onToggleTarget(target.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedTargets.includes(target.key)
                      ? "bg-[#15467c] text-white shadow-sm"
                      : "bg-white/[0.04] text-[#91a0ad] hover:bg-white/[0.08]"
                  }`}
                >
                  {target.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {newField.fieldType === "select" && (
          <div>
            <label className="block text-sm font-medium text-[#c8d4df] mb-1">
              الخيارات (مفصولة بفواصل)
            </label>
            <input
              type="text"
              value={newField.options}
              onChange={e =>
                setNewField(prev => ({ ...prev, options: e.target.value }))
              }
              placeholder="خيار 1, خيار 2, خيار 3"
              className="input-field"
            />
          </div>
        )}

        {isFormula && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#c8d4df]">
              المعادلة الحسابية
            </label>
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
              <div className="space-y-3">
                {newField.formulaParts.map((part, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {part.type === "operator" ? (
                      <div className="flex items-center gap-1 mx-auto">
                        {OPERATORS.map(operator => (
                          <button
                            key={operator.value}
                            type="button"
                            onClick={() =>
                              onUpdateFormulaPart(index, operator.value)
                            }
                            className={`w-10 h-10 rounded-lg text-lg font-bold transition-all ${
                              part.value === operator.value
                                ? "bg-[#7bd3eb] text-[#0f2744] shadow-md scale-110"
                                : "bg-white/[0.06] text-[#c8d4df] border border-white/[0.1] hover:bg-white/[0.1]"
                            }`}
                            title={operator.title}
                          >
                            {operator.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-8 h-8 rounded-full bg-white/[0.08] text-[#eef3f7] flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {Math.floor(index / 2) + 1}
                        </div>
                        <select
                          value={part.value}
                          onChange={e =>
                            onUpdateFormulaPart(index, e.target.value)
                          }
                          className="input-field bg-transparent"
                        >
                          <option value="">اختر حقلاً...</option>
                          {getAvailableFormulaFields().map(field => (
                            <option key={field.key} value={field.key}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                        {newField.formulaParts.filter(
                          formulaPart => formulaPart.type === "field"
                        ).length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemoveFormulaPart(index)}
                            className="p-1.5 text-[#e2bcc2] hover:text-[#ff9ba8] hover:bg-white/[0.06] rounded-lg transition-colors flex-shrink-0"
                            title="حذف"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={onAddFormulaPart}
                className="mt-3 w-full border-2 border-dashed border-white/[0.1] text-[#7bd3eb] py-2 rounded-lg text-sm font-medium hover:bg-white/[0.04] hover:border-white/[0.2] transition-all flex items-center justify-center gap-1"
              >
                <Plus size={16} />
                إضافة حقل آخر
              </button>

              {hasFormulaPreview && (
                <div className="mt-3 p-3 surface-card rounded-lg border border-white/[0.06]">
                  <div className="text-xs text-[#91a0ad] mb-1">
                    معاينة المعادلة:
                  </div>
                  <div
                    className="text-sm font-bold text-[#eef3f7] text-center"
                    dir="ltr"
                  >
                    {getFormulaPreview()}
                  </div>
                </div>
              )}
            </div>

            {newField.sections.length === 0 && (
              <p className="text-xs text-[#d6b36b] bg-[#d6b36b]/[0.1] p-2 rounded-lg border border-[#d6b36b]/[0.2]">
                إذا لم تحدد أقسامًا إضافية فسيُطبق الحقل على القسم الحالي فقط.
              </p>
            )}
          </div>
        )}

        {!isFormula && (
          <div>
            <label className="block text-sm font-medium text-[#c8d4df] mb-1">
              القيمة الافتراضية (اختياري)
            </label>
            <input
              type="text"
              value={newField.defaultValue}
              onChange={e =>
                setNewField(prev => ({ ...prev, defaultValue: e.target.value }))
              }
              className="input-field"
            />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-[#c8d4df]">
              الأقسام التي يظهر فيها هذا الحقل
            </label>
            <button
              onClick={onSelectAllSections}
              className="text-xs text-[#7bd3eb] hover:text-white"
            >
              {newField.sections.length === compatibleSectionCount
                ? "إلغاء الكل"
                : "تحديد الكل"}
            </button>
          </div>
          {hasMultipleTargets && selectedTargets.length > 1 && (
            <p className="mb-2 text-xs text-[#91a0ad]">
              سيظهر هذا الحقل في الأقسام المتوافقة مع الشاشات المحددة.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {compatibleSections.map(section => (
              <button
                key={section.key}
                onClick={() => onToggleSection(section.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  newField.sections.includes(section.key)
                    ? "bg-[#15467c] text-white"
                    : "bg-white/[0.04] text-[#91a0ad] hover:bg-white/[0.08]"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onSave}
          disabled={saving || !newField.label.trim()}
          className="w-full btn-primary py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? "جارٍ الحفظ..." : "إضافة الحقل"}
        </button>
      </div>
    </div>
  );
}

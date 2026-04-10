import { Plus, Save, X } from 'lucide-react';
import { FIELD_TYPES, OPERATORS } from '../../../utils/fieldManagementConfig';

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
        className="w-full bg-white border-2 border-dashed border-primary-300 text-primary-600 py-4 rounded-xl font-bold hover:bg-primary-50 hover:border-primary-400 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        إضافة حقل مخصص جديد
      </button>
    );
  }

  const hasMultipleTargets = availableTargets.length > 1;
  const isFormula = newField.fieldType === 'formula';
  const hasFormulaPreview = newField.formulaParts.some((part) => part.type === 'field' && part.value);
  const compatibleSectionCount = compatibleSections.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
        <h3 className="font-bold text-primary-800">إضافة حقل مخصص جديد</h3>
        <button onClick={onHide} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم الحقل *</label>
          <input
            type="text"
            value={newField.label}
            onChange={(e) => setNewField((prev) => ({ ...prev, label: e.target.value }))}
            placeholder="مثال: رقم المعاملة"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نوع الحقل</label>
          <select
            value={newField.fieldType}
            onChange={(e) => setNewField((prev) => ({ ...prev, fieldType: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {FIELD_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {hasMultipleTargets && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-700">الشاشات المستهدفة</label>
              <span className="text-xs text-slate-500">يمكن تحديد أكثر من شاشة عند الحاجة</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTargets.map((target) => (
                <button
                  key={target.key}
                  type="button"
                  onClick={() => onToggleTarget(target.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedTargets.includes(target.key)
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {target.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {newField.fieldType === 'select' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الخيارات (مفصولة بفواصل)</label>
            <input
              type="text"
              value={newField.options}
              onChange={(e) => setNewField((prev) => ({ ...prev, options: e.target.value }))}
              placeholder="خيار 1, خيار 2, خيار 3"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        )}

        {isFormula && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">المعادلة الحسابية</label>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="space-y-3">
                {newField.formulaParts.map((part, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {part.type === 'operator' ? (
                      <div className="flex items-center gap-1 mx-auto">
                        {OPERATORS.map((operator) => (
                          <button
                            key={operator.value}
                            type="button"
                            onClick={() => onUpdateFormulaPart(index, operator.value)}
                            className={`w-10 h-10 rounded-lg text-lg font-bold transition-all ${
                              part.value === operator.value
                                ? 'bg-primary-600 text-white shadow-md scale-110'
                                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                            }`}
                            title={operator.title}
                          >
                            {operator.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {Math.floor(index / 2) + 1}
                        </div>
                        <select
                          value={part.value}
                          onChange={(e) => onUpdateFormulaPart(index, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                        >
                          <option value="">اختر حقلاً...</option>
                          {getAvailableFormulaFields().map((field) => (
                            <option key={field.key} value={field.key}>{field.label}</option>
                          ))}
                        </select>
                        {newField.formulaParts.filter((formulaPart) => formulaPart.type === 'field').length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemoveFormulaPart(index)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
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
                className="mt-3 w-full border-2 border-dashed border-blue-300 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 hover:border-blue-400 transition-all flex items-center justify-center gap-1"
              >
                <Plus size={16} />
                إضافة حقل آخر
              </button>

              {hasFormulaPreview && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                  <div className="text-xs text-gray-500 mb-1">معاينة المعادلة:</div>
                  <div className="text-sm font-bold text-primary-800 text-center" dir="ltr">
                    {getFormulaPreview()}
                  </div>
                </div>
              )}
            </div>

            {newField.sections.length === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                إذا لم تحدد أقسامًا إضافية فسيُطبق الحقل على القسم الحالي فقط.
              </p>
            )}
          </div>
        )}

        {!isFormula && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القيمة الافتراضية (اختياري)</label>
            <input
              type="text"
              value={newField.defaultValue}
              onChange={(e) => setNewField((prev) => ({ ...prev, defaultValue: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">الأقسام التي يظهر فيها هذا الحقل</label>
            <button onClick={onSelectAllSections} className="text-xs text-primary-600 hover:text-primary-800">
              {newField.sections.length === compatibleSectionCount ? 'إلغاء الكل' : 'تحديد الكل'}
            </button>
          </div>
          {hasMultipleTargets && selectedTargets.length > 1 && (
            <p className="mb-2 text-xs text-slate-500">سيظهر هذا الحقل في الأقسام المتوافقة مع الشاشات المحددة.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {compatibleSections.map((section) => (
              <button
                key={section.key}
                onClick={() => onToggleSection(section.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  newField.sections.includes(section.key)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? 'جارٍ الحفظ...' : 'إضافة الحقل'}
        </button>
      </div>
    </div>
  );
}

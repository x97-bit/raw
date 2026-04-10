import { Check, Pencil, Plus, PlusCircle, Trash2, X } from 'lucide-react';
import { FIELD_TYPES, OPERATORS } from '../../../utils/fieldManagementConfig';

export default function FieldCustomFieldsList({
  currentConfigLabel,
  currentCustomFields,
  editingFieldId,
  editingLabel,
  onEditingLabelChange,
  editingFormula,
  editingAvailableTargets,
  editingCurrentTargets,
  onToggleEditingTarget,
  currentTargetLabel,
  editingCompatibleSections,
  editingSections,
  onSelectAllEditingSections,
  onToggleEditingSection,
  onUpdateEditFormulaPart,
  getEditFormulaFields,
  onRemoveEditFormulaPart,
  onAddEditFormulaPart,
  getEditFormulaPreview,
  onSaveEditField,
  onCancelEditField,
  onStartEditField,
  onDeleteCustomField,
  resolveFormulaTokenLabel,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-bold text-gray-700">الحقول المخصصة - {currentConfigLabel}</h3>
      </div>

      {currentCustomFields.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <PlusCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد حقول مخصصة لهذا القسم بعد</p>
          <p className="text-xs mt-1">ابدأ بإضافة حقل جديد من النموذج أعلاه.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {currentCustomFields.map((field) => (
            <div key={field.id} className="px-4 py-3">
              {editingFieldId === field.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">اسم الحقل</label>
                    <input
                      type="text"
                      value={editingLabel}
                      onChange={(event) => onEditingLabelChange(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !editingFormula) onSaveEditField(field.id);
                        if (event.key === 'Escape') onCancelEditField();
                      }}
                      autoFocus
                      className="w-full border border-primary-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {editingAvailableTargets.length > 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <label className="block text-xs font-medium text-gray-500">الشاشات المستهدفة</label>
                        <span className="text-xs text-slate-500">يمكن اختيار أكثر من شاشة</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {editingAvailableTargets.map((target) => (
                          <button
                            key={target.key}
                            type="button"
                            onClick={() => onToggleEditingTarget(target.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              editingCurrentTargets.includes(target.key)
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {target.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">
                        سيظهر هذا الحقل في الشاشات التالية:{' '}
                        <strong>
                          {editingAvailableTargets
                            .filter((target) => editingCurrentTargets.includes(target.key))
                            .map((target) => target.label)
                            .join('، ') || currentTargetLabel}
                        </strong>
                        .
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="block text-xs font-medium text-gray-500">الأقسام التي يظهر فيها هذا الحقل</label>
                      <button
                        type="button"
                        onClick={onSelectAllEditingSections}
                        className="text-xs text-primary-600 hover:text-primary-800"
                      >
                        {editingSections.length === editingCompatibleSections.length ? 'إلغاء الكل' : 'تحديد الكل'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editingCompatibleSections.map((section) => (
                        <button
                          key={section.key}
                          type="button"
                          onClick={() => onToggleEditingSection(section.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            editingSections.includes(section.key)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {section.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editingFormula && (
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-gray-500">المعادلة الحسابية</label>
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                        <div className="space-y-3">
                          {editingFormula.formulaParts.map((part, index) => (
                            <div key={index} className="flex items-center gap-2">
                              {part.type === 'operator' ? (
                                <div className="flex items-center gap-1 mx-auto">
                                  {OPERATORS.map((operator) => (
                                    <button
                                      key={operator.value}
                                      type="button"
                                      onClick={() => onUpdateEditFormulaPart(index, operator.value)}
                                      className={`w-10 h-10 rounded-lg text-lg font-bold transition-all ${
                                        part.value === operator.value
                                          ? 'bg-purple-600 text-white shadow-md scale-110'
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
                                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {Math.floor(index / 2) + 1}
                                  </div>
                                  <select
                                    value={part.value}
                                    onChange={(event) => onUpdateEditFormulaPart(index, event.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                  >
                                    <option value="">اختر حقلاً...</option>
                                    {getEditFormulaFields().map((formulaField) => (
                                      <option key={formulaField.key} value={formulaField.key}>{formulaField.label}</option>
                                    ))}
                                  </select>
                                  {editingFormula.formulaParts.filter((formulaPart) => formulaPart.type === 'field').length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => onRemoveEditFormulaPart(index)}
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
                          onClick={onAddEditFormulaPart}
                          className="mt-3 w-full border-2 border-dashed border-purple-300 text-purple-600 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 hover:border-purple-400 transition-all flex items-center justify-center gap-1"
                        >
                          <Plus size={16} />
                          إضافة حقل آخر
                        </button>

                        {editingFormula.formulaParts.some((part) => part.type === 'field' && part.value) && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                            <div className="text-xs text-gray-500 mb-1">معاينة المعادلة:</div>
                            <div className="text-sm font-bold text-purple-800 text-center" dir="ltr">
                              {getEditFormulaPreview()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onSaveEditField(field.id)}
                      className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Check size={16} />
                      حفظ التعديلات
                    </button>
                    <button
                      onClick={onCancelEditField}
                      className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <X size={16} />
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800">{field.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded ${field.fieldType === 'formula' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {FIELD_TYPES.find((type) => type.value === field.fieldType)?.label || field.fieldType}
                      </span>
                      <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded">
                        {field.fieldKey}
                      </span>
                      {field.fieldType === 'formula' && field.formula?.parts && (
                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded" dir="ltr">
                          {field.formula.parts.map((part) => {
                            if (part.type === 'operator') {
                              const operator = OPERATORS.find((op) => op.value === part.value);
                              return ` ${operator?.label || part.value} `;
                            }
                            return resolveFormulaTokenLabel(part.value);
                          }).join('')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onStartEditField(field)}
                      className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={field.fieldType === 'formula' ? 'تعديل المعادلة' : 'تعديل الحقل'}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteCustomField(field.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

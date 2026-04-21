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
    <div className="surface-card rounded-xl shadow-sm border border-white/[0.06] overflow-hidden p-0">
      <div className="px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
        <h3 className="font-bold text-[#eef3f7]">الحقول المخصصة - {currentConfigLabel}</h3>
      </div>

      {currentCustomFields.length === 0 ? (
        <div className="p-8 text-center text-[#91a0ad]">
          <PlusCircle size={40} className="mx-auto mb-3 opacity-30 text-[#64727f]" />
          <p>لا توجد حقول مخصصة لهذا القسم بعد</p>
          <p className="text-xs mt-1">ابدأ بإضافة حقل جديد من النموذج أعلاه.</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {currentCustomFields.map((field) => (
            <div key={field.id} className="px-4 py-3">
              {editingFieldId === field.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#c8d4df] mb-1">اسم الحقل</label>
                    <input
                      type="text"
                      value={editingLabel}
                      onChange={(event) => onEditingLabelChange(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !editingFormula) onSaveEditField(field.id);
                        if (event.key === 'Escape') onCancelEditField();
                      }}
                      autoFocus
                      className="input-field"
                    />
                  </div>

                  {editingAvailableTargets.length > 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <label className="block text-xs font-medium text-[#c8d4df]">الشاشات المستهدفة</label>
                        <span className="text-xs text-[#91a0ad]">يمكن اختيار أكثر من شاشة</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {editingAvailableTargets.map((target) => (
                          <button
                            key={target.key}
                            type="button"
                            onClick={() => onToggleEditingTarget(target.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              editingCurrentTargets.includes(target.key)
                                ? 'bg-[#15467c] text-white shadow-sm'
                                : 'bg-white/[0.04] text-[#91a0ad] hover:bg-white/[0.08]'
                            }`}
                          >
                            {target.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-[#91a0ad]">
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
                      <label className="block text-xs font-medium text-[#c8d4df]">الأقسام التي يظهر فيها هذا الحقل</label>
                      <button
                        type="button"
                        onClick={onSelectAllEditingSections}
                        className="text-xs text-[#7bd3eb] hover:text-white"
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
                              ? 'bg-[#15467c] text-white'
                              : 'bg-white/[0.04] text-[#91a0ad] hover:bg-white/[0.08]'
                          }`}
                        >
                          {section.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editingFormula && (
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-[#c8d4df]">المعادلة الحسابية</label>
                      <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
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
                                          ? 'bg-[#7bd3eb] text-[#0f2744] shadow-md scale-110'
                                          : 'bg-white/[0.06] text-[#c8d4df] border border-white/[0.1] hover:bg-white/[0.1]'
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
                                    onChange={(event) => onUpdateEditFormulaPart(index, event.target.value)}
                                    className="input-field bg-transparent"
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
                          onClick={onAddEditFormulaPart}
                          className="mt-3 w-full border-2 border-dashed border-white/[0.1] text-[#7bd3eb] py-2 rounded-lg text-sm font-medium hover:bg-white/[0.04] hover:border-white/[0.2] transition-all flex items-center justify-center gap-1"
                        >
                          <Plus size={16} />
                          إضافة حقل آخر
                        </button>

                        {editingFormula.formulaParts.some((part) => part.type === 'field' && part.value) && (
                          <div className="mt-3 p-3 surface-card rounded-lg border border-white/[0.06]">
                            <div className="text-xs text-[#91a0ad] mb-1">معاينة المعادلة:</div>
                            <div className="text-sm font-bold text-[#eef3f7] text-center" dir="ltr">
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
                      className="flex-1 bg-[#8eb8ad]/[0.18] text-[#dceee8] py-2.5 rounded-lg border border-[#8eb8ad]/[0.2] hover:bg-[#8eb8ad]/[0.26] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Check size={16} />
                      حفظ التعديلات
                    </button>
                    <button
                      onClick={onCancelEditField}
                      className="flex-1 bg-white/[0.06] text-[#c8d4df] py-2.5 rounded-lg border border-white/[0.04] hover:bg-white/[0.1] hover:text-[#eef3f7] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <X size={16} />
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#eef3f7]">{field.label}</div>
                    <div className="text-xs text-[#91a0ad] mt-0.5 flex flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded ${field.fieldType === 'formula' ? 'bg-[#d6b36b]/[0.16] text-[#f6e7c2]' : 'bg-[#7bd3eb]/[0.16] text-[#ccebf5]'}`}>
                        {FIELD_TYPES.find((type) => type.value === field.fieldType)?.label || field.fieldType}
                      </span>
                      <span className="bg-white/[0.06] text-[#c8d4df] px-2 py-0.5 rounded">
                        {field.fieldKey}
                      </span>
                      {field.fieldType === 'formula' && field.formula?.parts && (
                        <span className="bg-white/[0.04] text-[#dce8f2] px-2 py-0.5 rounded" dir="ltr">
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
                      className="p-2 text-[#7bd3eb] hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                      title={field.fieldType === 'formula' ? 'تعديل المعادلة' : 'تعديل الحقل'}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteCustomField(field.id)}
                      className="p-2 text-[#e2bcc2] hover:text-[#ff9ba8] hover:bg-[#b76169]/[0.1] rounded-lg transition-colors"
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

import { Check, Eye, EyeOff, GripVertical, Pencil, Save, X } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { normalizeFieldLabel } from '../../../utils/fieldConfigMetadata';

export default function FieldVisibilityList({
  loading,
  currentConfigLabel,
  visibleCount,
  fieldConfigs,
  dragIndex,
  dragOverIndex,
  touchDragIndex,
  editingDisplayLabelKey,
  editingDisplayLabelValue,
  saving,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDragEnd,
  onDragLeave,
  onStartDisplayLabelEdit,
  onEditingDisplayLabelValueChange,
  onSaveDisplayLabelEdit,
  onCancelDisplayLabelEdit,
  onResetDisplayLabelValue,
  onMoveTouchItem,
  onToggleVisibility,
  onSaveConfigs,
}) {
  if (loading) {
    return <LoadingSpinner message="جارٍ تحميل الحقول..." className="py-12" />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-bold text-gray-700">إعدادات الظهور - {currentConfigLabel}</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            عدد الحقول الظاهرة
          </span>
          <span className="text-xs text-gray-400">{visibleCount} من {fieldConfigs.length} حقل</span>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {fieldConfigs.map((field, index) => (
          <div
            key={field.key}
            draggable
            onDragStart={(event) => onDragStart(event, index)}
            onDragEnter={(event) => onDragEnter(event, index)}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragLeave={onDragLeave}
            className={`flex items-center gap-3 px-4 py-3 transition-all cursor-grab active:cursor-grabbing select-none ${
              field.visible ? 'bg-white' : 'bg-gray-50/50'
            } ${dragOverIndex === index ? 'border-t-2 border-primary-500 bg-primary-50/30' : ''} ${
              dragIndex === index ? 'opacity-50' : ''
            } ${touchDragIndex === index ? 'ring-2 ring-primary-400 bg-primary-50/30' : ''}`}
          >
            <div className="flex items-center text-gray-300 hover:text-gray-500 transition-colors cursor-grab active:cursor-grabbing">
              <GripVertical size={18} />
            </div>

            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs flex items-center justify-center font-mono shrink-0">
              {index + 1}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-medium ${field.visible ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                  {normalizeFieldLabel(field.displayLabel, field.baseLabel || field.label)}
                </span>
                {field.isCustom ? (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">مخصص</span>
                ) : (
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">أساسي</span>
                )}
                {editingDisplayLabelKey !== field.key && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onStartDisplayLabelEdit(field);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Pencil size={12} />
                    اسم العرض
                  </button>
                )}
              </div>

              {editingDisplayLabelKey === field.key ? (
                <div className="mt-2 rounded-xl border border-primary-100 bg-primary-50/60 p-3">
                  <label className="mb-2 block text-xs font-medium text-primary-700">
                    اسم العرض في هذه الشاشة
                  </label>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <input
                      type="text"
                      value={editingDisplayLabelValue}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => onEditingDisplayLabelValueChange(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') onSaveDisplayLabelEdit(field);
                        if (event.key === 'Escape') onCancelDisplayLabelEdit();
                      }}
                      placeholder={field.baseLabel || field.label}
                      className="w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSaveDisplayLabelEdit(field);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700"
                      >
                        <Check size={12} />
                        حفظ
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onCancelDisplayLabelEdit();
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <X size={12} />
                        إلغاء
                      </button>
                      {!!field.displayLabel && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onResetDisplayLabelValue();
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
                        >
                          مسح التخصيص
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-xs text-slate-500">
                  {!!field.displayLabel ? 'يوجد اسم عرض مخصص لهذا الحقل.' : 'يُستخدم الاسم الأساسي لهذا الحقل.'}
                </div>
              )}

              {!!field.displayLabel && (
                <p className="mt-1 text-xs text-slate-400">
                  الاسم الأساسي: {field.baseLabel || field.label}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-0.5 sm:hidden">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onMoveTouchItem(index, index - 1);
                }}
                disabled={index === 0}
                className="text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors p-0.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onMoveTouchItem(index, index + 1);
                }}
                disabled={index === fieldConfigs.length - 1}
                className="text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors p-0.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            </div>

            <button
              onClick={(event) => {
                event.stopPropagation();
                onToggleVisibility(field.key);
              }}
              className={`p-2 rounded-lg transition-all ${
                field.visible ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {field.visible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <button
          onClick={onSaveConfigs}
          disabled={saving}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  );
}

import {
  Check,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Save,
  X,
} from "lucide-react";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { normalizeFieldLabel } from "../../../utils/fieldConfigMetadata";

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
    <div className="surface-card rounded-xl shadow-sm border border-white/[0.06] overflow-hidden p-0">
      <div className="px-4 py-3 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="font-bold text-[#eef3f7]">
          إعدادات الظهور - {currentConfigLabel}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#91a0ad] bg-white/[0.04] px-2 py-1 rounded-full">
            عدد الحقول الظاهرة
          </span>
          <span className="text-xs text-[#91a0ad]">
            {visibleCount} من {fieldConfigs.length} حقل
          </span>
        </div>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {fieldConfigs.map((field, index) => (
          <div
            key={field.key}
            draggable
            onDragStart={event => onDragStart(event, index)}
            onDragEnter={event => onDragEnter(event, index)}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragLeave={onDragLeave}
            className={`flex items-center gap-3 px-4 py-3 transition-all cursor-grab active:cursor-grabbing select-none ${
              field.visible
                ? "bg-transparent hover:bg-white/[0.02]"
                : "bg-white/[0.02] opacity-75"
            } ${dragOverIndex === index ? "border-t-2 border-[#7bd3eb] bg-[#7bd3eb]/[0.1]" : ""} ${
              dragIndex === index ? "opacity-50" : ""
            } ${touchDragIndex === index ? "ring-2 ring-[#7bd3eb] bg-[#7bd3eb]/[0.1]" : ""}`}
          >
            <div className="flex items-center text-[#91a0ad] hover:text-[#c8d4df] transition-colors cursor-grab active:cursor-grabbing">
              <GripVertical size={18} />
            </div>

            <span className="w-6 h-6 rounded-full bg-white/[0.06] text-[#c8d4df] text-xs flex items-center justify-center font-mono shrink-0">
              {index + 1}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`font-medium ${field.visible ? "text-[#eef3f7]" : "text-[#91a0ad] line-through"}`}
                >
                  {normalizeFieldLabel(
                    field.displayLabel,
                    field.baseLabel || field.label
                  )}
                </span>
                {field.isCustom ? (
                  <span className="text-xs bg-[#7bd3eb]/[0.16] text-[#dce8f2] border border-[#7bd3eb]/[0.22] px-2 py-0.5 rounded-full">
                    مخصص
                  </span>
                ) : (
                  <span className="text-xs bg-white/[0.06] text-[#91a0ad] px-2 py-0.5 rounded-full">
                    أساسي
                  </span>
                )}
                {editingDisplayLabelKey !== field.key && (
                  <button
                    type="button"
                    onClick={event => {
                      event.stopPropagation();
                      onStartDisplayLabelEdit(field);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] px-2.5 py-1 text-xs font-medium text-[#c8d4df] hover:bg-white/[0.06]"
                  >
                    <Pencil size={12} />
                    اسم العرض
                  </button>
                )}
              </div>

              {editingDisplayLabelKey === field.key ? (
                <div className="mt-2 rounded-xl border border-white/[0.1] bg-white/[0.04] p-3">
                  <label className="mb-2 block text-xs font-medium text-[#dce8f2]">
                    اسم العرض في هذه الشاشة
                  </label>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <input
                      type="text"
                      value={editingDisplayLabelValue}
                      onClick={event => event.stopPropagation()}
                      onChange={event =>
                        onEditingDisplayLabelValueChange(event.target.value)
                      }
                      onKeyDown={event => {
                        if (event.key === "Enter")
                          onSaveDisplayLabelEdit(field);
                        if (event.key === "Escape") onCancelDisplayLabelEdit();
                      }}
                      placeholder={field.baseLabel || field.label}
                      className="input-field w-full"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          onSaveDisplayLabelEdit(field);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#8eb8ad]/[0.18] border border-[#8eb8ad]/[0.2] px-3 py-2 text-xs font-medium text-[#dceee8] hover:bg-[#8eb8ad]/[0.26]"
                      >
                        <Check size={12} />
                        حفظ
                      </button>
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          onCancelDisplayLabelEdit();
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-transparent px-3 py-2 text-xs font-medium text-[#91a0ad] hover:bg-white/[0.06] hover:text-[#eef3f7]"
                      >
                        <X size={12} />
                        إلغاء
                      </button>
                      {!!field.displayLabel && (
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            onResetDisplayLabelValue();
                          }}
                          className="rounded-lg border border-[#e2bcc2]/[0.2] bg-[#b76169]/[0.1] px-3 py-2 text-xs font-medium text-[#e2bcc2] hover:bg-[#b76169]/[0.2]"
                        >
                          مسح التخصيص
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-xs text-[#91a0ad]">
                  {!!field.displayLabel
                    ? "يوجد اسم عرض مخصص لهذا الحقل."
                    : "يُستخدم الاسم الأساسي لهذا الحقل."}
                </div>
              )}

              {!!field.displayLabel && (
                <p className="mt-1 text-xs text-white/[0.3]">
                  الاسم الأساسي: {field.baseLabel || field.label}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-0.5 sm:hidden">
              <button
                onClick={event => {
                  event.stopPropagation();
                  onMoveTouchItem(index, index - 1);
                }}
                disabled={index === 0}
                className="text-[#91a0ad] hover:text-white disabled:opacity-30 transition-colors p-0.5"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
              <button
                onClick={event => {
                  event.stopPropagation();
                  onMoveTouchItem(index, index + 1);
                }}
                disabled={index === fieldConfigs.length - 1}
                className="text-[#91a0ad] hover:text-white disabled:opacity-30 transition-colors p-0.5"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>

            <button
              onClick={event => {
                event.stopPropagation();
                onToggleVisibility(field.key);
              }}
              className={`p-2 rounded-lg transition-all ${
                field.visible
                  ? "bg-[#8eb8ad]/[0.16] text-[#b9d8cf] hover:bg-[#8eb8ad]/[0.22] ring-1 ring-[#8eb8ad]/[0.2]"
                  : "bg-white/[0.04] text-[#64727f] hover:bg-white/[0.1] hover:text-[#91a0ad]"
              }`}
            >
              {field.visible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 bg-white/[0.02] border-t border-white/[0.06]">
        <button
          onClick={onSaveConfigs}
          disabled={saving}
          className="w-full btn-primary py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}

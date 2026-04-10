import { ArrowLeftRight, Copy, Download, Upload } from 'lucide-react';

export default function FieldConfigTransferPanel({
  show,
  onToggle,
  currentConfigLabel,
  currentTargetLabel,
  compatibleTargetSections,
  targetSections,
  saving,
  onSelectAllTargetSections,
  onToggleTargetSection,
  onCopySettingsToSections,
  onImportFromSection,
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={onToggle}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
            show
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <ArrowLeftRight size={16} />
          {'نسخ / استيراد الإعدادات'}
        </button>
      </div>

      {show && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
            <h3 className="font-bold text-amber-800 flex items-center gap-2">
              <ArrowLeftRight size={16} />
              {'نسخ / استيراد إعدادات الحقول'}
            </h3>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Copy size={14} className="text-blue-500" />
                <span>
                  {'نسخ إعدادات '}
                  <strong>{currentConfigLabel}</strong>
                  {' إلى أقسام أخرى:'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onSelectAllTargetSections}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                >
                  {targetSections.length === compatibleTargetSections.length
                    ? 'إلغاء الكل'
                    : 'تحديد الكل'}
                </button>

                {compatibleTargetSections.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => onToggleTargetSection(section.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      targetSections.includes(section.key)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>

              <button
                onClick={onCopySettingsToSections}
                disabled={saving || targetSections.length === 0}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                <Download size={16} />
                {saving
                  ? 'جارٍ النسخ...'
                  : `نسخ الإعدادات إلى ${targetSections.length} أقسام`}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400 font-medium">{'أو'}</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Upload size={14} className="text-green-500" />
                <span>
                  {'استيراد إعدادات من قسم آخر إلى '}
                  <strong>{currentConfigLabel}</strong>
                  {':'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {compatibleTargetSections.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => {
                      if (confirm(`هل تريد استيراد إعدادات "${section.label} - ${currentTargetLabel}" إلى "${currentConfigLabel}"؟ سيتم استبدال الإعدادات الحالية.`)) {
                        onImportFromSection(section.key);
                      }
                    }}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    <Upload size={12} />
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

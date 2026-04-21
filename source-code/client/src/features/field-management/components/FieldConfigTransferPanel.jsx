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
              ? 'bg-[#d6b36b]/[0.16] text-[#f6e7c2] border-[#d6b36b]/[0.22]'
              : 'bg-white/[0.06] text-[#dce8f2] border-white/[0.04] hover:bg-white/[0.1]'
          }`}
        >
          <ArrowLeftRight size={16} />
          {'نسخ / استيراد الإعدادات'}
        </button>
      </div>

      {show && (
        <div className="surface-card rounded-xl shadow-sm border border-white/[0.06] overflow-hidden p-0">
          <div className="px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
            <h3 className="font-bold text-[#eef3f7] flex items-center gap-2">
              <ArrowLeftRight size={16} className="text-[#dce8f2]" />
              {'نسخ / استيراد إعدادات الحقول'}
            </h3>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[#eef3f7]">
                <Copy size={14} className="text-[#7bd3eb]" />
                <span>
                  {'نسخ إعدادات '}
                  <strong>{currentConfigLabel}</strong>
                  {' إلى أقسام أخرى:'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onSelectAllTargetSections}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] text-[#c8d4df] hover:bg-white/[0.1] transition-all"
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
                        ? 'bg-[#15467c] text-white'
                        : 'bg-white/[0.04] text-[#91a0ad] hover:bg-white/[0.08]'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>

              <button
                onClick={onCopySettingsToSections}
                disabled={saving || targetSections.length === 0}
                className="w-full btn-primary py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <Download size={16} />
                {saving
                  ? 'جارٍ النسخ...'
                  : `نسخ الإعدادات إلى ${targetSections.length} أقسام`}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-white/[0.06]" />
              <span className="text-xs text-[#91a0ad] font-medium">{'أو'}</span>
              <div className="flex-1 border-t border-white/[0.06]" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[#eef3f7]">
                <Upload size={14} className="text-[#8eb8ad]" />
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
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#8eb8ad]/[0.1] text-[#b9d8cf] hover:bg-[#8eb8ad]/[0.18] border border-[#8eb8ad]/[0.15] transition-all disabled:opacity-50 flex items-center gap-1"
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

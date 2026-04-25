import { TARGET_SCREEN_META } from "../../../utils/fieldManagementConfig";

const ACTIVE_BUTTON_CLASS =
  "bg-white/10 text-[#eef3f7] shadow-[0_14px_24px_rgba(0,0,0,0.16)] ring-1 ring-white/10";
const IDLE_BUTTON_CLASS =
  "bg-white/6 text-[#91a0ad] hover:bg-white/10 hover:text-[#eef3f7]";
const ACTIVE_TARGET_CLASS =
  "bg-[linear-gradient(180deg,rgba(24,31,40,0.98)_0%,rgba(31,41,52,0.98)_100%)] ring-1 ring-[#648ea9]/28 shadow-[0_18px_34px_rgba(0,0,0,0.24)]";
const IDLE_TARGET_CLASS = "bg-white/6 hover:bg-white/10";

export default function FieldManagementScopeSelector({
  sections,
  selectedSection,
  onSelectSection,
  availableTargets,
  selectedTarget,
  onSelectTarget,
  currentSectionLabel,
  currentTargetLabel,
}) {
  const sectionGroups = sections.reduce((groups, section) => {
    if (!groups[section.group]) groups[section.group] = [];
    groups[section.group].push(section);
    return groups;
  }, {});

  return (
    <div className="surface-card p-5">
      <div className="space-y-5">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-bold text-[#eef3f7]">
              1. اختر القسم
            </label>
            <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-medium text-[#c8d4df]">
              {currentSectionLabel}
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(sectionGroups).map(
              ([groupLabel, groupedSections]) => (
                <div key={groupLabel}>
                  <div className="mb-1.5 px-1 text-xs font-bold text-[#91a0ad]">
                    {groupLabel}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupedSections.map(section => (
                      <button
                        key={section.key}
                        type="button"
                        onClick={() => onSelectSection(section.key)}
                        className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${selectedSection === section.key ? ACTIVE_BUTTON_CLASS : IDLE_BUTTON_CLASS}`}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="border-t border-white/6 pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="text-sm font-bold text-[#eef3f7]">
                2. اختر الشاشة الفرعية
              </label>
              <p className="mt-1 text-xs text-[#91a0ad]">
                لكل شاشة إعدادات مستقلة للإظهار والترتيب واسم العرض.
              </p>
            </div>
            <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-medium text-[#c8d4df]">
              {currentTargetLabel}
            </span>
          </div>

          <div
            className={`grid gap-3 ${availableTargets.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"}`}
          >
            {availableTargets.map(target => {
              const targetMeta =
                TARGET_SCREEN_META[target.key] || TARGET_SCREEN_META.default;
              const TargetIcon = targetMeta.icon;
              const isActive = selectedTarget === target.key;

              return (
                <button
                  key={target.key}
                  type="button"
                  onClick={() => onSelectTarget(target.key)}
                  className={`rounded-[1.35rem] px-4 py-4 text-right transition-all duration-200 ${isActive ? ACTIVE_TARGET_CLASS : IDLE_TARGET_CLASS}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-2xl p-3 ${isActive ? "bg-white/12 text-[#eef3f7]" : "bg-white/8 text-[#91a0ad]"}`}
                    >
                      <TargetIcon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm font-bold ${isActive ? "text-[#eef3f7]" : "text-[#c8d4df]"}`}
                        >
                          {target.label}
                        </span>
                        {isActive && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-[#eef3f7]">
                            نشطة
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#91a0ad]">
                        {targetMeta.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

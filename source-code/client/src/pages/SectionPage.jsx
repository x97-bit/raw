import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { sectionActionConfig, sectionConfig } from '../features/navigation/sectionCatalog';

function hexToRgb(hex) {
  const normalized = String(hex || '').replace('#', '').trim();
  if (normalized.length !== 6) return null;

  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) return null;

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function withAlpha(hex, alpha) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function tintColor(hex, amount) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const tint = (channel) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${tint(rgb.r)}, ${tint(rgb.g)}, ${tint(rgb.b)})`;
}

function ActionCard({ actionDetails, onClick, index, isDark }) {
  const Icon = actionDetails.icon;
  const lightIconBg = tintColor(actionDetails.accent, 0.9);
  const lightCardGlow = tintColor(actionDetails.accent, 0.95);

  return (
    <button
      onClick={onClick}
      className={`surface-card surface-card-hover group relative w-full overflow-hidden rounded-[26px] text-center ${
        isDark ? '' : 'border border-transparent'
      }`}
      style={{
        animation: 'sectionCardIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${index * 70}ms`,
        boxShadow: isDark
          ? undefined
          : `0 18px 36px rgba(53,78,89,0.08), inset 0 0 0 1px ${withAlpha(actionDetails.accent, 0.12)}`,
        background: isDark
          ? undefined
          : `linear-gradient(180deg, #ffffff 0%, ${lightCardGlow} 100%)`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${actionDetails.accent} 50%, transparent 100%)` }}
      />

      <div className="relative flex flex-col items-center gap-4 px-5 py-10">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-[24px] transition-all duration-300 group-hover:scale-105"
          style={{
            background: isDark ? actionDetails.bg : lightIconBg,
            color: actionDetails.accent,
            boxShadow: isDark
              ? `0 10px 26px ${withAlpha(actionDetails.accent, 0.09)}`
              : `0 12px 24px ${withAlpha(actionDetails.accent, 0.14)}, inset 0 1px 0 rgba(255,255,255,0.75)`,
          }}
        >
          <Icon size={28} strokeWidth={1.7} />
        </div>

        <div>
          <span className={`block text-[15px] font-black leading-tight ${isDark ? 'text-[#edf2f7]' : 'text-[#24313c]'}`}>
            {actionDetails.label}
          </span>
          <span className={`mt-1.5 block text-[11.5px] leading-snug ${isDark ? 'text-[#8f9daa]' : 'text-[#667480]'}`}>
            {actionDetails.desc}
          </span>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 right-0 left-0 h-14 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(to top, ${withAlpha(actionDetails.accent, isDark ? 0.06 : 0.12)}, transparent)` }}
      />
    </button>
  );
}

export default function SectionPage({ sectionId, onBack, onAction }) {
  const { hasPerm } = useAuth();
  const { isDark } = useTheme();
  const config = sectionConfig[sectionId];

  if (!config) {
    return null;
  }

  const visibleActions = config.actions
    .map((action) => ({
      action,
      actionDetails: {
        ...sectionActionConfig[action],
        ...(config.actionOverrides?.[action] || {}),
      },
    }))
    .filter(({ actionDetails }) => !actionDetails.perm || hasPerm(actionDetails.perm));

  const sectionSubtitle = config.type === 'transport'
    ? 'اختر إجراء النقل المطلوب، مع إبراز الدفعات المسددة للناقلين أولًا.'
    : 'اختر العملية المطلوبة';

  const sectionDescription = config.type === 'transport'
    ? 'النقل عندكم يمثل ذممًا مستحقة للناقلين، لذلك تظهر الدفعات بصفتها الخطوة الأهم في السداد.'
    : 'نفس الوظائف السابقة، لكن بتخطيط أوضح وأهدأ بصريًا.';

  return (
    <div className="page-shell flex flex-col">
      <PageHeader title={config.title} subtitle={sectionSubtitle} onBack={onBack} accentColor={config.accent} />

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div
          className="w-full max-w-5xl rounded-[32px] p-6 sm:p-7"
          style={{
            background: isDark ? 'rgba(15,20,26,0.78)' : '#ffffff',
            boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.24)' : '0 24px 60px rgba(53,78,89,0.1)',
            border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #d7e1e2',
            backdropFilter: isDark ? 'blur(18px)' : 'none',
            WebkitBackdropFilter: isDark ? 'blur(18px)' : 'none',
          }}
        >
          <div
            className="mb-6 flex flex-wrap items-center justify-between gap-3 pb-4"
            style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8e8' }}
          >
            <div className="text-right">
              <div
                className="inline-flex rounded-full px-3 py-1 text-[11px] font-black"
                style={{
                  background: isDark ? withAlpha(config.accent, 0.16) : tintColor(config.accent, 0.9),
                  color: config.accent,
                }}
              >
                {visibleActions.length} عملية
              </div>
              <h2 className={`mt-3 text-[21px] font-black tracking-tight ${isDark ? 'text-[#f4f8fb]' : 'text-[#24313c]'}`}>
                اختر العملية المطلوبة
              </h2>
              <p className={`mt-1 text-[12.5px] ${isDark ? 'text-[#8f9daa]' : 'text-[#667480]'}`}>{sectionDescription}</p>
            </div>
          </div>

          <div
            className={`grid w-full gap-4 ${
              visibleActions.length === 1
                ? 'max-w-xs grid-cols-1'
                : visibleActions.length === 2
                  ? 'max-w-md grid-cols-2'
                  : visibleActions.length === 3
                    ? 'max-w-3xl grid-cols-3'
                    : 'grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {visibleActions.map(({ action, actionDetails }, index) => (
              <ActionCard
                key={action}
                actionDetails={actionDetails}
                onClick={() => onAction(sectionId, action, config)}
                index={index}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sectionCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

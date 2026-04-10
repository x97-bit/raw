import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { sectionActionConfig, sectionConfig } from '../features/navigation/sectionCatalog';

function ActionCard({ actionDetails, onClick, index }) {
  const Icon = actionDetails.icon;

  return (
    <button
      onClick={onClick}
      className="surface-card surface-card-hover group relative w-full overflow-hidden rounded-[26px] text-center"
      style={{
        animation: 'sectionCardIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${index * 70}ms`,
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
            background: actionDetails.bg,
            color: actionDetails.accent,
            boxShadow: `0 10px 26px ${actionDetails.accent}16`,
          }}
        >
          <Icon size={28} strokeWidth={1.7} />
        </div>

        <div>
          <span className="block text-[15px] font-black leading-tight text-[#edf2f7]">{actionDetails.label}</span>
          <span className="mt-1.5 block text-[11.5px] leading-snug text-[#8f9daa]">{actionDetails.desc}</span>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 right-0 left-0 h-14 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(to top, ${actionDetails.accent}10, transparent)` }}
      />
    </button>
  );
}

export default function SectionPage({ sectionId, onBack, onAction }) {
  const { hasPerm } = useAuth();
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
    : 'نفس الوظائف السابقة، لكن بتخطيط أوضح وأنظف.';

  return (
    <div className="page-shell flex flex-col">
      <PageHeader title={config.title} subtitle={sectionSubtitle} onBack={onBack} accentColor={config.accent} />

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl rounded-[32px] bg-[rgba(15,20,26,0.78)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/6 pb-4">
            <div className="text-right">
              <div
                className="inline-flex rounded-full px-3 py-1 text-[11px] font-black"
                style={{ background: `${config.accent}16`, color: config.accent }}
              >
                {visibleActions.length} عملية
              </div>
              <h2 className="mt-3 text-[21px] font-black tracking-tight text-[#f4f8fb]">اختر العملية المطلوبة</h2>
              <p className="mt-1 text-[12.5px] text-[#8f9daa]">{sectionDescription}</p>
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

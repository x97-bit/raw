import PageHeader from "../components/PageHeader";
import { useAuth } from "../contexts/AuthContext";
import {
  sectionActionConfig,
  sectionConfig,
} from "../features/navigation/sectionCatalog";

function ActionCard({ actionDetails, onClick, index }) {
  const Icon = actionDetails.icon;

  return (
    <button
      onClick={onClick}
      className="card border border-border shadow-sm group relative w-full overflow-hidden rounded-2xl text-center transition-all duration-200 hover:bg-secondary/20 hover:-translate-y-0.5"
      style={{
        animation: "sectionCardIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${actionDetails.accent} 50%, transparent 100%)`,
        }}
      />

      <div className="relative flex flex-col items-center gap-3 px-4 py-7">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105 bg-secondary/30"
          style={{
            color: actionDetails.accent,
          }}
        >
          <Icon size={22} strokeWidth={1.7} />
        </div>

        <div>
          <span className="block text-[12.5px] font-black leading-tight text-foreground">
            {actionDetails.label}
          </span>
          <span className="mt-1 block text-[10px] leading-snug text-muted-foreground">
            {actionDetails.desc}
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 right-0 left-0 h-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-secondary/10" />
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
    .map(action => ({
      action,
      actionDetails: {
        ...sectionActionConfig[action],
        ...(config.actionOverrides?.[action] || {}),
      },
    }))
    .filter(
      ({ actionDetails }) => !actionDetails.perm || hasPerm(actionDetails.perm)
    );

  const sectionSubtitle =
    config.type === "transport"
      ? "اختر إجراء النقل المطلوب"
      : "اختر العملية المطلوبة";

  return (
    <div className="page-shell flex flex-col">
      <PageHeader
        title={config.title}
        subtitle={sectionSubtitle}
        onBack={onBack}
        accentColor={config.accent}
      />

      <div className="flex flex-1 items-center justify-center p-3 sm:p-4 lg:p-5">
        <div className="w-full max-w-4xl rounded-2xl p-4 sm:p-5 bg-card border border-border shadow-sm backdrop-blur-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
            <div className="text-right">
              <div
                className="inline-flex rounded-full px-2.5 py-0.5 text-[9.5px] font-black bg-secondary/40"
                style={{
                  color: config.accent,
                }}
              >
                {visibleActions.length} عملية
              </div>
              <h2 className="mt-2 text-[17px] font-black tracking-tight text-foreground">
                اختر العملية المطلوبة
              </h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                نفس الوظائف السابقة، بتخطيط أوضح وأهدأ بصريًا.
              </p>
            </div>
          </div>

          <div
            className={`grid w-full gap-3 ${
              visibleActions.length === 1
                ? "max-w-xs grid-cols-1"
                : visibleActions.length === 2
                  ? "max-w-md grid-cols-2"
                  : visibleActions.length === 3
                    ? "max-w-2xl grid-cols-3"
                    : "grid-cols-2 lg:grid-cols-4"
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
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

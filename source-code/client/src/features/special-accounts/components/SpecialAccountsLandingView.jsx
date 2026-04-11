import PageHeader from '../../../components/PageHeader';

export default function SpecialAccountsLandingView({ onBack, accounts, onOpenAccount }) {
  return (
    <div className="page-shell">
      <PageHeader
        title="حسابات خاصة"
        subtitle="الصفحة الرئيسية"
        onBack={onBack}
      />
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="grid w-full max-w-3xl gap-5 md:grid-cols-2">
          {accounts.map((account, index) => {
            const Icon = account.icon;

            return (
              <button
                key={account.id}
                onClick={() => onOpenAccount(account.id)}
                className="surface-card surface-card-hover group relative overflow-hidden rounded-[28px] text-white animate-fade-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div
                  className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.02]"
                  style={{ background: account.surfaceGradient }}
                />
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent 0%, ${account.accent} 50%, transparent 100%)` }}
                />
                <div
                  className="pointer-events-none absolute -left-6 -top-10 h-28 w-28 rounded-full blur-2xl"
                  style={{ background: `radial-gradient(circle, ${account.accentSoft} 0%, transparent 72%)` }}
                />
                <div className="absolute left-[-120%] top-0 h-full w-full bg-gradient-to-r from-transparent via-white/8 to-transparent transition-all duration-700 group-hover:left-[110%]" />
                <div className="pointer-events-none absolute inset-[1px] rounded-[27px] border border-white/[0.06]" />

                <div
                  className="relative flex h-full flex-col items-start gap-4 px-5 py-6 text-right"
                  style={{ boxShadow: account.hoverShadow ? `inset 0 1px 0 rgba(255,255,255,0.04), ${account.hoverShadow}` : undefined }}
                >
                  <div
                    className="flex h-13 w-13 items-center justify-center rounded-[20px] transition-all duration-300 group-hover:scale-105"
                    style={{
                      background: `${account.accent}20`,
                      color: account.accent,
                      boxShadow: `inset 0 1px 0 ${account.accentSoft}`,
                    }}
                  >
                    <Icon size={24} strokeWidth={1.8} />
                  </div>

                  <div className="space-y-2">
                    <div className="text-lg font-black tracking-tight text-[#f4f8fb]">{account.label}</div>
                    <p className="text-sm leading-7 text-[#a7b5c1]">{account.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

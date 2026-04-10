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
        <div className="grid w-full max-w-xl grid-cols-2 gap-5">
          {accounts.map((account, index) => {
            const Icon = account.icon;

            return (
              <button
                key={account.id}
                onClick={() => onOpenAccount(account.id)}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${account.color} text-white shadow-lg ${account.glow} transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl active:translate-y-0 active:shadow-md animate-fade-up`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="absolute left-[-100%] top-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-700 group-hover:left-[100%]" />
                <div className="pointer-events-none absolute inset-[1px] rounded-2xl border border-white/15" />
                <div className="relative flex flex-col items-center gap-3 px-4 py-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white/25">
                    <Icon size={24} strokeWidth={1.8} />
                  </div>
                  <span className="text-lg font-bold">{account.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

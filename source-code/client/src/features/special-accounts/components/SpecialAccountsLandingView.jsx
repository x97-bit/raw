import PageHeader from "../../../components/PageHeader";
import { getAccountAccentLineStyle } from "../specialAccountsTheme";

export default function SpecialAccountsLandingView({
  onBack,
  accounts,
  onOpenAccount,
}) {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <PageHeader
        title="حسابات خاصة"
        subtitle="الصفحة الرئيسية"
        onBack={onBack}
      />
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="grid w-full max-w-3xl gap-5 md:grid-cols-2">
          {accounts.map((account, index) => {
            const Icon = account.icon;
            const accentLineStyle = getAccountAccentLineStyle(account);

            return (
              <button
                key={account.id}
                onClick={() => onOpenAccount(account.id)}
                className="surface-card group relative overflow-hidden rounded-[28px] border border-border bg-card text-foreground shadow-md transition-all duration-300 hover:shadow-lg active:scale-[0.98] animate-fade-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="absolute inset-0 bg-secondary/10 transition-transform duration-300 group-hover:scale-[1.02]" />
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
                  style={accentLineStyle}
                />
                <div
                  className="pointer-events-none absolute -left-6 -top-10 h-28 w-28 rounded-full blur-2xl opacity-20"
                  style={{
                    background: account.accent,
                  }}
                />

                <div className="relative flex h-full flex-col items-start gap-4 px-5 py-6 text-right">
                  <div
                    className="flex h-13 w-13 items-center justify-center rounded-[20px] bg-secondary/50 text-current transition-all duration-300 group-hover:scale-105"
                    style={{
                      color: account.accent,
                    }}
                  >
                    <Icon size={24} strokeWidth={1.8} />
                  </div>

                  <div className="space-y-2">
                    <div className="text-lg font-black tracking-tight text-foreground">
                      {account.label}
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {account.description}
                    </p>
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

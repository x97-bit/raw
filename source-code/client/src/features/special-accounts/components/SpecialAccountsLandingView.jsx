import PageHeader from '../../../components/PageHeader';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAccountAccentLineStyle } from '../specialAccountsTheme';

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

export default function SpecialAccountsLandingView({ onBack, accounts, onOpenAccount }) {
  const { isDark } = useTheme();

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
            const accentLineStyle = getAccountAccentLineStyle(account);
            const lightAccent = tintColor(account.accent, 0.86);
            const lighterAccent = tintColor(account.accent, 0.93);

            return (
              <button
                key={account.id}
                onClick={() => onOpenAccount(account.id)}
                className={`surface-card surface-card-hover group relative overflow-hidden rounded-[28px] animate-fade-up ${
                  isDark ? 'text-white' : 'text-[#24313c]'
                }`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div
                  className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.02]"
                  style={{
                    background: isDark
                      ? account.surfaceGradient
                      : `linear-gradient(155deg, ${lighterAccent} 0%, #ffffff 58%, ${lightAccent} 100%)`,
                    boxShadow: isDark
                      ? undefined
                      : `inset 0 0 0 1px ${withAlpha(account.accent, 0.12)}`,
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={accentLineStyle}
                />
                <div
                  className="pointer-events-none absolute -left-6 -top-10 h-28 w-28 rounded-full blur-2xl"
                  style={{
                    background: `radial-gradient(circle, ${isDark ? account.accentSoft : withAlpha(account.accent, 0.18)} 0%, transparent 72%)`,
                  }}
                />
                <div className={`absolute left-[-120%] top-0 h-full w-full bg-gradient-to-r from-transparent transition-all duration-700 group-hover:left-[110%] ${isDark ? 'via-white/8 to-transparent' : 'via-white/45 to-transparent'}`} />
                <div
                  className="pointer-events-none absolute inset-[1px] rounded-[27px]"
                  style={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : withAlpha(account.accent, 0.12)}` }}
                />

                <div
                  className="relative flex h-full flex-col items-start gap-4 px-5 py-6 text-right"
                  style={{
                    boxShadow: isDark
                      ? account.hoverShadow
                        ? `inset 0 1px 0 rgba(255,255,255,0.04), ${account.hoverShadow}`
                        : undefined
                      : 'inset 0 1px 0 rgba(255,255,255,0.7)',
                  }}
                >
                  <div
                    className="flex h-13 w-13 items-center justify-center rounded-[20px] transition-all duration-300 group-hover:scale-105"
                    style={{
                      background: isDark ? `${account.accent}20` : lightAccent,
                      color: account.accent,
                      boxShadow: isDark
                        ? `inset 0 1px 0 ${account.accentSoft}`
                        : `inset 0 1px 0 rgba(255,255,255,0.72), 0 12px 24px ${withAlpha(account.accent, 0.12)}`,
                    }}
                  >
                    <Icon size={24} strokeWidth={1.8} />
                  </div>

                  <div className="space-y-2">
                    <div
                      className="text-lg font-black tracking-tight"
                      style={{ color: isDark ? '#f4f8fb' : '#24313c' }}
                    >
                      {account.label}
                    </div>
                    <p
                      className="text-sm leading-7"
                      style={{ color: isDark ? '#a7b5c1' : '#667480' }}
                    >
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

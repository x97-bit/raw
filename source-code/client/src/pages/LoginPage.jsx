import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, User } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../contexts/AuthContext';
import { formatBaghdadDate, formatBaghdadTime } from '../features/main-page/baghdadTime';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dateStr = formatBaghdadDate(now);
  const timeStr = formatBaghdadTime(now);

  return (
    <div
      className="page-shell overflow-hidden"
      style={{
        height: '100dvh',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.35s ease',
      }}
    >
      <main className="relative flex h-[100dvh] w-full items-start justify-center overflow-hidden px-6 py-3 sm:px-10 sm:py-4">
        <div className="pointer-events-none absolute inset-0 animate-ambient-drift bg-[radial-gradient(circle_at_center,rgba(100,142,169,0.08),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[28rem] bg-[radial-gradient(circle_at_right,rgba(100,142,169,0.1),transparent_72%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[24rem] bg-[radial-gradient(circle_at_left,rgba(255,255,255,0.04),transparent_72%)]" />

        <section className="relative flex w-full max-w-[32rem] -translate-y-2 flex-col items-center justify-start pt-2 text-center sm:-translate-y-4 sm:pt-3">
          <div className="mb-3">
            <div
              className="text-[2rem] font-black tracking-[0.14em] text-[#f4f8fb] tabular-nums sm:text-[3rem]"
              dir="ltr"
            >
              {timeStr}
            </div>
            <div className="mt-2 text-[13px] font-semibold tracking-[0.14em] text-[#92a1af] sm:text-[15px]">
              {dateStr}
            </div>
          </div>

          <div className="mx-auto -mt-3 mb-3 flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36">
            <BrandLogo className="h-24 w-24 animate-logo-float drop-shadow-[0_18px_42px_rgba(0,0,0,0.24)] sm:h-30 sm:w-30" />
          </div>

          <div className="mb-4 text-center">
            <h1 className="text-[1.7rem] font-black tracking-tight text-[#f4f8fb] sm:text-[2rem]">
              تسجيل الدخول
            </h1>
          </div>

          <div className="surface-card w-full max-w-[26rem] p-4 sm:p-5">
            {error && (
              <div className="mb-3 rounded-[20px] bg-[#b76169]/[0.12] px-4 py-3 text-sm font-medium text-[#f0c9ce] shadow-[inset_0_0_0_1px_rgba(183,97,105,0.18)]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-right">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold tracking-wide text-[#92a1af]">
                  اسم المستخدم
                </label>
                <div className="relative">
                  <User size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#92a1af]" />
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="input-field pr-10"
                    placeholder="أدخل اسم المستخدم"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12.5px] font-semibold tracking-wide text-[#92a1af]">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#92a1af]" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="input-field pr-10 pl-12"
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((current) => !current)}
                    className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-white/[0.06] text-[#c9d4de] transition-colors hover:bg-white/[0.1] hover:text-white"
                    title={showPass ? 'إخفاء' : 'إظهار'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-1 flex w-full items-center justify-center gap-2.5 py-3 text-[14px] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>جارٍ تسجيل الدخول...</span>
                  </>
                ) : (
                  <>
                    <ArrowLeft size={17} />
                    <span>دخول</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-[10.5px] tracking-[0.16em] text-[#6f7d8a]">
              نظام الراوي © {new Date().getFullYear()}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

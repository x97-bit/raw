import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, User } from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import ThemeToggleButton from "../components/ThemeToggleButton";
import { useAuth } from "../contexts/AuthContext";
import {
  formatBaghdadDate,
  formatBaghdadTime,
} from "../features/main-page/baghdadTime";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  const handleSubmit = async event => {
    event.preventDefault();
    setError("");
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
        height: "100dvh",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.35s ease",
      }}
    >
      <div className="absolute left-3 top-3 z-30 pointer-events-auto sm:left-4 sm:top-4">
        <ThemeToggleButton compact />
      </div>

      <main className="relative flex h-[100dvh] w-full items-start justify-center overflow-hidden px-6 py-3 sm:px-10 sm:py-4">
        <div className="page-shell__center-glow pointer-events-none absolute inset-0 animate-ambient-drift" />
        <div className="page-shell__right-glow pointer-events-none absolute inset-y-0 right-0 w-[28rem]" />
        <div className="page-shell__left-glow pointer-events-none absolute inset-y-0 left-0 w-[24rem]" />

        <section className="relative flex w-full max-w-[32rem] -translate-y-2 flex-col items-center justify-start pt-2 text-center sm:-translate-y-4 sm:pt-3">
          <div className="mb-3">
            <div
              className="text-[2rem] font-black tracking-[0.14em] tabular-nums sm:text-[3rem]"
              dir="ltr"
              style={{ color: "var(--hero-title)" }}
            >
              {timeStr}
            </div>
            <div
              className="mt-2 text-[13px] font-semibold tracking-[0.14em] sm:text-[15px]"
              style={{ color: "var(--hero-muted)" }}
            >
              {dateStr}
            </div>
          </div>

          <div className="mx-auto -mt-3 mb-3 flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36">
            <BrandLogo className="h-24 w-24 animate-logo-float drop-shadow-[0_18px_42px_rgba(0,0,0,0.24)] sm:h-32 sm:w-32" />
          </div>

          <div className="mb-4 text-center">
            <h1
              className="text-[1.7rem] font-black tracking-tight sm:text-[2rem]"
              style={{ color: "var(--hero-title)" }}
            >
              تسجيل الدخول
            </h1>
          </div>

          <div className="surface-card w-full max-w-[26rem] p-4 sm:p-5">
            {error && (
              <div
                className="mb-3 rounded-[20px] px-4 py-3 text-sm font-medium"
                style={{
                  background: "var(--error-soft-bg)",
                  color: "var(--error-soft-text)",
                  boxShadow: "var(--error-soft-ring)",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-right">
              <div>
                <label
                  className="mb-1.5 block text-[12.5px] font-semibold tracking-wide"
                  style={{ color: "var(--hero-muted)" }}
                >
                  اسم المستخدم
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--hero-muted)" }}
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={event => setUsername(event.target.value)}
                    className="input-field pr-10"
                    placeholder="أدخل اسم المستخدم"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-1.5 block text-[12.5px] font-semibold tracking-wide"
                  style={{ color: "var(--hero-muted)" }}
                >
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--hero-muted)" }}
                  />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    className="input-field pr-10 pl-12"
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(current => !current)}
                    className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl transition-colors"
                    style={{
                      background: "var(--ghost-button-bg)",
                      color: "var(--ghost-button-text)",
                    }}
                    title={showPass ? "إخفاء" : "إظهار"}
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

            <p
              className="mt-4 text-center text-[10.5px] tracking-[0.16em]"
              style={{ color: "var(--page-header-subtitle)" }}
            >
              نظام الراوي © {new Date().getFullYear()}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, User, Store, Shield } from "lucide-react";
import BrandLogo from "../../components/BrandLogo";
import ThemeToggleButton from "../../components/ThemeToggleButton";
import { useMerchantAuth } from "./merchantContext";
import {
  formatBaghdadDate,
  formatBaghdadTime,
} from "../main-page/baghdadTime";

export default function MerchantLogin() {
  const { login } = useMerchantAuth();
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
      const response = await login(username, password);
      if (!response.success) {
        setError(response.error || "خطأ في تسجيل الدخول");
      }
    } catch (err) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const dateStr = formatBaghdadDate(now);
  const timeStr = formatBaghdadTime(now);

  return (
    <div
      className="page-shell overflow-hidden font-['Cairo','Tajawal',sans-serif]"
      dir="rtl"
      style={{
        height: "100dvh",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      {/* Theme Toggle */}
      <div className="absolute left-3 top-3 z-30 pointer-events-auto">
        <ThemeToggleButton compact />
      </div>

      <main className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden px-4">
        {/* Background Glows */}
        <div className="page-shell__center-glow pointer-events-none absolute inset-0 animate-ambient-drift" />
        <div className="page-shell__right-glow pointer-events-none absolute inset-y-0 right-0 w-[28rem]" />
        <div className="page-shell__left-glow pointer-events-none absolute inset-y-0 left-0 w-[24rem]" />

        <section className="relative flex w-full max-w-[380px] flex-col items-center text-center">
          {/* Time & Date - Compact */}
          <div className="mb-4">
            <div
              className="text-[1.8rem] font-black tracking-[0.12em] tabular-nums sm:text-[2.4rem] leading-none"
              dir="ltr"
              style={{ color: "var(--hero-title)" }}
            >
              {timeStr}
            </div>
            <div
              className="mt-1.5 text-[11px] font-semibold tracking-[0.12em] sm:text-[12px]"
              style={{ color: "var(--hero-muted)" }}
            >
              {dateStr}
            </div>
          </div>

          {/* Logo + Store Icon */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
              <BrandLogo className="h-32 w-32 sm:h-40 sm:w-40 animate-logo-float drop-shadow-[0_12px_32px_rgba(0,0,0,0.2)]" />
            </div>
            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-lg border-2 border-background"
              style={{ backgroundColor: "#2563eb" }}>
              <Store size={28} style={{ color: "#ffffff" }} />
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <h1
              className="text-[1.4rem] font-black tracking-tight sm:text-[1.6rem] leading-tight"
              style={{ color: "var(--hero-title)" }}
            >
              بوابة التجار
            </h1>
            <p className="mt-0.5 text-[11px] font-medium" style={{ color: "var(--hero-muted)" }}>
              النظام المالي الموحد للتجار والعملاء
            </p>
          </div>

          {/* Login Card */}
          <div className="surface-card w-full p-4 sm:p-5">
            {error && (
              <div
                className="mb-3 rounded-xl px-3.5 py-2.5 text-[12px] font-medium animate-in shake"
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
              {/* Username */}
              <div>
                <label
                  className="mb-1 block text-[11px] font-semibold tracking-wide"
                  style={{ color: "var(--hero-muted)" }}
                >
                  اسم المستخدم
                </label>
                <div className="relative">
                  <User
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--hero-muted)" }}
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={event => setUsername(event.target.value)}
                    className="input-field pr-9 text-left font-medium text-[13px]"
                    dir="ltr"
                    placeholder="أدخل اسم المستخدم"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  className="mb-1 block text-[11px] font-semibold tracking-wide"
                  style={{ color: "var(--hero-muted)" }}
                >
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--hero-muted)" }}
                  />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    className="input-field pr-9 pl-11 text-left tracking-widest font-medium text-[13px]"
                    dir="ltr"
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(current => !current)}
                    className="absolute left-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors"
                    style={{
                      background: "var(--ghost-button-bg)",
                      color: "var(--ghost-button-text)",
                    }}
                    title={showPass ? "إخفاء" : "إظهار"}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2 flex w-full items-center justify-center gap-2 py-2.5 text-[13px] font-bold disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>جارٍ الدخول...</span>
                  </>
                ) : (
                  <>
                    <ArrowLeft size={15} />
                    <span>دخول إلى البوابة</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--ghost-button-bg)" }}>
              <p
                className="text-center text-[9.5px] tracking-[0.14em] font-medium"
                style={{ color: "var(--page-header-subtitle)" }}
              >
                شركة طي الراوي © {new Date().getFullYear()}
              </p>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-3 flex items-center gap-1.5 opacity-40">
            <Shield size={11} style={{ color: "var(--hero-muted)" }} />
            <span className="text-[9px] font-medium tracking-wide" style={{ color: "var(--hero-muted)" }}>
              اتصال آمن ومشفر
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

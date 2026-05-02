import { useEffect, useState } from "react";
import BrandLogo from "../components/BrandLogo";
import SidebarToggleButton from "../components/SidebarToggleButton";
import ThemeToggleButton from "../components/ThemeToggleButton";
import {
  formatBaghdadDate,
  formatBaghdadTime,
} from "../features/main-page/baghdadTime";

export default function MainPage() {
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

  const dateStr = formatBaghdadDate(now);
  const timeStr = formatBaghdadTime(now);

  return (
    <div
      className="page-shell"
      style={{
        height: "100dvh",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      {/* Top Controls */}
      <div className="absolute left-3 top-3 z-30 flex items-center gap-2">
        <div className="pointer-events-auto">
          <SidebarToggleButton compact />
        </div>
        <div className="pointer-events-auto">
          <ThemeToggleButton compact />
        </div>
      </div>

      <main className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden px-6">
        {/* Background Glows */}
        <div className="page-shell__center-glow pointer-events-none absolute inset-0 animate-ambient-drift" />
        <div className="page-shell__right-glow pointer-events-none absolute inset-y-0 right-0 w-[28rem]" />
        <div className="page-shell__left-glow pointer-events-none absolute inset-y-0 left-0 w-[24rem]" />

        <section className="relative flex w-full max-w-[28rem] -translate-y-8 flex-col items-center text-center">
          {/* Time */}
          <div className="mb-5">
            <div
              className="text-[2.8rem] font-black tracking-[0.14em] tabular-nums sm:text-[3.6rem] leading-none"
              dir="ltr"
              style={{ color: "var(--hero-title)" }}
            >
              {timeStr}
            </div>
            <div
              className="mt-2 text-[12px] font-semibold tracking-[0.14em] sm:text-[14px]"
              style={{ color: "var(--hero-muted)" }}
            >
              {dateStr}
            </div>
          </div>

          {/* Logo */}
          <div className="flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
            <BrandLogo className="h-32 w-32 animate-logo-float drop-shadow-[0_14px_36px_rgba(0,0,0,0.2)] sm:h-40 sm:w-40" />
          </div>
        </section>
      </main>
    </div>
  );
}

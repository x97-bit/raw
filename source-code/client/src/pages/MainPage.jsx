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
      className="page-shell min-h-screen"
      style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.35s ease" }}
    >
      <div className="absolute left-3 top-3 z-30 flex items-center gap-2 sm:left-4 sm:top-4">
        <div className="pointer-events-auto">
          <SidebarToggleButton compact />
        </div>
        <div className="pointer-events-auto">
          <ThemeToggleButton compact />
        </div>
      </div>

      <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-12 sm:px-10">
        <div className="page-shell__center-glow pointer-events-none absolute inset-0 animate-ambient-drift" />
        <div className="page-shell__right-glow pointer-events-none absolute inset-y-0 right-0 w-[28rem]" />
        <div className="page-shell__left-glow pointer-events-none absolute inset-y-0 left-0 w-[24rem]" />

        <section className="relative flex min-h-screen w-full items-center justify-center">
          <div className="mx-auto flex w-full max-w-[32rem] -translate-y-10 flex-col items-center justify-center text-center sm:-translate-y-14">
            <div className="mb-4">
              <div
                className="text-[3rem] font-black tracking-[0.18em] tabular-nums sm:text-[4rem]"
                dir="ltr"
                style={{ color: "var(--hero-title)" }}
              >
                {timeStr}
              </div>
              <div
                className="mt-3 text-[15px] font-semibold tracking-[0.18em] sm:text-[17px]"
                style={{ color: "var(--hero-muted)" }}
              >
                {dateStr}
              </div>
            </div>

            <div className="mx-auto -mt-6 flex h-52 w-52 items-center justify-center sm:-mt-8 sm:h-64 sm:w-64">
              <BrandLogo className="h-40 w-40 animate-logo-float drop-shadow-[0_18px_42px_rgba(0,0,0,0.24)] sm:h-52 sm:w-52" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

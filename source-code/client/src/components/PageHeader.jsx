import { ArrowRight, Home } from "lucide-react";
import { useAppShell } from "../contexts/AppShellContext";
import SidebarToggleButton from "./SidebarToggleButton";
import ThemeToggleButton from "./ThemeToggleButton";

export default function PageHeader({
  title,
  subtitle,
  onBack,
  onHome,
  children,
  accentColor,
}) {
  const { hasSidebar } = useAppShell();
  const accent = accentColor || "#648ea9";
  const ghostButtonStyle = {
    background: "var(--ghost-button-bg)",
    boxShadow: "var(--ghost-button-shadow)",
    color: "var(--ghost-button-text)",
  };

  return (
    <div className="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4 no-print">
      <div
        className="relative overflow-hidden rounded-[30px] backdrop-blur-xl"
        style={{
          background: "var(--page-header-bg)",
          boxShadow: "var(--page-header-shadow)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accent} 40%, transparent 100%)`,
          }}
        />
        <div
          className="pointer-events-none absolute -top-12 left-0 h-32 w-32 rounded-full opacity-[0.28]"
          style={{
            background: `radial-gradient(circle, ${accent}18 0%, transparent 72%)`,
          }}
        />
        <div
          className="pointer-events-none absolute -right-8 top-0 h-28 w-28 rounded-full opacity-[0.18]"
          style={{ background: "var(--page-header-glow)" }}
        />

        <div className="relative mx-auto max-w-[1500px] px-4 py-3 sm:px-5">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex items-center gap-2 justify-self-start">
              {hasSidebar && <SidebarToggleButton compact />}
              {children}
            </div>

            <div className="min-w-0 text-center">
              <h1
                className="truncate text-[18px] font-black tracking-tight sm:text-[20px]"
                style={{ color: "var(--page-header-title)" }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className="mt-1 truncate text-[11px] font-medium tracking-wide sm:text-[11.5px]"
                  style={{ color: "var(--page-header-subtitle)" }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 justify-self-end">
              <ThemeToggleButton compact />

              {onHome && (
                <button
                  onClick={onHome}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                  style={ghostButtonStyle}
                  title="الصفحة الرئيسية"
                >
                  <Home size={16} className="text-current" />
                </button>
              )}

              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  style={ghostButtonStyle}
                >
                  <ArrowRight
                    size={16}
                    style={{ color: "var(--ghost-button-icon)" }}
                  />
                  <span>رجوع</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

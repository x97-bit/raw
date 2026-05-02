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
    <div className="sticky top-0 z-40 px-3 pt-2.5 sm:px-3.5 sm:pt-3 no-print">
      <div
        className="relative overflow-hidden rounded-2xl backdrop-blur-xl"
        style={{
          background: "var(--page-header-bg)",
          boxShadow: "var(--page-header-shadow)",
        }}
      >
        {/* Top accent line */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accent} 40%, transparent 100%)`,
          }}
        />
        <div
          className="pointer-events-none absolute -top-10 left-0 h-24 w-24 rounded-full opacity-[0.2]"
          style={{
            background: `radial-gradient(circle, ${accent}18 0%, transparent 72%)`,
          }}
        />
        <div
          className="pointer-events-none absolute -right-6 top-0 h-20 w-20 rounded-full opacity-[0.15]"
          style={{ background: "var(--page-header-glow)" }}
        />

        <div className="relative mx-auto max-w-[1500px] px-3.5 py-2.5 sm:px-4">
          <div className="flex items-center justify-between gap-3">
            {/* Right side: Back + Home + Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all duration-200 hover:-translate-y-0.5 flex-shrink-0"
                  style={ghostButtonStyle}
                >
                  <ArrowRight
                    size={14}
                    style={{ color: "var(--ghost-button-icon)" }}
                  />
                  <span>رجوع</span>
                </button>
              )}

              {onHome && (
                <button
                  onClick={onHome}
                  className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 hover:-translate-y-0.5 flex-shrink-0"
                  style={ghostButtonStyle}
                  title="الصفحة الرئيسية"
                >
                  <Home size={14} className="text-current" />
                </button>
              )}

              {/* Title */}
              <div className="min-w-0">
                <h1
                  className="truncate text-[15px] font-black tracking-tight sm:text-[17px]"
                  style={{ color: "var(--page-header-title)" }}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p
                    className="mt-0.5 truncate text-[10px] font-medium tracking-wide sm:text-[10.5px]"
                    style={{ color: "var(--page-header-subtitle)" }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Left side: Children (export buttons etc.) + Theme + Sidebar */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {children}
              <ThemeToggleButton compact />
              {hasSidebar && <SidebarToggleButton compact />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

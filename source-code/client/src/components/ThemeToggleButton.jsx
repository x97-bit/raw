import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggleButton({ compact = false, className = "" }) {
  const { isDark, toggleTheme } = useTheme();
  const nextLabel = isDark ? "الوضع الفاتح" : "الوضع الداكن";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={nextLabel}
      aria-label={nextLabel}
      className={`theme-toggle ${compact ? "theme-toggle--compact" : ""} ${className}`.trim()}
    >
      <span className="theme-toggle__icon">
        <Icon size={16} strokeWidth={1.9} />
      </span>
      {!compact && (
        <span className="theme-toggle__label">{isDark ? "فاتح" : "داكن"}</span>
      )}
    </button>
  );
}

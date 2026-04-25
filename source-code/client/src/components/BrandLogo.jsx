import { useTheme } from "../contexts/ThemeContext";

const DARK_LOGO_SRC =
  "/templates/tayalrawi-logo-new-transparent-regenerated.png";
const LIGHT_LOGO_SRC = "/templates/tayalrawi-logo-trimmed.png";

export default function BrandLogo({ className = "", alt = "Tay Alrawi logo" }) {
  const { isDark } = useTheme();

  return (
    <img
      src={isDark ? DARK_LOGO_SRC : LIGHT_LOGO_SRC}
      alt={alt}
      className={`object-contain ${className}`}
    />
  );
}

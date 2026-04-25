import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const THEME_STORAGE_KEY = "alrawi-ui-theme";

function normalizeTheme(theme) {
  return theme === "light" ? "light" : "dark";
}

export function readInitialTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "dark";
  }
}

export function applyTheme(theme) {
  if (typeof document === "undefined") {
    return;
  }

  const nextTheme = normalizeTheme(theme);
  const root = document.documentElement;

  root.dataset.theme = nextTheme;
  root.classList.toggle("dark", nextTheme === "dark");
  root.style.colorScheme = nextTheme;
}

const ThemeContext = createContext({
  theme: "dark",
  isDark: true,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => readInitialTheme());

  useEffect(() => {
    applyTheme(theme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures and keep the current in-memory preference.
    }
  }, [theme]);

  const setTheme = useCallback(nextTheme => {
    setThemeState(currentTheme =>
      normalizeTheme(
        typeof nextTheme === "function" ? nextTheme(currentTheme) : nextTheme
      )
    );
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(currentTheme => (currentTheme === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

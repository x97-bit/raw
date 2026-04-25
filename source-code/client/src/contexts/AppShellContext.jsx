import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "app-shell-sidebar-collapsed";
const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

const AppShellContext = createContext({
  hasSidebar: false,
  isDesktop: false,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  openSidebar: () => {},
});

function getDesktopMatch() {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }

  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function readInitialSidebarCollapsed() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AppShellProvider({ children }) {
  const [isDesktop, setIsDesktop] = useState(() => getDesktopMatch());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    readInitialSidebarCollapsed()
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return undefined;
    }

    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const handleChange = event => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        SIDEBAR_COLLAPSED_STORAGE_KEY,
        sidebarCollapsed ? "1" : "0"
      );
    } catch {
      // Ignore localStorage failures and keep the preference in memory.
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const toggleSidebar = useCallback(() => {
    if (isDesktop) {
      setSidebarCollapsed(current => !current);
      return;
    }

    setMobileSidebarOpen(current => !current);
  }, [isDesktop]);

  const closeSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    if (isDesktop) {
      setSidebarCollapsed(false);
      return;
    }

    setMobileSidebarOpen(true);
  }, [isDesktop]);

  const value = useMemo(
    () => ({
      hasSidebar: true,
      isDesktop,
      sidebarCollapsed,
      mobileSidebarOpen,
      toggleSidebar,
      closeSidebar,
      openSidebar,
    }),
    [
      closeSidebar,
      isDesktop,
      mobileSidebarOpen,
      openSidebar,
      sidebarCollapsed,
      toggleSidebar,
    ]
  );

  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  return useContext(AppShellContext);
}

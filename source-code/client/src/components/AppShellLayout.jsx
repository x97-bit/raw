import { Suspense } from "react";
import { RouterProvider, useNavigate, useLocation } from "react-router-dom";
import { AppShellProvider, useAppShell } from "../contexts/AppShellContext";
import { useAuth } from "../contexts/AuthContext";
import AppSidebar from "./AppSidebar";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import { router, PAGE_PATHS } from "../router";
import { sectionConfig } from "../features/navigation/sectionCatalog";
import { ADMIN_ONLY_PAGES } from "../features/navigation/stackNavigation";

// ============================================================================
// AppShellLayout
// ============================================================================
// Provides the authenticated app shell with sidebar navigation.
// Uses React Router for URL-based navigation while maintaining the same
// visual layout and sidebar behavior as the original implementation.
// ============================================================================

function ShellFrame({ children }) {
  const { isDesktop, sidebarCollapsed } = useAppShell();
  const contentMarginRight = isDesktop ? (sidebarCollapsed ? 88 : 288) : 0;
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = useAuth();

  // Resolve active sidebar item from current URL
  const resolveActiveItem = () => {
    const path = location.pathname;

    if (path === "/") return "main";
    if (path === "/profile") return "profile";

    // Check section routes
    const sectionMatch = path.match(/^\/section\/(.+)$/);
    if (sectionMatch) return sectionMatch[1];

    // Check port routes — map portId back to section
    const portMatch = path.match(/^\/port\/(.+?)(?:\/|$)/);
    if (portMatch) {
      const portId = portMatch[1];
      // Find the section that owns this portId
      for (const [sectionId, config] of Object.entries(sectionConfig)) {
        if (config.portId === portId) return sectionId;
      }
      return portId;
    }

    // Map direct page paths to sidebar items
    for (const [key, pagePath] of Object.entries(PAGE_PATHS)) {
      if (path === pagePath && key !== "main") return key;
    }

    return "main";
  };

  const handleSidebarSelect = (sectionId) => {
    // Direct page targets
    if (PAGE_PATHS[sectionId]) {
      navigate(PAGE_PATHS[sectionId]);
      return;
    }

    // Section targets
    if (sectionConfig[sectionId]) {
      navigate(`/section/${sectionId}`);
      return;
    }
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleProfileClick = () => {
    if (can.manageUsers) {
      navigate("/users");
    } else {
      navigate("/profile");
    }
  };

  return (
    <>
      <AppSidebar
        activeItemId={resolveActiveItem()}
        onSelectItem={handleSidebarSelect}
        onGoHome={handleGoHome}
        onProfileClick={handleProfileClick}
      />
      <div
        className="min-w-0 transition-[margin] duration-300 ease-out"
        style={{ marginRight: contentMarginRight }}
      >
        {children}
      </div>
    </>
  );
}

export default function AppShellLayout() {
  return (
    <AppShellProvider>
      <RouterProvider router={router}>
        {({ outlet }) => (
          <ShellFrame>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner fullScreen />}>
                {outlet}
              </Suspense>
            </ErrorBoundary>
          </ShellFrame>
        )}
      </RouterProvider>
    </AppShellProvider>
  );
}

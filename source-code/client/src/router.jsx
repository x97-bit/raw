import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
} from "react-router-dom";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";

// ============================================================================
// React Router Configuration for Alrawi
// ============================================================================
// This replaces the custom state-based navigation stack with URL-based routing.
// Benefits:
// - Browser back/forward buttons work correctly
// - Deep linking to specific pages is supported
// - URL sharing for specific views
// - Better code splitting with route-based lazy loading
// ============================================================================

// Lazy-loaded page components
const MainPage = lazy(() => import("./pages/MainPage"));
const SectionPage = lazy(() => import("./pages/SectionPage"));
const PortPage = lazy(() => import("./pages/PortPage"));
const DebtsPage = lazy(() => import("./pages/DebtsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const AccountsPage = lazy(() => import("./pages/AccountsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const MerchantsManagementPage = lazy(() => import("./pages/MerchantsManagementPage"));
const BackupsPage = lazy(() => import("./pages/BackupsPage"));
const TrialBalancePage = lazy(() => import("./pages/TrialBalancePage"));
const PaymentMatchingPage = lazy(() => import("./pages/PaymentMatchingPage"));
const FieldManagementPage = lazy(() => import("./pages/FieldManagementPage"));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage"));
const DefaultsManagementPage = lazy(() => import("./pages/DefaultsManagementPage"));
const AuditLogsPage = lazy(() => import("./pages/AuditLogsPage"));

// Layout wrapper with suspense
function SuspenseWrapper() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );
}

// ============================================================================
// Route definitions
// ============================================================================

export const routeConfig = [
  {
    element: <SuspenseWrapper />,
    children: [
      // Home / Dashboard
      { path: "/", element: <MainPage /> },

      // Section pages (port selection, transport, partnership, fx)
      { path: "/section/:sectionId", element: <SectionPage /> },

      // Port work pages with optional view and form type
      { path: "/port/:portId", element: <PortPage /> },
      { path: "/port/:portId/:view", element: <PortPage /> },
      { path: "/port/:portId/:view/:formType", element: <PortPage /> },

      // Financial pages
      { path: "/debts", element: <DebtsPage /> },
      { path: "/expenses", element: <ExpensesPage /> },
      { path: "/reports", element: <ReportsPage /> },
      { path: "/trial-balance", element: <TrialBalancePage /> },
      { path: "/payment-matching", element: <PaymentMatchingPage /> },

      // Account pages
      { path: "/accounts", element: <AccountsPage /> },

      // Admin pages
      { path: "/users", element: <UsersPage /> },
      { path: "/merchants", element: <MerchantsManagementPage /> },
      { path: "/field-management", element: <FieldManagementPage /> },
      { path: "/defaults", element: <DefaultsManagementPage /> },
      { path: "/backups", element: <BackupsPage /> },
      { path: "/audit-logs", element: <AuditLogsPage /> },

      // User profile
      { path: "/profile", element: <ProfilePage /> },

      // Catch-all redirect to home
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
];

export const router = createBrowserRouter(routeConfig);

// ============================================================================
// Navigation helpers (replacement for stackNavigation.js)
// ============================================================================

/**
 * Build the URL path for a section page.
 */
export function buildSectionPath(sectionId) {
  return `/section/${sectionId}`;
}

/**
 * Build the URL path for a port work page.
 */
export function buildPortPath(portId, view, formType) {
  let path = `/port/${portId}`;
  if (view) path += `/${view}`;
  if (formType) path += `/${formType}`;
  return path;
}

/**
 * Map old navigation targets to new URL paths.
 * Used during migration to maintain backward compatibility.
 */
export const PAGE_PATHS = {
  main: "/",
  debts: "/debts",
  reports: "/reports",
  accounts: "/accounts",
  profile: "/profile",
  users: "/users",
  "merchant-management": "/merchants",
  backups: "/backups",
  "trial-balance": "/trial-balance",
  "payment-matching": "/payment-matching",
  "field-management": "/field-management",
  "defaults-management": "/defaults",
  "audit-logs": "/audit-logs",
  expenses: "/expenses",
};

/**
 * Resolve a section action to a URL path.
 * Replaces resolveSectionActionNavigation from stackNavigation.js
 */
export function resolveSectionActionPath(sectionId, action, sectionConfig) {
  const config = sectionConfig[sectionId];
  if (!config) return null;

  const portId = config.portId;

  switch (action) {
    case "invoice":
      return buildPortPath(portId, "form", "1") +
        `?accountType=${config.accountType || ""}&name=${encodeURIComponent(config.title)}`;
    case "payment":
      return buildPortPath(portId, "form", "2") +
        `?accountType=${config.accountType || ""}&name=${encodeURIComponent(config.title)}`;
    case "debit":
      return buildPortPath(portId, "form", "3") +
        `?accountType=${config.accountType || ""}&name=${encodeURIComponent(config.title)}`;
    case "statement":
      return buildPortPath(portId, "statement-select") +
        `?accountType=${config.accountType || ""}&name=${encodeURIComponent(config.title)}`;
    case "traders":
      return buildPortPath(portId, "list") +
        `?accountType=${config.accountType || ""}&name=${encodeURIComponent(config.title)}`;
    default:
      return null;
  }
}

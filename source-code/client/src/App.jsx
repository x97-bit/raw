import { Suspense, lazy, useMemo } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import AppSidebar from "./components/AppSidebar";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppShellProvider, useAppShell } from "./contexts/AppShellContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import {
  ADMIN_ONLY_PAGES,
  resolveMainPageNavigation,
  resolveSectionActionNavigation,
} from "./features/navigation/stackNavigation";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import SectionPage from "./pages/SectionPage";

// ─── Lazy-loaded page components ─────────────────────────────────────────────
const pageComponents = {
  debts: lazy(() => import("./pages/DebtsPage")),
  reports: lazy(() => import("./pages/ReportsPage")),
  accounts: lazy(() => import("./pages/AccountsPage")),
  profile: lazy(() => import("./pages/ProfilePage")),
  users: lazy(() => import("./pages/UsersPage")),
  "merchant-management": lazy(() => import("./pages/MerchantsManagementPage")),
  backups: lazy(() => import("./pages/BackupsPage")),
  "trial-balance": lazy(() => import("./pages/TrialBalancePage")),
  "payment-matching": lazy(() => import("./pages/PaymentMatchingPage")),
  "field-management": lazy(() => import("./pages/FieldManagementPage")),
  expenses: lazy(() => import("./pages/ExpensesPage")),
  "defaults-management": lazy(() => import("./pages/DefaultsManagementPage")),
  "audit-logs": lazy(() => import("./pages/AuditLogsPage")),
  "port-work": lazy(() => import("./pages/PortPage")),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function renderLazyPage(pageKey, node) {
  return (
    <ErrorBoundary key={pageKey}>
      <Suspense fallback={<LoadingSpinner fullScreen />}>{node}</Suspense>
    </ErrorBoundary>
  );
}

/** Build a port URL with search params */
function buildPortUrl(target) {
  const params = new URLSearchParams();
  if (target.portName) params.set("portName", target.portName);
  if (target.accountType) params.set("accountType", String(target.accountType));
  if (target.view) params.set("view", target.view);
  if (target.formType) params.set("formType", String(target.formType));
  const qs = params.toString();
  return `/admin/port/${target.portId}${qs ? `?${qs}` : ""}`;
}

/** Navigate to a resolved target */
function navigateToTarget(nav, target) {
  if (!target) return;
  if (target.page === "section") {
    nav(`/admin/section/${target.sectionId || ""}`);
  } else if (target.page === "port-work") {
    nav(buildPortUrl(target));
  } else {
    nav(`/admin/${target.page}`);
  }
}

/** Derive the active sidebar item from the current URL path */
function resolveActiveSidebarItem(pathname) {
  if (pathname === "/admin" || pathname === "/admin/") return "main";

  const sectionMatch = pathname.match(/^\/admin\/section\/([^/]+)/);
  if (sectionMatch) return sectionMatch[1];

  const portMatch = pathname.match(/^\/admin\/port\/([^/]+)/);
  if (portMatch) return portMatch[1];

  if (pathname.startsWith("/admin/profile")) return "profile";

  const pageKey = pathname.replace(/^\/admin\//, "").split("/")[0];
  return pageKey || "main";
}

// ─── Guarded lazy page wrapper ───────────────────────────────────────────────
function LazyPage({ pageKey }) {
  const { can } = useAuth();
  const navigate = useNavigate();

  const PageComponent = pageComponents[pageKey];
  if (!PageComponent) return <Navigate to="/admin" replace />;
  if (ADMIN_ONLY_PAGES.has(pageKey) && !can.manageUsers) {
    return <Navigate to="/admin" replace />;
  }

  return renderLazyPage(
    pageKey,
    <PageComponent onBack={() => navigate(-1)} />
  );
}

// ─── Port page wrapper (extracts params from URL) ────────────────────────────
function PortPageRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const portId = location.pathname.split("/")[3] || "";
  const portName = searchParams.get("portName") || "";
  const accountType = Number(searchParams.get("accountType")) || undefined;
  const initialView = searchParams.get("view") || "list";
  const initialFormType = Number(searchParams.get("formType")) || undefined;

  const PortPage = pageComponents["port-work"];

  return renderLazyPage(
    `port-work:${portId}:${initialView}:${initialFormType || ""}`,
    <PortPage
      portId={portId}
      portName={portName}
      accountType={accountType}
      initialView={initialView}
      initialFormType={initialFormType}
      onBack={() => navigate(-1)}
      onHome={() => navigate("/admin")}
    />
  );
}

// ─── Section page wrapper (extracts sectionId from URL) ──────────────────────
function SectionPageRoute() {
  const navigate = useNavigate();
  const sectionId = useLocation().pathname.split("/")[3] || "";

  return (
    <SectionPage
      sectionId={sectionId}
      onBack={() => navigate(-1)}
      onAction={(secId, action) => {
        const target = resolveSectionActionNavigation(secId, action);
        navigateToTarget(navigate, target);
      }}
    />
  );
}

// ─── App Shell Frame (sidebar + content area) ────────────────────────────────
function AppShellFrame({ children }) {
  const { isDesktop, sidebarCollapsed } = useAppShell();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useAuth();

  const activeItemId = useMemo(
    () => resolveActiveSidebarItem(location.pathname),
    [location.pathname]
  );

  const contentMarginRight = isDesktop ? (sidebarCollapsed ? 88 : 288) : 0;

  const handleSidebarSelect = (sectionId) => {
    const target = resolveMainPageNavigation(sectionId);
    navigateToTarget(navigate, target);
  };

  const handleGoHome = () => navigate("/admin");

  const handleProfileClick = () => {
    navigate(can.manageUsers ? "/admin/users" : "/admin/profile");
  };

  return (
    <>
      <AppSidebar
        activeItemId={activeItemId}
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

// ─── Main Page wrapper ───────────────────────────────────────────────────────
function MainPageRoute() {
  const navigate = useNavigate();

  const handleNavigate = (sectionId) => {
    const target = resolveMainPageNavigation(sectionId);
    navigateToTarget(navigate, target);
  };

  return <MainPage onNavigate={handleNavigate} />;
}

// ─── Main App Content ────────────────────────────────────────────────────────
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen label="جاري التحميل..." />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppShellProvider>
      <AppShellFrame>
        <Routes>
          <Route path="/admin" element={<MainPageRoute />} />
          <Route path="/admin/section/:sectionId" element={<SectionPageRoute />} />
          <Route path="/admin/port/:portId" element={<PortPageRoute />} />

          {/* Direct page routes */}
          <Route path="/admin/debts" element={<LazyPage pageKey="debts" />} />
          <Route path="/admin/reports" element={<LazyPage pageKey="reports" />} />
          <Route path="/admin/accounts" element={<LazyPage pageKey="accounts" />} />
          <Route path="/admin/profile" element={<LazyPage pageKey="profile" />} />
          <Route path="/admin/users" element={<LazyPage pageKey="users" />} />
          <Route path="/admin/merchant-management" element={<LazyPage pageKey="merchant-management" />} />
          <Route path="/admin/backups" element={<LazyPage pageKey="backups" />} />
          <Route path="/admin/trial-balance" element={<LazyPage pageKey="trial-balance" />} />
          <Route path="/admin/payment-matching" element={<LazyPage pageKey="payment-matching" />} />
          <Route path="/admin/field-management" element={<LazyPage pageKey="field-management" />} />
          <Route path="/admin/expenses" element={<LazyPage pageKey="expenses" />} />
          <Route path="/admin/defaults-management" element={<LazyPage pageKey="defaults-management" />} />
          <Route path="/admin/audit-logs" element={<LazyPage pageKey="audit-logs" />} />
          {/* Fallback */}
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AppShellFrame>
    </AppShellProvider>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

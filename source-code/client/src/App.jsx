import { Suspense, lazy, useState } from 'react';
import AppSidebar from './components/AppSidebar';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppShellProvider, useAppShell } from './contexts/AppShellContext';
import {
  ADMIN_ONLY_PAGES,
  createMainPageEntry,
  resolveMainPageNavigation,
  resolveSectionActionNavigation,
} from './features/navigation/stackNavigation';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import SectionPage from './pages/SectionPage';

const pageComponents = {
  debts: lazy(() => import('./pages/DebtsPage')),
  reports: lazy(() => import('./pages/ReportsPage')),
  accounts: lazy(() => import('./pages/AccountsPage')),
  profile: lazy(() => import('./pages/ProfilePage')),
  users: lazy(() => import('./pages/UsersPage')),
  'trial-balance': lazy(() => import('./pages/TrialBalancePage')),
  'payment-matching': lazy(() => import('./pages/PaymentMatchingPage')),
  'field-management': lazy(() => import('./pages/FieldManagementPage')),
  expenses: lazy(() => import('./pages/ExpensesPage')),
  'defaults-management': lazy(() => import('./pages/DefaultsManagementPage')),
  'audit-logs': lazy(() => import('./pages/AuditLogsPage')),
  'port-work': lazy(() => import('./pages/PortPage')),
};

function renderLazyPage(node) {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      {node}
    </Suspense>
  );
}

function resolveActiveSidebarItem(current) {
  if (!current) return 'main';
  if (current.page === 'main') return 'main';
  if (current.page === 'profile') return 'profile';
  if (current.sectionId) return current.sectionId;
  return current.page;
}

function AppShellFrame({ activeItemId, onSelectItem, onGoHome, onProfileClick, children }) {
  const { isDesktop, sidebarCollapsed } = useAppShell();
  const contentMarginRight = isDesktop ? (sidebarCollapsed ? 88 : 288) : 0;

  return (
    <>
      <AppSidebar activeItemId={activeItemId} onSelectItem={onSelectItem} onGoHome={onGoHome} onProfileClick={onProfileClick} />
      <div
        className="min-w-0 transition-[margin] duration-300 ease-out"
        style={{ marginRight: contentMarginRight }}
      >
        {children}
      </div>
    </>
  );
}

function AppContent() {
  const { user, loading, can } = useAuth();
  const [navStack, setNavStack] = useState([createMainPageEntry()]);

  const navigate = (page, data = {}) => {
    setNavStack((currentStack) => [...currentStack, { page, ...data }]);
  };

  const goBack = () => {
    setNavStack((currentStack) => (
      currentStack.length > 1 ? currentStack.slice(0, -1) : currentStack
    ));
  };

  const goHome = () => {
    setNavStack([createMainPageEntry()]);
  };

  const handleMainPageNavigate = (sectionId) => {
    const target = resolveMainPageNavigation(sectionId);
    if (target) {
      navigate(target.page, target);
    }
  };

  const handleSectionAction = (sectionId, action) => {
    const target = resolveSectionActionNavigation(sectionId, action);
    if (target) {
      navigate(target.page, target);
    }
  };

  const handleSidebarSelect = (sectionId) => {
    const target = resolveMainPageNavigation(sectionId);
    if (!target) {
      return;
    }

    setNavStack([createMainPageEntry(), { ...target }]);
  };

  const handleProfileClick = () => {
    if (can.manageUsers) {
      setNavStack([createMainPageEntry(), { page: 'users' }]);
      return;
    }

    setNavStack([createMainPageEntry(), { page: 'profile' }]);
  };

  const renderMainPage = () => <MainPage onNavigate={handleMainPageNavigate} />;

  if (loading) {
    return <LoadingSpinner fullScreen label="جاري التحميل..." />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const current = navStack[navStack.length - 1];
  const activeItemId = resolveActiveSidebarItem(current);

  const wrapWithShell = (node) => (
    <AppShellProvider>
      <AppShellFrame activeItemId={activeItemId} onSelectItem={handleSidebarSelect} onGoHome={goHome} onProfileClick={handleProfileClick}>
        {node}
      </AppShellFrame>
    </AppShellProvider>
  );

  let pageNode = renderMainPage();

  if (current.page === 'main') {
    pageNode = renderMainPage();
  } else if (current.page === 'section') {
    pageNode = (
      <SectionPage
        sectionId={current.sectionId}
        onBack={goBack}
        onAction={handleSectionAction}
      />
    );
  } else if (current.page === 'port-work') {
    const PortPage = pageComponents['port-work'];

    pageNode = renderLazyPage(
      <PortPage
        portId={current.portId}
        portName={current.portName}
        accountType={current.accountType}
        initialView={current.view}
        initialFormType={current.formType}
        onBack={goBack}
        onHome={goHome}
      />
    );
  } else {
    const PageComponent = pageComponents[current.page];

    if (!PageComponent) {
      pageNode = renderMainPage();
    } else if (ADMIN_ONLY_PAGES.has(current.page) && !can.manageUsers) {
      pageNode = renderMainPage();
    } else {
      pageNode = renderLazyPage(<PageComponent onBack={goBack} />);
    }
  }

  return wrapWithShell(pageNode);
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

import { Suspense, lazy, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import SectionPage, { sectionConfig } from './pages/SectionPage';

const PortPage = lazy(() => import('./pages/PortPage'));
const DebtsPage = lazy(() => import('./pages/DebtsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const TrialBalancePage = lazy(() => import('./pages/TrialBalancePage'));
const PaymentMatchingPage = lazy(() => import('./pages/PaymentMatchingPage'));
const FieldManagementPage = lazy(() => import('./pages/FieldManagementPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));

function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      </div>
    </div>
  );
}

function renderLazyPage(node) {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      {node}
    </Suspense>
  );
}

function AppContent() {
  const { user, loading, can } = useAuth();
  const [navStack, setNavStack] = useState([{ page: 'main' }]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">جارٍ التحميل...</p>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  const current = navStack[navStack.length - 1];

  const navigate = (page, data = {}) => {
    setNavStack(prev => [...prev, { page, ...data }]);
  };

  const goBack = () => {
    setNavStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  };

  const goHome = () => {
    setNavStack([{ page: 'main' }]);
  };

  // Main Page
  if (current.page === 'main') {
    return (
      <MainPage onNavigate={(sectionId) => {
        if (sectionId === 'debts') {
          navigate('debts');
        } else if (sectionId === 'reports') {
          navigate('reports');
        } else if (sectionId === 'special') {
          navigate('accounts');
        } else if (sectionId === 'users') {
          navigate('users');
        } else if (sectionId === 'trial-balance') {
          navigate('trial-balance');
        } else if (sectionId === 'payment-matching') {
          navigate('payment-matching');
        } else if (sectionId === 'field-management') {
          navigate('field-management');
        } else if (sectionId === 'expenses') {
          navigate('expenses');
        } else if (sectionConfig[sectionId]) {
          navigate('section', { sectionId });
        }
      }} />
    );
  }

  // Section Page (port, transport, partnership, fx)
  if (current.page === 'section') {
    return (
      <SectionPage
        sectionId={current.sectionId}
        onBack={goBack}
        onAction={(sectionId, action, config) => {
          if (action === 'invoice') {
            navigate('port-work', { sectionId, portId: config.portId, portName: config.title, accountType: config.accountType, formType: 1, view: 'form' });
          } else if (action === 'payment') {
            navigate('port-work', { sectionId, portId: config.portId, portName: config.title, accountType: config.accountType, formType: 2, view: 'form' });
          } else if (action === 'statement') {
            navigate('port-work', { sectionId, portId: config.portId, portName: config.title, accountType: config.accountType, view: 'statement-select' });
          } else if (action === 'traders') {
            navigate('port-work', { sectionId, portId: config.portId, portName: config.title, accountType: config.accountType, view: 'list' });
          }
        }}
      />
    );
  }

  // Port Work (invoice, payment, statement, traders list)
  if (current.page === 'port-work') {
    return renderLazyPage(
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
  }

  // Debts
  if (current.page === 'debts') {
    return renderLazyPage(<DebtsPage onBack={goBack} />);
  }

  // Expenses
  if (current.page === 'expenses') {
    return renderLazyPage(<ExpensesPage onBack={goBack} />);
  }

  // Reports
  if (current.page === 'reports') {
    return renderLazyPage(<ReportsPage onBack={goBack} />);
  }

  // Accounts (Special)
  if (current.page === 'accounts') {
    return renderLazyPage(<AccountsPage onBack={goBack} />);
  }

  // Trial Balance
  if (current.page === 'trial-balance') {
    return renderLazyPage(<TrialBalancePage onBack={goBack} />);
  }

  // Payment Matching
  if (current.page === 'payment-matching') {
    return renderLazyPage(<PaymentMatchingPage onBack={goBack} />);
  }

  // Field Management (admin only)
  if (current.page === 'field-management') {
    return can.manageUsers
      ? renderLazyPage(<FieldManagementPage onBack={goBack} />)
      : <MainPage onNavigate={(id) => navigate('section', { sectionId: id })} />;
  }

  // Users Management (admin only)
  if (current.page === 'users') {
    return can.manageUsers
      ? renderLazyPage(<UsersPage onBack={goBack} />)
      : <MainPage onNavigate={(id) => navigate('section', { sectionId: id })} />;
  }

  // Fallback
  return <MainPage onNavigate={(id) => navigate('section', { sectionId: id })} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

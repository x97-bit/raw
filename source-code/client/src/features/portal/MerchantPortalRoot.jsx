import { useState, useEffect, Suspense, lazy } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";
import MerchantLogin from "./MerchantLogin";
import { MerchantAuthContext, MerchantNavigationContext, useMerchantAuth } from "./merchantContext";

const MerchantAppShell = lazy(() => import("./MerchantAppShell"));
const MerchantDashboard = lazy(() => import("./MerchantDashboard"));
const MerchantStatementPage = lazy(() => import("./MerchantStatementPage"));
const MerchantInvoicesPage = lazy(() => import("./MerchantInvoicesPage"));
const MerchantPaymentsPage = lazy(() => import("./MerchantPaymentsPage"));
const MerchantNotificationsPage = lazy(() => import("./MerchantNotificationsPage"));
const MerchantSupportPage = lazy(() => import("./MerchantSupportPage"));

const API = "/api";
const MERCHANT_TOKEN_KEY = "merchant_token";

// Re-export for backward compatibility
export { merchantTrpc, useMerchantAuth, useMerchantNavigation } from "./merchantContext";

function MerchantAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem(MERCHANT_TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem(MERCHANT_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(MERCHANT_TOKEN_KEY);
    }
  }, [token]);

  const fetchUser = async (currentToken) => {
    try {
      const response = await fetch(`${API}/merchant-auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (!response.ok) throw new Error("Invalid session");
      const data = await response.json();
      setUser(data);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API}/merchant-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error };
      
      sessionStorage.setItem(MERCHANT_TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: "حدث خطأ في الاتصال بالخادم" };
    }
  };

  const logout = async () => {
    if (token) {
      await fetch(`${API}/merchant-auth/logout`, { method: "POST" });
    }
    sessionStorage.removeItem(MERCHANT_TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <MerchantAuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </MerchantAuthContext.Provider>
  );
}

function MerchantNavigationProvider({ children }) {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [pageParams, setPageParams] = useState({});

  const navigateTo = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  return (
    <MerchantNavigationContext.Provider value={{ currentPage, pageParams, navigateTo }}>
      {children}
    </MerchantNavigationContext.Provider>
  );
}

function MerchantPageRouter() {
  const [currentPage, setCurrentPage] = useState(null);
  
  return (
    <MerchantNavigationContext.Consumer>
      {(nav) => {
        const page = nav?.currentPage || "dashboard";
        
        switch (page) {
          case "dashboard":
            return <MerchantDashboard />;
          case "statement":
            return <MerchantStatementPage />;
          case "invoices":
            return <MerchantInvoicesPage />;
          case "payments":
            return <MerchantPaymentsPage />;
          case "notifications":
            return <MerchantNotificationsPage />;
          case "support":
            return <MerchantSupportPage />;
          default:
            return <MerchantDashboard />;
        }
      }}
    </MerchantNavigationContext.Consumer>
  );
}

function MerchantApp() {
  const { user, loading } = useMerchantAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <MerchantLogin />;

  return (
    <MerchantNavigationProvider>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <MerchantAppShell>
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <MerchantPageRouter />
          </Suspense>
        </MerchantAppShell>
      </Suspense>
    </MerchantNavigationProvider>
  );
}

export default function MerchantPortalRoot() {
  return (
    <MerchantAuthProvider>
      <MerchantApp />
    </MerchantAuthProvider>
  );
}

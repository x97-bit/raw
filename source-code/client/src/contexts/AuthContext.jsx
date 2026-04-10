import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const API = '/api';
const AUTH_TOKEN_STORAGE_KEY = 'token';
const SESSION_EXPIRED_MESSAGE = '\u0627\u0646\u062a\u0647\u062a \u0627\u0644\u062c\u0644\u0633\u0629';
const REQUEST_FAILED_MESSAGE = '\u062d\u062f\u062b \u062e\u0637\u0623';

function readStoredToken() {
  if (typeof window === 'undefined') return null;

  try {
    const sessionToken = window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (sessionToken) {
      return sessionToken;
    }

    const legacyToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (legacyToken) {
      window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, legacyToken);
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      return legacyToken;
    }
  } catch {
    return null;
  }

  return null;
}

function persistToken(token) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage failures and continue with in-memory state.
  }
}

function clearStoredToken() {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage failures and continue clearing in-memory state.
  }
}

function buildRequestHeaders(token, options = {}) {
  const headers = new Headers(options.headers || {});
  const hasBody = options.body !== undefined && options.body !== null;

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (hasBody && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
}

async function parseApiResponse(res) {
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return res.json();
  }

  const text = await res.text();
  return text ? { message: text } : {};
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => readStoredToken());
  const [loading, setLoading] = useState(true);

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const verifySession = async () => {
      try {
        const res = await fetch(`${API}/auth/me`, {
          cache: 'no-store',
          credentials: 'same-origin',
          headers: buildRequestHeaders(token),
        });

        if (!res.ok) {
          throw new Error('UNAUTHORIZED');
        }

        const nextUser = await parseApiResponse(res);
        if (!cancelled) {
          setUser(nextUser);
        }
      } catch {
        if (!cancelled) {
          logout();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (username, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: buildRequestHeaders(null, {
        body: true,
      }),
      body: JSON.stringify({ username, password }),
    });

    const data = await parseApiResponse(res);
    if (!res.ok) {
      throw new Error(data?.error || REQUEST_FAILED_MESSAGE);
    }

    if (typeof data?.token !== 'string' || !data.token.trim()) {
      throw new Error(REQUEST_FAILED_MESSAGE);
    }

    persistToken(data.token);
    setToken(data.token);
    setUser(data.user || null);
    return data;
  };

  const api = async (url, options = {}) => {
    if (!token) {
      logout();
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }

    const res = await fetch(`${API}${url}`, {
      cache: 'no-store',
      credentials: 'same-origin',
      ...options,
      headers: buildRequestHeaders(token, options),
    });

    if (res.status === 401) {
      logout();
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }

    const data = await parseApiResponse(res);
    if (!res.ok) {
      throw new Error(data?.error || data?.message || REQUEST_FAILED_MESSAGE);
    }

    return data;
  };

  const role = user?.Role || user?.role || 'user';
  const permissions = user?.permissions || [];
  const isAdmin = role === 'admin';
  const hasPerm = (perm) => isAdmin || permissions.includes(perm);

  const can = {
    viewPort1: hasPerm('port-1'),
    viewPort2: hasPerm('port-2'),
    viewPort3: hasPerm('port-3'),
    viewTransport: hasPerm('transport'),
    viewPartnership: hasPerm('partnership'),
    viewFx: hasPerm('fx'),
    viewDebts: hasPerm('debts'),
    viewSpecial: hasPerm('special'),
    viewReports: hasPerm('reports'),
    addInvoice: hasPerm('add_invoice'),
    addPayment: hasPerm('add_payment'),
    editTransaction: hasPerm('edit_transaction'),
    deleteTransaction: hasPerm('delete_transaction'),
    export: hasPerm('export'),
    addTrader: hasPerm('add_trader'),
    manageDebts: hasPerm('manage_debts'),
    manageUsers: isAdmin,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, api, can, role, permissions, hasPerm }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

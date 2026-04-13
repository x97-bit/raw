import { createContext, useContext, useEffect, useRef, useState } from 'react';

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
  const refreshPromiseRef = useRef(null);
  const skipRefreshRef = useRef(false);

  const clearAuthState = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  const refreshSession = async () => {
    if (skipRefreshRef.current) {
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshRequest = (async () => {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
      });

      const data = await parseApiResponse(res);
      if (!res.ok || typeof data?.token !== 'string' || !data.token.trim()) {
        throw new Error(data?.error || SESSION_EXPIRED_MESSAGE);
      }

      skipRefreshRef.current = false;
      persistToken(data.token);
      setToken(data.token);
      setUser(data.user || null);
      return data.token;
    })();

    refreshPromiseRef.current = refreshRequest;

    try {
      return await refreshRequest;
    } finally {
      refreshPromiseRef.current = null;
    }
  };

  const performAuthenticatedFetch = async (url, options = {}, accessToken = null) => (
    fetch(`${API}${url}`, {
      cache: 'no-store',
      credentials: 'same-origin',
      ...options,
      headers: buildRequestHeaders(accessToken, options),
    })
  );

  const authFetch = async (url, options = {}, config = {}) => {
    const { retryOn401 = true, initialToken = token } = config;
    let activeToken = initialToken;

    if (!activeToken) {
      try {
        activeToken = await refreshSession();
      } catch {
        clearAuthState();
        throw new Error(SESSION_EXPIRED_MESSAGE);
      }
    }

    let res = await performAuthenticatedFetch(url, options, activeToken);

    if (res.status === 401 && retryOn401) {
      try {
        activeToken = await refreshSession();
      } catch {
        clearAuthState();
        throw new Error(SESSION_EXPIRED_MESSAGE);
      }

      res = await performAuthenticatedFetch(url, options, activeToken);
      if (res.status === 401) {
        clearAuthState();
        throw new Error(SESSION_EXPIRED_MESSAGE);
      }
    }

    return res;
  };

  const logout = async () => {
    skipRefreshRef.current = true;

    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
      });
    } catch {
      // Best effort; local auth state is still cleared below.
    } finally {
      clearAuthState();
    }
  };

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      setLoading(true);

      try {
        let activeToken = token;

        if (!activeToken) {
          try {
            activeToken = await refreshSession();
          } catch {
            if (!cancelled) {
              clearAuthState();
            }
            return;
          }
        }

        const res = await authFetch('/auth/me', { method: 'GET' }, { initialToken: activeToken });
        const nextUser = await parseApiResponse(res);

        if (!cancelled) {
          setUser(nextUser);
        }
      } catch {
        if (!cancelled) {
          clearAuthState();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void verifySession();

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

    skipRefreshRef.current = false;
    persistToken(data.token);
    setToken(data.token);
    setUser(data.user || null);
    return data;
  };

  const api = async (url, options = {}) => {
    const res = await authFetch(url, options);
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
    <AuthContext.Provider value={{ user, token, loading, login, logout, api, authFetch, can, role, permissions, hasPerm }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

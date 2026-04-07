import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API = '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(u => { setUser(u); setLoading(false); })
        .catch(() => { logout(); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const api = async (url, options = {}) => {
    const res = await fetch(`${API}${url}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers }
    });
    if (res.status === 401) { logout(); throw new Error('انتهت الجلسة'); }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حدث خطأ');
    return data;
  };

  // Role and permissions
  const role = user?.Role || user?.role || 'user';
  const permissions = user?.permissions || [];
  const isAdmin = role === 'admin';

  // Permission check helper - admin has all permissions
  const hasPerm = (perm) => isAdmin || permissions.includes(perm);

  // Convenience permission object
  const can = {
    // Sections
    viewPort1: hasPerm('port-1'),
    viewPort2: hasPerm('port-2'),
    viewPort3: hasPerm('port-3'),
    viewTransport: hasPerm('transport'),
    viewPartnership: hasPerm('partnership'),
    viewFx: hasPerm('fx'),
    viewDebts: hasPerm('debts'),
    viewSpecial: hasPerm('special'),
    viewReports: hasPerm('reports'),
    // Actions
    addInvoice: hasPerm('add_invoice'),
    addPayment: hasPerm('add_payment'),
    editTransaction: hasPerm('edit_transaction'),
    deleteTransaction: hasPerm('delete_transaction'),
    export: hasPerm('export'),
    addTrader: hasPerm('add_trader'),
    manageDebts: hasPerm('manage_debts'),
    // Role-based
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

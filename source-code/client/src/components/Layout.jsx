import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Home, FileText, Truck, Users, DollarSign, BarChart3, Settings, LogOut, Menu, X, ChevronDown, Building2, Handshake, ArrowLeftRight, CreditCard } from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'الرئيسية', icon: Home },
  { id: 'ports', label: 'المنافذ', icon: Building2, children: [
    { id: 'port-1', label: 'السعودية', portId: 1 },
    { id: 'port-2', label: 'المنذرية', portId: 2 },
    { id: 'port-3', label: 'القائم', portId: 3 },
  ]},
  { id: 'transport', label: 'النقل', icon: Truck },
  { id: 'partnership', label: 'الشراكة', icon: Handshake },
  { id: 'debts', label: 'الديون', icon: CreditCard },
  { id: 'accounts', label: 'الحسابات', icon: Users },
  { id: 'fx', label: 'الصيرفة', icon: ArrowLeftRight },
  { id: 'reports', label: 'التقارير', icon: BarChart3 },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export default function Layout({ currentPage, setCurrentPage, children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState(null);

  const roleLabels = { admin: 'مدير النظام', manager: 'مدير', user: 'مستخدم', viewer: 'مشاهد' };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-primary-900 text-white flex flex-col transition-all duration-300 no-print`}>
        {/* Logo */}
        <div className="p-4 border-b border-primary-700 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold">نظام الراوي</h1>
              <p className="text-xs text-primary-300 mt-1">إدارة التجارة الحدودية</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-primary-700 rounded-lg">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.children && item.children.some(c => currentPage === c.id));

            if (item.children) {
              return (
                <div key={item.id}>
                  <button
                    onClick={() => setExpandedMenu(expandedMenu === item.id ? null : item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-primary-700' : 'hover:bg-primary-800'}`}
                  >
                    <Icon size={20} />
                    {sidebarOpen && <span className="flex-1 text-right">{item.label}</span>}
                    {sidebarOpen && <ChevronDown size={16} className={`transition-transform ${expandedMenu === item.id ? 'rotate-180' : ''}`} />}
                  </button>
                  {sidebarOpen && expandedMenu === item.id && (
                    <div className="mr-6 mt-1 space-y-1">
                      {item.children.map(child => (
                        <button key={child.id} onClick={() => setCurrentPage(child.id)}
                          className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-all ${currentPage === child.id ? 'bg-primary-600 text-white' : 'text-primary-300 hover:bg-primary-800 hover:text-white'}`}>
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button key={item.id} onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-primary-700' : 'hover:bg-primary-800'}`}>
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-primary-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center font-bold text-sm">
              {user?.FullName?.[0] || user?.fullName?.[0] || 'م'}
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.FullName || user?.fullName}</p>
                <p className="text-xs text-primary-400">{roleLabels[user?.Role || user?.role]}</p>
              </div>
            )}
            <button onClick={logout} className="p-2 hover:bg-primary-700 rounded-lg" title="تسجيل الخروج">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

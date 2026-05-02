import { useState, useEffect } from "react";
import { useMerchantAuth, useMerchantNavigation } from "./merchantContext";
import ThemeToggleButton from "../../components/ThemeToggleButton";
import {
  LogOut, User, LayoutDashboard, FileText, CreditCard,
  Receipt, Bell, MessageCircle, Menu, X, ChevronLeft,
  PanelLeftClose, PanelLeftOpen, Shield, Sun, Moon
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { id: "statement", label: "كشف الحساب", icon: FileText },
  { id: "invoices", label: "الفواتير", icon: Receipt },
  { id: "payments", label: "المدفوعات", icon: CreditCard },
  { id: "notifications", label: "الإشعارات", icon: Bell },
  { id: "support", label: "التواصل", icon: MessageCircle },
];

const SIDEBAR_COLLAPSED_KEY = "merchant_sidebar_collapsed";

export default function MerchantAppShell({ children }) {
  const { logout, user } = useMerchantAuth();
  const { currentPage, navigateTo } = useMerchantNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true"; }
    catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed)); } catch {}
  }, [collapsed]);

  const sidebarWidth = collapsed ? "w-[56px]" : "w-52";
  const mainMargin = collapsed ? "lg:mr-[56px]" : "lg:mr-52";

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground flex font-['Cairo','Tajawal',sans-serif]" dir="rtl">

      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex flex-col ${sidebarWidth} bg-sidebar border-l border-sidebar-border fixed right-0 top-0 bottom-0 z-40 transition-all duration-200 ease-out`}>
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? "justify-center py-3 px-1" : "gap-2 px-3 py-3"} border-b border-sidebar-border`}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="text-primary-foreground" size={16} />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold text-sidebar-foreground truncate">بوابة التجار</span>
          )}
        </div>

        {/* User */}
        <div className={`flex items-center ${collapsed ? "justify-center py-2" : "gap-2 px-3 py-2"} border-b border-sidebar-border`}>
          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={13} className="text-primary" />
          </div>
          {!collapsed && (
            <span className="text-xs font-semibold text-sidebar-foreground truncate">{user?.fullName || user?.name || user?.username}</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-1.5 py-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center ${collapsed ? "justify-center px-0" : "gap-2.5 px-2.5"} py-2 rounded-lg text-right transition-all duration-150 ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon size={17} className="flex-shrink-0" />
                {!collapsed && <span className="text-[13px] font-semibold truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-1.5 py-1.5 border-t border-sidebar-border space-y-0.5">
          <ThemeToggleButton compact={collapsed} className={`w-full ${collapsed ? "justify-center" : "justify-center"}`} />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-150"
            title={collapsed ? "توسيع" : "طي"}
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            {!collapsed && <span className="text-[11px] font-medium">طي</span>}
          </button>
          <button
            onClick={logout}
            title={collapsed ? "خروج" : undefined}
            className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-2 px-2.5"} py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-150`}
          >
            <LogOut size={15} className="flex-shrink-0" />
            {!collapsed && <span className="text-[12px] font-semibold">خروج</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-md border-b border-sidebar-border">
        <div className="flex justify-between items-center h-11 px-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="text-primary-foreground" size={14} />
            </div>
            <span className="text-sm font-bold text-sidebar-foreground">بوابة التجار</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-foreground"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-sidebar border-b border-sidebar-border shadow-lg">
            <div className="p-2 space-y-0.5">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { navigateTo(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-right transition-all ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </button>
                );
              })}
              <div className="border-t border-sidebar-border mt-1 pt-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={16} />
                  <span className="text-sm font-semibold">خروج</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${mainMargin} pt-11 lg:pt-0 h-screen overflow-y-auto transition-all duration-200 ease-out`}>
        <div className="p-3 sm:p-4 lg:p-5 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

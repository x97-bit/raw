import { Home, LogOut, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppShell } from '../contexts/AppShellContext';
import { getVisibleMainSectionGroups } from '../features/navigation/sectionCatalog';
import BrandLogo from './BrandLogo';

function SidebarNavButton({
  active = false,
  collapsed = false,
  icon: Icon,
  label,
  accent,
  onClick,
}) {
  const accentColor = accent || '#648ea9';

  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group relative flex w-full items-center overflow-hidden rounded-[22px] px-3 py-3 text-right transition-all duration-200 ${
        collapsed ? 'justify-center' : 'gap-3.5'
      }`}
      style={{
        background: active
          ? 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
          : 'rgba(255,255,255,0)',
        boxShadow: active ? '0 16px 30px rgba(0,0,0,0.26)' : 'none',
      }}
    >
      <span
        className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accentColor}14 100%)`,
        }}
      />

      {active && (
        <span
          className="pointer-events-none absolute inset-y-2 right-1.5 w-[3px] rounded-full"
          style={{ background: accentColor }}
        />
      )}

      <span
        className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] transition-all duration-200 group-hover:scale-[1.03]"
        style={{
          color: active ? '#f4f8fb' : '#ced9e3',
          background: active ? `${accentColor}20` : 'rgba(255,255,255,0.06)',
          boxShadow: active ? `0 12px 24px ${accentColor}14` : '0 8px 16px rgba(0,0,0,0.16)',
        }}
      >
        <Icon size={18} strokeWidth={1.9} />
      </span>

      {!collapsed && (
        <span className="relative z-10 min-w-0 flex-1 text-right">
          <span className={`block truncate text-[13.5px] font-extrabold ${active ? 'text-white' : 'text-[#ced9e3]'}`}>
            {label}
          </span>
        </span>
      )}
    </button>
  );
}

export default function AppSidebar({ activeItemId, onSelectItem, onGoHome, onProfileClick }) {
  const { user, logout, hasPerm, can } = useAuth();
  const { isDesktop, sidebarCollapsed, mobileSidebarOpen, closeSidebar } = useAppShell();

  const visibleGroups = useMemo(
    () => getVisibleMainSectionGroups(hasPerm, can.manageUsers),
    [can.manageUsers, hasPerm]
  );

  const sidebarCollapsedState = isDesktop ? sidebarCollapsed : false;
  const sidebarWidth = sidebarCollapsedState ? 88 : 288;
  const displayName = user?.fullName || user?.FullName || 'المستخدم';
  const roleLabel = user?.role === 'admin' || user?.Role === 'admin' ? 'مدير النظام' : 'مستخدم';

  const profileTitle = can.manageUsers ? 'إدارة المستخدمين' : 'ملفي الشخصي';
  const profileActive = !can.manageUsers && activeItemId === 'profile';

  useEffect(() => {
    closeSidebar();
  }, [activeItemId, closeSidebar]);

  return (
    <>
      {!isDesktop && mobileSidebarOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة الجانبية"
          className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-[2px] no-print"
          onClick={closeSidebar}
        />
      )}

      <aside
        className="fixed inset-y-0 right-0 z-[70] flex flex-col overflow-hidden no-print"
        style={{
          width: sidebarWidth,
          transform: isDesktop || mobileSidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1), width 240ms cubic-bezier(0.22, 1, 0.36, 1)',
          background: 'linear-gradient(180deg, #0c1117 0%, #101720 52%, #141c26 100%)',
          boxShadow: '0 26px 58px rgba(0,0,0,0.32)',
        }}
      >
        <div className="relative overflow-hidden px-4 py-5">
          <div className="pointer-events-none absolute -left-10 top-0 h-28 w-28 animate-ambient-drift rounded-full bg-[radial-gradient(circle,rgba(100,142,169,0.14),transparent_72%)]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 animate-glow-pulse rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_72%)]" />

          <div className={`relative z-10 flex items-center ${sidebarCollapsedState ? 'justify-center' : 'justify-between'} gap-3`}>
            <button
              type="button"
              onClick={onGoHome}
              title="الرئيسية"
              className={`flex min-w-0 items-center text-right transition-all duration-200 hover:opacity-100 ${sidebarCollapsedState ? 'justify-center' : 'gap-3'}`}
            >
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-white/8 shadow-[0_18px_32px_rgba(0,0,0,0.2)]">
                <BrandLogo className="h-11 w-11 animate-logo-float" />
              </div>

              {!sidebarCollapsedState && (
                <div className="min-w-0 text-right">
                  <div className="truncate text-[15px] font-black tracking-tight text-white">Tay Alrawi</div>
                  <div className="truncate text-[11px] font-medium text-[#8592a0]">النقل والتخليص الكمركي</div>
                </div>
              )}
            </button>

            {!isDesktop && (
              <button
                onClick={closeSidebar}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-slate-200 transition-colors hover:bg-white/12 hover:text-white"
                title="إغلاق القائمة"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-3">
            <SidebarNavButton
              active={activeItemId === 'main'}
              collapsed={sidebarCollapsedState}
              icon={Home}
              label="الرئيسية"
              accent="#648ea9"
              onClick={onGoHome}
            />

            {visibleGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                {!sidebarCollapsedState && (
                  <div className="px-2 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="h-px flex-1 bg-white/8" />
                      <span className="text-[10px] font-black tracking-[0.14em] text-[#6f7b88]">
                        {group.title}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarNavButton
                      key={item.id}
                      active={activeItemId === item.id}
                      collapsed={sidebarCollapsedState}
                      icon={item.icon}
                      label={item.label}
                      accent={item.accent}
                      onClick={() => onSelectItem(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-3 py-3">
          <button
            type="button"
            onClick={onProfileClick}
            title={sidebarCollapsedState ? profileTitle : undefined}
            className={`mb-3 flex w-full items-center ${sidebarCollapsedState ? 'justify-center' : 'gap-3'} rounded-[22px] px-3 py-3 text-right transition-all duration-200 ${
              profileActive
                ? 'bg-white/10 shadow-[0_16px_30px_rgba(0,0,0,0.24)]'
                : 'bg-white/6 shadow-[0_12px_22px_rgba(0,0,0,0.16)] hover:bg-white/10'
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-white/10 text-sm font-black text-white">
              {displayName.trim().charAt(0) || 'م'}
            </div>
            {!sidebarCollapsedState && (
              <div className="min-w-0 flex-1 text-right">
                <div className="truncate text-[12.5px] font-bold text-white">{displayName}</div>
                <div className="truncate text-[10.5px] font-medium text-[#8592a0]">{roleLabel}</div>
              </div>
            )}
          </button>

          <button
            onClick={logout}
            title={sidebarCollapsedState ? 'تسجيل الخروج' : undefined}
            className={`flex w-full items-center rounded-[18px] bg-white/6 px-3 py-2.5 text-[#edf2f7] transition-colors hover:bg-white/10 ${
              sidebarCollapsedState ? 'justify-center' : 'gap-3'
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-[#b76169]/16 text-[#f2d6d9] shadow-[0_8px_18px_rgba(183,97,105,0.12)]">
              <LogOut size={18} />
            </span>
            {!sidebarCollapsedState && <span className="text-[13px] font-extrabold">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

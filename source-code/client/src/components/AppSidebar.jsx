import { Home, LogOut, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAppShell } from "../contexts/AppShellContext";
import { getVisibleMainSectionGroups } from "../features/navigation/sectionCatalog";
import BrandLogo from "./BrandLogo";
import PortIconBadge from "./PortIconBadge";
import ThemeToggleButton from "./ThemeToggleButton";

function SidebarNavButton({
  active = false,
  collapsed = false,
  icon: Icon,
  iconLabel,
  label,
  accent,
  onClick,
}) {
  const accentColor = accent || "#648ea9";
  const hasIconLabel = Array.isArray(iconLabel) && iconLabel.length > 0;

  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group relative flex w-full items-center overflow-hidden rounded-2xl px-2.5 py-2.5 text-right transition-all duration-200 ${
        collapsed ? "justify-center" : "gap-3"
      }`}
      style={{
        background: active ? "var(--sidebar-nav-active-bg)" : "transparent",
        boxShadow: active ? "var(--sidebar-nav-active-shadow)" : "none",
      }}
    >
      <span
        className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
          active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accentColor}14 100%)`,
        }}
      />

      {active && (
        <span
          className="pointer-events-none absolute inset-y-2 right-1 w-[2.5px] rounded-full"
          style={{ background: accentColor }}
        />
      )}

      {hasIconLabel ? (
        <PortIconBadge
          lines={iconLabel}
          accent={accentColor}
          background={
            active ? `${accentColor}18` : "var(--sidebar-nav-icon-bg)"
          }
          textColor={
            active
              ? "var(--sidebar-nav-icon-active)"
              : "var(--sidebar-nav-icon-inactive)"
          }
          borderColor={active ? `${accentColor}3b` : "rgba(255,255,255,0.08)"}
          className={`relative z-10 shrink-0 transition-all duration-300 group-hover:scale-[1.05] ${
            collapsed
              ? "h-8 min-w-[3.4rem] px-1.5 text-[6.5px]"
              : "h-9 min-w-[4.5rem] px-1.5 text-[7.5px]"
          }`}
        />
      ) : (
        <span
          className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-[1.05] ${active ? "ring-1 ring-inset" : "border border-transparent"}`}
          style={{
            color: active
              ? "var(--sidebar-nav-icon-active)"
              : "var(--sidebar-nav-icon-inactive)",
            background: active
              ? `linear-gradient(135deg, ${accentColor}25 0%, ${accentColor}10 100%)`
              : "var(--sidebar-nav-icon-bg)",
            boxShadow: active
              ? `var(--sidebar-nav-icon-shadow-active), inset 0 2px 4px ${accentColor}15`
              : "var(--sidebar-nav-icon-shadow)",
            borderColor: active ? `${accentColor}40` : "var(--sidebar-border)",
            "--tw-ring-color": active ? `${accentColor}30` : "transparent",
          }}
        >
          <Icon size={17} strokeWidth={1.6} className="transition-transform duration-300 group-hover:-rotate-2" />
        </span>
      )}

      {!collapsed && (
        <span className="relative z-10 min-w-0 flex-1 text-right">
          <span
            className="block truncate text-[12.5px] font-extrabold"
            style={{
              color: active
                ? "var(--sidebar-nav-label-active)"
                : "var(--sidebar-nav-label)",
            }}
          >
            {label}
          </span>
        </span>
      )}
    </button>
  );
}

export default function AppSidebar({
  activeItemId,
  onSelectItem,
  onGoHome,
  onProfileClick,
}) {
  const { user, logout, hasPerm, can } = useAuth();
  const { isDesktop, sidebarCollapsed, mobileSidebarOpen, closeSidebar } =
    useAppShell();

  const visibleGroups = useMemo(
    () => getVisibleMainSectionGroups(hasPerm, can.manageUsers),
    [can.manageUsers, hasPerm]
  );

  const sidebarCollapsedState = isDesktop ? sidebarCollapsed : false;
  const sidebarWidth = sidebarCollapsedState ? 76 : 260;
  const displayName = user?.fullName || user?.FullName || "المستخدم";
  const roleLabel =
    user?.role === "admin" || user?.Role === "admin" ? "مدير النظام" : "مستخدم";
  const profileTitle = can.manageUsers ? "إدارة المستخدمين" : "ملفي الشخصي";
  const profileActive = !can.manageUsers && activeItemId === "profile";

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
          transform:
            isDesktop || mobileSidebarOpen
              ? "translateX(0)"
              : "translateX(100%)",
          transition:
            "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), width 240ms cubic-bezier(0.22, 1, 0.36, 1)",
          background: "var(--sidebar-bg)",
          boxShadow: "var(--sidebar-shadow)",
        }}
      >
        {/* Header */}
        <div className="relative overflow-hidden px-3 py-3.5">
          <div className="pointer-events-none absolute -left-10 top-0 h-24 w-24 animate-ambient-drift rounded-full bg-[radial-gradient(circle,rgba(100,142,169,0.12),transparent_72%)]" />
          <div
            className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 animate-glow-pulse rounded-full"
            style={{ background: "var(--sidebar-glow)" }}
          />

          <div
            className={`relative z-10 flex items-center ${sidebarCollapsedState ? "justify-center" : "justify-between"} gap-2`}
          >
            <button
              type="button"
              onClick={onGoHome}
              title="الرئيسية"
              className={`flex min-w-0 items-center text-right transition-all duration-200 hover:opacity-100 ${sidebarCollapsedState ? "justify-center" : "gap-2.5"}`}
            >
              <div
                className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
                style={{
                  background: "var(--sidebar-soft-bg)",
                  boxShadow: "var(--sidebar-soft-shadow)",
                }}
              >
                <BrandLogo className="h-8 w-8 animate-logo-float" />
              </div>

              {!sidebarCollapsedState && (
                <div className="min-w-0 text-right">
                  <div
                    className="truncate text-[13px] font-black tracking-tight"
                    style={{ color: "var(--sidebar-title)" }}
                  >
                    Tay Alrawi
                  </div>
                  <div
                    className="truncate text-[10px] font-medium"
                    style={{ color: "var(--sidebar-muted)" }}
                  >
                    النقل والتخليص الكمركي
                  </div>
                </div>
              )}
            </button>

            {!isDesktop && (
              <button
                onClick={closeSidebar}
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
                style={{
                  background: "var(--sidebar-soft-bg)",
                  color: "var(--sidebar-title)",
                }}
                title="إغلاق القائمة"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 scrollbar-thin">
          <div className="space-y-2">
            <SidebarNavButton
              active={activeItemId === "main"}
              collapsed={sidebarCollapsedState}
              icon={Home}
              label="الرئيسية"
              accent="#648ea9"
              onClick={onGoHome}
            />

            {visibleGroups.map(group => (
              <div key={group.title} className="space-y-1">
                {!sidebarCollapsedState && (
                  <div className="px-2 pt-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-px flex-1"
                        style={{ background: "var(--sidebar-separator)" }}
                      />
                      <span
                        className="text-[9px] font-black tracking-[0.12em] uppercase"
                        style={{ color: "var(--sidebar-group-label)" }}
                      >
                        {group.title}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-0.5">
                  {group.items.map(item => (
                    <SidebarNavButton
                      key={item.id}
                      active={activeItemId === item.id}
                      collapsed={sidebarCollapsedState}
                      icon={item.icon}
                      iconLabel={item.iconLines}
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

        {/* Footer */}
        <div className="px-2.5 py-2.5 space-y-2">
          <ThemeToggleButton
            compact={sidebarCollapsedState}
            className={
              sidebarCollapsedState
                ? "w-full justify-center"
                : "w-full justify-center sm:justify-between"
            }
          />

          {/* Profile Button */}
          <button
            type="button"
            onClick={onProfileClick}
            title={sidebarCollapsedState ? profileTitle : undefined}
            className={`flex w-full items-center ${sidebarCollapsedState ? "justify-center" : "gap-2.5"} rounded-2xl px-2.5 py-2.5 text-right transition-all duration-200`}
            style={{
              background: profileActive
                ? "var(--sidebar-profile-active-bg)"
                : "var(--sidebar-profile-bg)",
              boxShadow: profileActive
                ? "var(--sidebar-profile-active-shadow)"
                : "var(--sidebar-profile-shadow)",
            }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-black"
              style={{
                background: "var(--sidebar-avatar-bg)",
                color: "var(--sidebar-avatar-text)",
              }}
            >
              {displayName.trim().charAt(0) || "م"}
            </div>
            {!sidebarCollapsedState && (
              <div className="min-w-0 flex-1 text-right">
                <div
                  className="truncate text-[11.5px] font-bold"
                  style={{ color: "var(--sidebar-title)" }}
                >
                  {displayName}
                </div>
                <div
                  className="truncate text-[9.5px] font-medium"
                  style={{ color: "var(--sidebar-muted)" }}
                >
                  {roleLabel}
                </div>
              </div>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            title={sidebarCollapsedState ? "تسجيل الخروج" : undefined}
            className={`flex w-full items-center rounded-xl px-2.5 py-2 transition-colors ${
              sidebarCollapsedState ? "justify-center" : "gap-2.5"
            }`}
            style={{
              background: "var(--sidebar-profile-bg)",
              color: "var(--sidebar-title)",
            }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{
                background: "var(--sidebar-logout-bg)",
                color: "var(--sidebar-logout-text)",
                boxShadow: "var(--sidebar-logout-shadow)",
              }}
            >
              <LogOut size={15} />
            </span>
            {!sidebarCollapsedState && (
              <span className="text-[11.5px] font-extrabold">تسجيل الخروج</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

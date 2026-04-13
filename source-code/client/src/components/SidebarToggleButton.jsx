import { Menu, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useAppShell } from '../contexts/AppShellContext';

function resolveButtonState({ isDesktop, sidebarCollapsed }) {
  if (!isDesktop) {
    return {
      label: 'القائمة',
      title: 'فتح القائمة الجانبية',
      Icon: Menu,
    };
  }

  if (sidebarCollapsed) {
    return {
      label: 'إظهار',
      title: 'إظهار القائمة الجانبية',
      Icon: PanelRightOpen,
    };
  }

  return {
    label: 'إخفاء',
    title: 'إخفاء القائمة الجانبية',
    Icon: PanelRightClose,
  };
}

export default function SidebarToggleButton({ compact = false }) {
  const { hasSidebar, isDesktop, sidebarCollapsed, toggleSidebar } = useAppShell();

  if (!hasSidebar) {
    return null;
  }

  const { label, title, Icon } = resolveButtonState({ isDesktop, sidebarCollapsed });

  return (
    <button
      onClick={toggleSidebar}
      title={title}
      aria-label={title}
      className={`sidebar-toggle group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
        compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
      }`}
    >
      <span
        className="pointer-events-none absolute inset-x-3 bottom-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, var(--sidebar-toggle-accent) 50%, transparent 100%)' }}
      />

      <span className={`relative z-10 flex items-center ${compact ? 'justify-center' : 'gap-2.5'}`}>
        <span className="sidebar-toggle__icon">
          <Icon size={16} className="text-current" />
        </span>
        {!compact && <span className="sidebar-toggle__label">{label}</span>}
      </span>
    </button>
  );
}

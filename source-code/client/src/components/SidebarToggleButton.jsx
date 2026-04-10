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
      className={`group relative overflow-hidden rounded-[20px] text-white shadow-[0_16px_30px_rgba(0,0,0,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(0,0,0,0.28)] ${
        compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
      }`}
      style={{
        background: 'linear-gradient(180deg, rgba(14,19,25,0.96) 0%, rgba(22,29,38,0.94) 100%)',
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-3 bottom-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(100,142,169,0.4) 50%, transparent 100%)' }}
      />

      <span className={`relative z-10 flex items-center ${compact ? 'justify-center' : 'gap-2.5'}`}>
        <span className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-[#648ea9]/16 text-[#edf4f8]">
          <Icon size={16} className="text-current" />
        </span>
        {!compact && <span className="text-[12px] font-bold tracking-wide text-[#edf2f7]">{label}</span>}
      </span>
    </button>
  );
}

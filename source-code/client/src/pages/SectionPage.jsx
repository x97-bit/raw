import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { FileText, CreditCard, ClipboardList, Users } from 'lucide-react';

const sectionConfig = {
  'port-1': { title: 'منفذ السعودية', portId: 'port-1', type: 'port', accent: '#0967d2', actions: ['invoice', 'payment', 'statement'] },
  'port-2': { title: 'منفذ المنذرية', portId: 'port-2', type: 'port', accent: '#0891b2', actions: ['invoice', 'payment', 'statement'] },
  'port-3': { title: 'منفذ القائم', portId: 'port-3', type: 'port', accent: '#6d28d9', actions: ['invoice', 'payment', 'statement'] },
  'transport': { title: 'النقل', portId: 'transport-1', accountType: 2, type: 'transport', accent: '#b45309', actions: ['invoice', 'payment', 'statement', 'traders'] },
  'partnership': { title: 'الشراكة', portId: 'partnership-1', accountType: 5, type: 'partnership', accent: '#047857', actions: ['invoice', 'payment', 'statement', 'traders'] },
  'fx': { title: 'الصيرفة', portId: 'fx-1', accountType: 3, type: 'fx', accent: '#4338ca', actions: ['invoice', 'traders', 'statement'] },
};

const actionConfig = {
  invoice:   { label: 'إضافة له',     desc: 'تسجيل معاملة جديدة',     icon: FileText,    accent: '#0967d2', bg: '#eff6ff' },
  payment:   { label: 'إضافة عليه',   desc: 'تسجيل عملية تسديد',       icon: CreditCard,  accent: '#047857', bg: '#f0fdf4' },
  statement: { label: 'كشف حساب',     desc: 'عرض كشف الحساب',          icon: ClipboardList, accent: '#b45309', bg: '#fffbeb' },
  traders:   { label: 'التجار',        desc: 'إدارة قائمة التجار',       icon: Users,       accent: '#6d28d9', bg: '#f5f3ff' },
};

function ActionCard({ action, onClick, index }) {
  const ac = actionConfig[action];
  const Icon = ac.icon;

  return (
    <button
      key={action}
      onClick={onClick}
      className="group relative w-full rounded-2xl overflow-hidden text-center"
      style={{
        animation: `sectionCardIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both`,
        animationDelay: `${index * 70}ms`,
        background: 'white',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 2px 6px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.25s cubic-bezier(0.22,1,0.36,1), transform 0.25s cubic-bezier(0.22,1,0.36,1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 0 0 1.5px ${ac.accent}30, 0 6px 24px rgba(0,0,0,0.08), 0 20px 48px rgba(0,0,0,0.07)`;
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.05), 0 2px 6px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 right-0 left-0 h-[3px] opacity-0 group-hover:opacity-100 transition-all duration-300"
        style={{ background: `linear-gradient(90deg, transparent 5%, ${ac.accent}90 50%, transparent 95%)` }}
      />

      <div className="relative px-5 py-9 flex flex-col items-center gap-4">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-350 group-hover:scale-110 group-hover:rotate-[-3deg]"
          style={{
            background: ac.bg,
            color: ac.accent,
            boxShadow: `0 4px 16px ${ac.accent}18, 0 2px 6px ${ac.accent}10`,
          }}>
          <Icon size={28} strokeWidth={1.7} />
        </div>

        {/* Text */}
        <div>
          <span className="text-[15px] font-bold text-gray-800 block leading-tight">{ac.label}</span>
          <span className="text-[11.5px] text-gray-400 mt-1.5 block leading-snug">{ac.desc}</span>
        </div>
      </div>

      {/* Bottom fade on hover */}
      <div
        className="absolute bottom-0 right-0 left-0 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${ac.accent}06, transparent)` }}
      />
    </button>
  );
}

export default function SectionPage({ sectionId, onBack, onAction }) {
  const { hasPerm } = useAuth();
  const config = sectionConfig[sectionId];
  if (!config) return null;

  const visibleActions = config.actions.filter(action => {
    const ac = actionConfig[action];
    return !ac.perm || hasPerm(ac.perm);
  });

  return (
    <div className="page-shell flex flex-col">
      <PageHeader title={config.title} subtitle="اختر العملية المطلوبة" onBack={onBack} accentColor={config.accent} />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className={`grid gap-4 w-full max-w-3xl ${
          visibleActions.length === 1 ? 'max-w-xs grid-cols-1' :
          visibleActions.length === 2 ? 'max-w-sm grid-cols-2' :
          visibleActions.length === 3 ? 'max-w-2xl grid-cols-3' :
          'grid-cols-2 lg:grid-cols-4'
        }`}>
          {visibleActions.map((action, i) => (
            <ActionCard
              key={action}
              action={action}
              onClick={() => onAction(sectionId, action, config)}
              index={i}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes sectionCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export { sectionConfig };

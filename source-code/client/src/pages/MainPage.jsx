import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LogOut, Truck, Handshake, Landmark, CreditCard, BarChart3,
  Wallet, Users, Link2, Scale, Settings2, Receipt, ChevronLeft,
  MapPin, Globe, Building2, ShieldCheck,
} from 'lucide-react';

const sectionGroups = [
  {
    title: 'المنافذ',
    subtitle: 'الوصول السريع للمنافذ الرئيسية',
    accent: '#0967d2',
    items: [
      { id: 'port-1', perm: 'port-1', label: 'السعودية', icon: Globe, accent: '#0967d2', bg: '#eff6ff' },
      { id: 'port-2', perm: 'port-2', label: 'المنذرية', icon: MapPin, accent: '#0891b2', bg: '#ecfeff' },
      { id: 'port-3', perm: 'port-3', label: 'القائم', icon: Building2, accent: '#6d28d9', bg: '#f5f3ff' },
    ],
  },
  {
    title: 'النقل والشراكة',
    subtitle: 'العمليات اللوجستية والشراكات',
    accent: '#b45309',
    items: [
      { id: 'transport', perm: 'transport', label: 'النقل', icon: Truck, accent: '#b45309', bg: '#fffbeb' },
      { id: 'partnership', perm: 'partnership', label: 'الشراكة', icon: Handshake, accent: '#047857', bg: '#f0fdf4' },
    ],
  },
  {
    title: 'الحسابات',
    subtitle: 'الديون والمصاريف والحسابات الخاصة',
    accent: '#be123c',
    items: [
      { id: 'debts', perm: 'debts', label: 'الديون', icon: CreditCard, accent: '#be123c', bg: '#fff1f2' },
      { id: 'expenses', perm: 'debts', label: 'المصاريف', icon: Receipt, accent: '#c2410c', bg: '#fff7ed' },
      { id: 'special', perm: 'special', label: 'حسابات خاصة', icon: Wallet, accent: '#0d9488', bg: '#f0fdfa' },
      { id: 'fx', perm: 'fx', label: 'الصيرفة', icon: Landmark, accent: '#4338ca', bg: '#eef2ff' },
      { id: 'payment-matching', perm: 'reports', label: 'ربط التسديد', icon: Link2, accent: '#a21caf', bg: '#fdf4ff' },
    ],
  },
  {
    title: 'التقارير والمراجعة',
    subtitle: 'التقارير ولوحات المطابقة والمراجعة',
    accent: '#6d28d9',
    items: [
      { id: 'reports', perm: 'reports', label: 'التقارير', icon: BarChart3, accent: '#6d28d9', bg: '#f5f3ff' },
      { id: 'trial-balance', perm: 'reports', label: 'ميزان المراجعة', icon: Scale, accent: '#0369a1', bg: '#f0f9ff' },
    ],
  },
];

function getItemGridClass(count) {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
  if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
}

function DashCard({ item, onClick, index }) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-[22px] border border-slate-200/85 bg-white px-3.5 py-3.5 text-right transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_28px_rgba(15,23,42,0.07)]"
      style={{
        animation: 'cardIn 0.34s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${index * 40}ms`,
        boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 8px 20px rgba(15,23,42,0.045)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px]"
          style={{
            background: item.bg,
            color: item.accent,
            boxShadow: `0 8px 20px ${item.accent}14`,
          }}
        >
          <Icon size={20} strokeWidth={1.9} />
        </div>

        <ChevronLeft
          size={16}
          className="mt-1 shrink-0 text-slate-300 transition-transform duration-200 group-hover:-translate-x-0.5"
          style={{ color: `${item.accent}88` }}
        />
      </div>

      <div className="mt-4 text-right">
        <h3 className="text-[14px] font-bold tracking-tight text-slate-800">{item.label}</h3>
        <p className="mt-1 text-[11px] font-medium text-slate-500">فتح القسم</p>
      </div>
    </button>
  );
}

function GroupSection({ group, onNavigate, startIndex, sectionIndex }) {
  return (
    <section
      className="rounded-[26px] border border-slate-200/75 bg-white/92 p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_14px_32px_rgba(15,23,42,0.045)]"
      style={{
        animation: 'sectionIn 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${sectionIndex * 50}ms`,
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
        <span
          className="inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
          style={{
            background: `${group.accent}12`,
            color: group.accent,
          }}
        >
          {group.items.length} تبويب
        </span>

        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: group.accent }} />
            <h2 className="text-[15px] font-bold tracking-tight text-slate-900">{group.title}</h2>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-500">{group.subtitle}</p>
        </div>
      </div>

      <div className={`grid gap-2.5 ${getItemGridClass(group.items.length)}`}>
        {group.items.map((item, itemIndex) => (
          <DashCard
            key={item.id}
            item={item}
            onClick={() => onNavigate(item.id)}
            index={startIndex + itemIndex}
          />
        ))}
      </div>
    </section>
  );
}

export default function MainPage({ onNavigate }) {
  const { user, logout, hasPerm, can } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const dateStr = new Date().toLocaleDateString('ar-IQ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const visibleGroups = useMemo(() => {
    const groups = sectionGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => hasPerm(item.perm)),
      }))
      .filter((group) => group.items.length > 0);

    if (can.manageUsers) {
      groups.push({
        title: 'إدارة النظام',
        subtitle: 'المستخدمون وإدارة الحقول',
        accent: '#0f766e',
        items: [
          { id: 'users', label: 'المستخدمون', icon: Users, accent: '#475569', bg: '#f8fafc' },
          { id: 'field-management', label: 'إدارة الحقول', icon: Settings2, accent: '#0f766e', bg: '#f0fdfa' },
        ],
      });
    }

    return groups;
  }, [can.manageUsers, hasPerm]);

  const displayName = user?.fullName || user?.FullName || 'المستخدم';
  const firstLetter = displayName?.trim()?.[0] || 'م';
  let cardIndex = 0;

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(180deg, #f4f7fb 0%, #edf2f7 100%)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.35s ease',
      }}
    >
      <header
        className="border-b border-slate-200/70 text-white"
        style={{
          background: 'linear-gradient(145deg, #0f2744 0%, #16324f 55%, #1b3a5b 100%)',
          boxShadow: '0 8px 30px rgba(15,39,68,0.18)',
        }}
      >
        <div className="mx-auto max-w-[1380px] px-4 py-2.5 sm:px-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-right">
              <h1 className="text-[20px] font-black tracking-tight text-white sm:text-[22px]">نظام الراوي</h1>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <div className="flex items-center gap-2.5 rounded-[20px] border border-white/10 bg-white/8 px-3 py-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, rgba(9,103,210,0.6), rgba(255,255,255,0.12))',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {firstLetter}
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-white/92">{displayName}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-white/45">
                    {(user?.role === 'admin' || user?.Role === 'admin') && <ShieldCheck size={10} className="text-blue-300/85" />}
                    <span>{user?.role === 'admin' || user?.Role === 'admin' ? 'مدير النظام' : 'مستخدم النظام'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-[20px] border border-white/10 bg-white/8 px-3 py-2 text-sm font-semibold text-white/90 transition-all duration-200 hover:bg-white/14"
                title="تسجيل الخروج"
              >
                <LogOut size={15} />
                تسجيل الخروج
              </button>
            </div>
          </div>

          <div className="mt-2 border-t border-white/5 pt-1.5 text-right">
            <span className="text-[10.5px] font-light text-white/32">{dateStr}</span>
          </div>
        </div>
      </header>

      <main className="px-3 py-3 sm:px-4 sm:py-4">
        <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleGroups.map((group, groupIndex) => {
              const groupStartIndex = cardIndex;
              cardIndex += group.items.length;

              return (
                <GroupSection
                  key={group.title}
                  group={group}
                  onNavigate={onNavigate}
                  startIndex={groupStartIndex}
                  sectionIndex={groupIndex}
                />
              );
            })}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sectionIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

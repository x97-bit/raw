import { Clock3, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import SidebarToggleButton from '../../../components/SidebarToggleButton';

export default function MainDashboardHeader({
  dateStr,
  timeStr,
  displayName,
  firstLetter,
  isAdmin,
  onLogout,
}) {
  const softButtonStyle = {
    background: 'rgba(255,255,255,0.05)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
  };

  return (
    <header className="px-3 pt-3 sm:px-4 sm:pt-4">
      <div
        className="relative overflow-hidden rounded-[32px] bg-[rgba(15,20,26,0.82)] backdrop-blur-xl"
        style={{
          boxShadow: '0 24px 54px rgba(0,0,0,0.24)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent_8%,rgba(100,142,169,0.7)_50%,transparent_94%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent_5%,rgba(255,255,255,0.08)_50%,transparent_95%)]" />
        <div className="pointer-events-none absolute -left-8 top-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(100,142,169,0.08),transparent_72%)]" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_72%)]" />

        <div className="relative mx-auto max-w-[1500px] px-4 py-4 sm:px-5 sm:py-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-center">
            <div className="space-y-4 text-right">
              <div className="flex flex-wrap items-center gap-2.5">
                <SidebarToggleButton />

                <div className="flex items-center gap-2.5 rounded-[22px] px-3 py-2" style={softButtonStyle}>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black text-white"
                    style={{
                      background: 'linear-gradient(145deg, #16202b 0%, #223141 70%, #648ea9 100%)',
                    }}
                  >
                    {firstLetter}
                  </div>

                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-[#f4f8fb]">{displayName}</p>
                    <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-medium text-[#8f9daa]">
                      {isAdmin && <ShieldCheck size={10} className="text-[#648ea9]" />}
                      <span>{isAdmin ? 'مدير النظام' : 'مستخدم النظام'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 rounded-[22px] px-3.5 py-2 text-sm font-semibold text-[#edf2f7] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/8"
                  style={softButtonStyle}
                  title="تسجيل الخروج"
                >
                  <LogOut size={15} />
                  تسجيل الخروج
                </button>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-[11px] font-bold text-[#8f9daa] shadow-[0_10px_22px_rgba(0,0,0,0.16)]">
                  <Sparkles size={13} className="text-[#648ea9]" />
                  <span>واجهة أنظف وأكثر هدوءًا</span>
                </div>
                <h1 className="mt-3 text-[28px] font-black tracking-tight text-[#f4f8fb] sm:text-[34px]">
                  مساحة عمل أوضح وأكثر توازنًا
                </h1>
                <p className="mt-2 max-w-2xl text-[13px] leading-7 text-[#8f9daa] sm:text-[14px]">
                  الألوان الآن أكثر ثباتًا وتناسقًا، مع تركيز أكبر على المحتوى والمهام بدل التباين الحاد والزخرفة الزائدة.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[26px] bg-white/6 px-4 py-4 shadow-[0_14px_26px_rgba(0,0,0,0.18)]">
                <div className="flex items-center gap-3 text-right">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/8 text-[#edf2f7]">
                    <Clock3 size={19} />
                  </div>
                  <div>
                    <div className="text-[10px] font-medium tracking-wide text-[#8f9daa]">بتوقيت بغداد</div>
                    <div className="mt-1 text-[22px] font-black tracking-[0.18em] text-[#f4f8fb] tabular-nums" dir="ltr">
                      {timeStr}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] bg-white/6 px-4 py-4 shadow-[0_14px_26px_rgba(0,0,0,0.18)]">
                <div className="text-right text-[10px] font-medium tracking-wide text-[#8f9daa]">
                  اليوم
                </div>
                <div className="mt-2 text-[14px] font-bold text-[#f4f8fb]">
                  {dateStr}
                </div>
                <div className="mt-3 flex items-center justify-end gap-1 text-[11px] font-medium text-[#8f9daa]">
                  {isAdmin && <ShieldCheck size={12} className="text-[#648ea9]" />}
                  <span>{isAdmin ? 'إدارة كاملة للنظام' : 'وصول بحسب الصلاحيات'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

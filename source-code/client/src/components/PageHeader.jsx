import { ArrowRight, Home } from 'lucide-react';

export default function PageHeader({ title, subtitle, onBack, onHome, children, accentColor }) {
  const accent = accentColor || '#0967d2';

  return (
    <div
      className="relative overflow-hidden no-print sticky top-0 z-40"
      style={{
        background: 'linear-gradient(145deg, #0a1e30 0%, #102a43 45%, #1a3a5c 85%, #1e3f64 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(10,30,48,0.25)',
      }}>

      {/* Top shimmer line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.15) 50%, transparent 95%)' }}
      />

      {/* Decorative glow */}
      <div
        className="absolute top-0 left-0 w-40 h-40 rounded-full pointer-events-none opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(-40%, -55%)' }}
      />
      <div
        className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-[0.04]"
        style={{
          background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
          transform: 'translate(30%, -40%)',
        }}
      />

      {/* Main content */}
      <div className="relative flex items-center justify-between px-4 py-3.5 gap-3">

        {/* Left: Nav buttons + Title */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0 transition-all duration-200 text-sm font-semibold text-white/85"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.13)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
              }}>
              <ArrowRight size={16} className="text-white/70" />
              <span className="text-white/85">رجوع</span>
            </button>
          )}

          {onHome && (
            <button
              onClick={onHome}
              className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.13)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              }}
              title="الصفحة الرئيسية">
              <Home size={15} className="text-white/75" />
            </button>
          )}

          {/* Title block */}
          <div className="min-w-0 flex-1 text-right">
            <h1 className="text-[16.5px] font-bold text-white tracking-tight leading-tight truncate"
              style={{ textShadow: '0 1px 8px rgba(0,0,0,0.2)' }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-white/35 font-medium mt-0.5 truncate tracking-wide">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Children (action buttons etc.) */}
        {children && (
          <div className="flex items-center gap-2 shrink-0">
            {children}
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1.5px]"
        style={{ background: `linear-gradient(90deg, transparent 5%, ${accent}50 50%, transparent 95%)` }}
      />
    </div>
  );
}

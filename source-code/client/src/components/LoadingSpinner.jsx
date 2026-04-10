export default function LoadingSpinner({
  label = 'جارٍ التحميل...',
  message,
  className = '',
  fullScreen = false,
}) {
  const text = message || label;

  if (fullScreen) {
    return (
      <div className={`page-shell min-h-screen ${className}`}>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="surface-card w-full max-w-sm rounded-[28px] px-6 py-7 text-center shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <div className="mx-auto mb-4 flex h-18 w-18 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#1e2a5e_0%,#2f3666_58%,#e52027_100%)] shadow-[0_18px_36px_rgba(30,42,94,0.22)]">
              <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/25 border-t-white" />
            </div>
            <p className="text-[14px] font-semibold text-slate-700">{text}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-16 text-center ${className}`.trim()}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[18px] bg-white shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
      <p className="text-sm font-medium text-slate-500">{text}</p>
    </div>
  );
}

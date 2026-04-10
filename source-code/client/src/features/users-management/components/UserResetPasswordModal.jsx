import { useEffect, useState } from 'react';
import { Copy, Eye, EyeOff, Key, RefreshCw, ShieldAlert } from 'lucide-react';
import UserManagementModalShell from './UserManagementModalShell';

export default function UserResetPasswordModal({
  message,
  newPassword,
  saving,
  onClose,
  onGeneratePassword,
  onSave,
  onPasswordChange,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;

    const timeoutId = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    if (!newPassword) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(newPassword);
        setCopied(true);
      }
    } catch (error) {
      console.warn('Copy password failed.', error);
    }
  };

  return (
    <UserManagementModalShell
      title="إعادة تعيين كلمة المرور"
      subtitle="لا يمكن عرض كلمة المرور الحالية لأن النظام يحتفظ بها بشكل آمن وغير قابل للاسترجاع."
      maxWidth="max-w-md"
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="rounded-[20px] border border-[#c29558]/20 bg-[#c29558]/[0.08] px-4 py-3 text-sm leading-7 text-[#f1d6ad]">
          <div className="mb-1 flex items-center gap-2 font-bold text-[#f6e3c2]">
            <ShieldAlert size={16} />
            <span>معلومة أمنية</span>
          </div>
          <p>لا يمكن إظهار كلمة المرور الحالية لأي مستخدم. البديل الصحيح هو تعيين كلمة جديدة ثم مشاركتها مع المستخدم.</p>
        </div>

        {message && (
          <div className="rounded-[20px] border border-[#b76169]/20 bg-[#b76169]/[0.08] px-4 py-3 text-sm font-medium text-[#f0c9ce]">
            {message}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#b7c3ce]">
            كلمة المرور الجديدة
          </label>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="input-field pl-24"
              dir="ltr"
              autoFocus
            />

            <div className="absolute inset-y-0 left-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-[#c9d4de] transition-colors hover:bg-white/[0.1] hover:text-white"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                disabled={!newPassword}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-[#c9d4de] transition-colors hover:bg-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                title={copied ? 'تم النسخ' : 'نسخ كلمة المرور'}
              >
                <Copy size={15} />
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[#91a0ad]">يمكنك كتابة كلمة المرور يدويًا أو توليد كلمة مؤقتة قوية.</span>
            <span className={`font-semibold ${copied ? 'text-[#9fd0c4]' : 'text-[#91a0ad]'}`}>
              {copied ? 'تم نسخ كلمة المرور' : 'جاهزة للنسخ بعد التعيين'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onGeneratePassword}
            className="btn-outline flex items-center gap-2"
          >
            <RefreshCw size={15} />
            <span>توليد كلمة مؤقتة</span>
          </button>
        </div>

        <div className="flex gap-3 border-t border-white/[0.06] pt-5">
          <button onClick={onSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Key size={15} />
            {saving ? 'جارٍ الحفظ...' : 'تعيين كلمة جديدة'}
          </button>
          <button onClick={onClose} className="btn-outline">
            إلغاء
          </button>
        </div>
      </div>
    </UserManagementModalShell>
  );
}

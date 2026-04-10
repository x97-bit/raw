import { useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { createInitialProfilePasswordForm, validateProfilePasswordForm } from './profilePageHelpers';

function PasswordField({
  id,
  label,
  value,
  visible,
  onToggle,
  onChange,
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-[#b7c3ce]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input-field pl-14"
          dir="ltr"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 left-2 my-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-[#c9d4de] transition-colors hover:bg-white/[0.1] hover:text-white"
          title={visible ? 'إخفاء' : 'إظهار'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePageContent({ onBack }) {
  const { api, user } = useAuth();
  const [form, setForm] = useState(createInitialProfilePasswordForm());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [visibility, setVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const displayName = user?.FullName || user?.fullName || 'المستخدم';
  const username = user?.Username || user?.username || '-';
  const roleLabel = user?.Role === 'admin' || user?.role === 'admin' ? 'مدير النظام' : 'مستخدم';

  const messageStyles = useMemo(
    () => (
      messageType === 'success'
        ? 'border-[#8eb8ad]/20 bg-[#8eb8ad]/[0.08] text-[#dceee8]'
        : 'border-[#b76169]/20 bg-[#b76169]/[0.08] text-[#f0c9ce]'
    ),
    [messageType],
  );

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleVisibility = (key) => {
    setVisibility((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSubmit = async () => {
    const validationMessage = validateProfilePasswordForm(form);
    if (validationMessage) {
      setMessageType('error');
      setMessage(validationMessage);
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      setForm(createInitialProfilePasswordForm());
      setMessageType('success');
      setMessage('تم تحديث كلمة المرور بنجاح.');
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="ملفي الشخصي"
        subtitle="تحديث كلمة المرور الخاصة بحسابك"
        onBack={onBack}
      />

      <div className="mx-auto grid max-w-6xl gap-5 p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="surface-card space-y-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/[0.06] text-white shadow-[0_12px_22px_rgba(0,0,0,0.18)]">
              <UserRound size={22} />
            </div>
            <div className="min-w-0 text-right">
              <h2 className="truncate text-lg font-black text-white">{displayName}</h2>
              <p className="truncate text-sm text-[#91a0ad]">@{username}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="mb-1 text-xs font-semibold tracking-wide text-[#91a0ad]">نوع الحساب</div>
              <div className="text-sm font-bold text-[#edf2f7]">{roleLabel}</div>
            </div>
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="mb-1 text-xs font-semibold tracking-wide text-[#91a0ad]">الأمان</div>
              <div className="flex items-center gap-2 text-sm font-bold text-[#dceee8]">
                <ShieldCheck size={16} />
                <span>يمكنك تغيير كلمة المرور من هنا</span>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.03] p-4 text-sm leading-7 text-[#b7c3ce] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            هذه الصفحة خاصة بحسابك فقط. يمكنك تغيير كلمة المرور الحالية بعد إدخالها بشكل صحيح، ولن تظهر كلمة المرور القديمة داخل النظام.
          </div>
        </section>

        <section className="surface-card space-y-4 p-5">
          <div className="flex items-center gap-2 text-right">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#648ea9]/[0.14] text-[#dce8f2]">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">تغيير كلمة المرور</h3>
              <p className="text-sm text-[#91a0ad]">أدخل كلمة المرور الحالية ثم اختر كلمة جديدة.</p>
            </div>
          </div>

          {message && (
            <div className={`rounded-[20px] border px-4 py-3 text-sm font-medium ${messageStyles}`}>
              {message}
            </div>
          )}

          <div className="grid gap-4">
            <PasswordField
              id="current-password"
              label="كلمة المرور الحالية"
              value={form.currentPassword}
              visible={visibility.currentPassword}
              onToggle={() => toggleVisibility('currentPassword')}
              onChange={(value) => updateField('currentPassword', value)}
            />
            <PasswordField
              id="new-password"
              label="كلمة المرور الجديدة"
              value={form.newPassword}
              visible={visibility.newPassword}
              onToggle={() => toggleVisibility('newPassword')}
              onChange={(value) => updateField('newPassword', value)}
            />
            <PasswordField
              id="confirm-password"
              label="تأكيد كلمة المرور الجديدة"
              value={form.confirmPassword}
              visible={visibility.confirmPassword}
              onToggle={() => toggleVisibility('confirmPassword')}
              onChange={(value) => updateField('confirmPassword', value)}
            />
          </div>

          <div className="flex gap-3 border-t border-white/[0.06] pt-5">
            <button onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center gap-2">
              <KeyRound size={16} />
              {saving ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور الجديدة'}
            </button>
            <button
              onClick={() => {
                setForm(createInitialProfilePasswordForm());
                setMessage('');
              }}
              className="btn-outline"
            >
              تفريغ الحقول
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../contexts/AuthContext";
import {
  createInitialProfilePasswordForm,
  validateProfilePasswordForm,
} from "./profilePageHelpers";

function PasswordField({ id, label, value, visible, onToggle, onChange }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-[11.5px] font-semibold"
        style={{ color: "var(--hero-muted)" }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={event => onChange(event.target.value)}
          className="input-field pl-12"
          dir="ltr"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 left-1.5 my-auto flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{
            background: "var(--ghost-button-bg)",
            color: "var(--ghost-button-text)",
          }}
          title={visible ? "إخفاء" : "إظهار"}
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePageContent({ onBack }) {
  const { api, user } = useAuth();
  const [form, setForm] = useState(createInitialProfilePasswordForm());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [visibility, setVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const displayName = user?.FullName || user?.fullName || "المستخدم";
  const username = user?.Username || user?.username || "-";
  const roleLabel =
    user?.Role === "admin" || user?.role === "admin" ? "مدير النظام" : "مستخدم";

  const messageStyles = useMemo(
    () =>
      messageType === "success"
        ? { background: "var(--success-soft-bg, rgba(142,184,173,0.08))", color: "var(--success-soft-text, #8eb8ad)", border: "1px solid var(--success-soft-border, rgba(142,184,173,0.2))" }
        : { background: "var(--error-soft-bg)", color: "var(--error-soft-text)", border: "1px solid var(--error-soft-border, rgba(183,97,105,0.2))" },
    [messageType]
  );

  const updateField = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const toggleVisibility = key => {
    setVisibility(current => ({ ...current, [key]: !current[key] }));
  };

  const handleSubmit = async () => {
    const validationMessage = validateProfilePasswordForm(form);
    if (validationMessage) {
      setMessageType("error");
      setMessage(validationMessage);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      setForm(createInitialProfilePasswordForm());
      setMessageType("success");
      setMessage("تم تحديث كلمة المرور بنجاح.");
    } catch (error) {
      setMessageType("error");
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

      <div className="mx-auto grid max-w-5xl gap-4 p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Account Info Card */}
        <section className="surface-card space-y-3.5 p-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{
                background: "var(--ghost-button-bg)",
                boxShadow: "var(--ghost-button-shadow)",
                color: "var(--page-header-title)",
              }}
            >
              <UserRound size={18} />
            </div>
            <div className="min-w-0 text-right">
              <h2
                className="truncate text-base font-black"
                style={{ color: "var(--hero-title)" }}
              >
                {displayName}
              </h2>
              <p
                className="truncate text-[11px] font-medium"
                style={{ color: "var(--hero-muted)" }}
              >
                @{username}
              </p>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div
              className="rounded-xl border p-3"
              style={{
                borderColor: "var(--sidebar-separator, rgba(255,255,255,0.06))",
                background: "var(--ghost-button-bg)",
              }}
            >
              <div
                className="mb-0.5 text-[10px] font-semibold tracking-wide"
                style={{ color: "var(--hero-muted)" }}
              >
                نوع الحساب
              </div>
              <div
                className="text-[12px] font-bold"
                style={{ color: "var(--hero-title)" }}
              >
                {roleLabel}
              </div>
            </div>
            <div
              className="rounded-xl border p-3"
              style={{
                borderColor: "var(--sidebar-separator, rgba(255,255,255,0.06))",
                background: "var(--ghost-button-bg)",
              }}
            >
              <div
                className="mb-0.5 text-[10px] font-semibold tracking-wide"
                style={{ color: "var(--hero-muted)" }}
              >
                الأمان
              </div>
              <div
                className="flex items-center gap-1.5 text-[12px] font-bold"
                style={{ color: "var(--hero-title)" }}
              >
                <ShieldCheck size={13} />
                <span>يمكنك تغيير كلمة المرور</span>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl border p-3 text-[11.5px] leading-6"
            style={{
              borderColor: "var(--sidebar-separator, rgba(255,255,255,0.06))",
              background: "var(--ghost-button-bg)",
              color: "var(--hero-muted)",
            }}
          >
            هذه الصفحة خاصة بحسابك فقط. يمكنك تغيير كلمة المرور الحالية بعد
            إدخالها بشكل صحيح، ولن تظهر كلمة المرور القديمة داخل النظام.
          </div>
        </section>

        {/* Password Change Card */}
        <section className="surface-card space-y-3.5 p-4">
          <div className="flex items-center gap-2 text-right">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: "var(--ghost-button-bg)",
                color: "var(--page-header-title)",
              }}
            >
              <KeyRound size={16} />
            </div>
            <div>
              <h3
                className="text-[13px] font-black"
                style={{ color: "var(--hero-title)" }}
              >
                تغيير كلمة المرور
              </h3>
              <p
                className="text-[10.5px]"
                style={{ color: "var(--hero-muted)" }}
              >
                أدخل كلمة المرور الحالية ثم اختر كلمة جديدة.
              </p>
            </div>
          </div>

          {message && (
            <div
              className="rounded-xl px-3.5 py-2.5 text-[12px] font-medium"
              style={messageStyles}
            >
              {message}
            </div>
          )}

          <div className="grid gap-3">
            <PasswordField
              id="current-password"
              label="كلمة المرور الحالية"
              value={form.currentPassword}
              visible={visibility.currentPassword}
              onToggle={() => toggleVisibility("currentPassword")}
              onChange={value => updateField("currentPassword", value)}
            />
            <PasswordField
              id="new-password"
              label="كلمة المرور الجديدة"
              value={form.newPassword}
              visible={visibility.newPassword}
              onToggle={() => toggleVisibility("newPassword")}
              onChange={value => updateField("newPassword", value)}
            />
            <PasswordField
              id="confirm-password"
              label="تأكيد كلمة المرور الجديدة"
              value={form.confirmPassword}
              visible={visibility.confirmPassword}
              onToggle={() => toggleVisibility("confirmPassword")}
              onChange={value => updateField("confirmPassword", value)}
            />
          </div>

          <div
            className="flex gap-2.5 border-t pt-3.5"
            style={{ borderColor: "var(--sidebar-separator, rgba(255,255,255,0.06))" }}
          >
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary flex items-center gap-1.5 text-[12px]"
            >
              <KeyRound size={14} />
              {saving ? "جارٍ الحفظ..." : "حفظ كلمة المرور الجديدة"}
            </button>
            <button
              onClick={() => {
                setForm(createInitialProfilePasswordForm());
                setMessage("");
              }}
              className="btn-outline text-[12px]"
            >
              تفريغ الحقول
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

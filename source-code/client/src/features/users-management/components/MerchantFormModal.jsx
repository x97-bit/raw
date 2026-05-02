import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import UserManagementModalShell from "./UserManagementModalShell";
import { trpc } from "../../../utils/trpc";

export default function MerchantFormModal({
  title,
  form,
  message,
  saving,
  onClose,
  onSave,
  onFormChange,
  isEdit = false,
}) {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    let mounted = true;
    trpc.merchantUsers.getAccounts.query().then(res => {
      if (mounted) setAccounts(res || []);
    }).catch(err => console.error("Failed to load accounts", err));
    return () => { mounted = false; };
  }, []);

  return (
    <UserManagementModalShell title={title} onClose={onClose}>
      <div className="space-y-4">
        {message && (
          <div className="rounded-xl bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger border border-danger/20">
            {message}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">
            {"الاسم الكامل"} *
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={event => onFormChange("fullName", event.target.value)}
            className="input-field"
            placeholder="مثال: أحمد محمد"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">
            {"اسم المستخدم (لتسجيل الدخول)"} *
          </label>
          <input
            type="text"
            value={form.username}
            onChange={event => onFormChange("username", event.target.value)}
            className="input-field"
            placeholder="مثال: ahmed"
            dir="ltr"
          />
        </div>

        {!isEdit && (
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">
              {"كلمة المرور"} *
            </label>
            <input
              type="password"
              value={form.password}
              onChange={event => onFormChange("password", event.target.value)}
              className="input-field"
              dir="ltr"
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">
            {"الحساب المالي المرتبط بالتاجر"} *
          </label>
          <select
            value={form.accountId || ""}
            onChange={event => onFormChange("accountId", Number(event.target.value))}
            className="input-field"
          >
            <option value="">-- اختر حساباً --</option>
            {accounts?.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.type})
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-muted-foreground">
            هذا الحساب هو الذي سيعرض الكشف المالي الخاص به للتاجر عند تسجيل دخوله.
          </p>
        </div>

        {isEdit && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveToggle"
              checked={form.IsActive}
              onChange={e => onFormChange("IsActive", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isActiveToggle" className="text-sm font-semibold text-slate-700">
              الحساب مفعل (يمكنه تسجيل الدخول)
            </label>
          </div>
        )}

        <div className="flex gap-3 border-t border-border pt-5">
          <button
            onClick={onSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={15} />
            {saving ? "جارٍ الحفظ..." : "حفظ بيانات التاجر"}
          </button>
          <button onClick={onClose} className="btn-outline">
            {"إلغاء"}
          </button>
        </div>
      </div>
    </UserManagementModalShell>
  );
}

import { Save, ShieldAlert, ToggleLeft, ToggleRight } from "lucide-react";
import UserManagementModalShell from "./UserManagementModalShell";
import UserPermissionsPanel from "./UserPermissionsPanel";
import UserRoleCards from "./UserRoleCards";

export default function UserEditModal({
  user,
  permissions,
  message,
  saving,
  onClose,
  onSave,
  onUserChange,
  onTogglePermission,
  onSelectAllPermissions,
  onClearPermissions,
}) {
  if (!user) return null;

  return (
    <UserManagementModalShell
      title={`تعديل المستخدم - ${user.FullName}`}
      maxWidth="max-w-2xl"
      onClose={onClose}
    >
      <div className="space-y-5">
        {message && (
          <div className="rounded-xl bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger border border-danger/20">
            {message}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">
            {"الاسم الكامل"}
          </label>
          <input
            type="text"
            value={user.FullName}
            onChange={event =>
              onUserChange(current => ({
                ...current,
                FullName: event.target.value,
              }))
            }
            className="input-field"
          />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-muted-foreground">
            {"نوع الحساب"}
          </label>
          <UserRoleCards
            value={user.Role}
            onChange={role =>
              onUserChange(current => ({ ...current, Role: role }))
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-xl p-4 bg-secondary/20 border border-border">
          <span className="text-sm font-semibold text-foreground">
            {"حالة الحساب"}
          </span>
          <button
            onClick={() =>
              onUserChange(current => ({
                ...current,
                IsActive: current.IsActive ? 0 : 1,
              }))
            }
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${user.IsActive ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"}`}
          >
            {user.IsActive ? (
              <>
                <ToggleRight size={16} />
                {"مفعل"}
              </>
            ) : (
              <>
                <ToggleLeft size={16} />
                {"معطل"}
              </>
            )}
          </button>
        </div>

        {user.Role !== "admin" ? (
          <UserPermissionsPanel
            permissions={permissions}
            onToggle={onTogglePermission}
            onSelectAll={onSelectAllPermissions}
            onClearAll={onClearPermissions}
          />
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-warning/10 px-4 py-3 text-sm font-medium text-warning border border-warning/20">
            <ShieldAlert size={15} />
            {"المدير لديه جميع الصلاحيات تلقائياً"}
          </div>
        )}

        <div className="flex gap-3 border-t border-border pt-5">
          <button
            onClick={onSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={15} />
            {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </button>
          <button onClick={onClose} className="btn-outline">
            {"إلغاء"}
          </button>
        </div>
      </div>
    </UserManagementModalShell>
  );
}

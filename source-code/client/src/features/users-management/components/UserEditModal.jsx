import { Save, ShieldAlert, ToggleLeft, ToggleRight } from 'lucide-react';
import UserManagementModalShell from './UserManagementModalShell';
import UserPermissionsPanel from './UserPermissionsPanel';
import UserRoleCards from './UserRoleCards';

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
          <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700" style={{ border: '1px solid rgba(225,45,57,0.15)' }}>
            {message}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">
            {'الاسم الكامل'}
          </label>
          <input
            type="text"
            value={user.FullName}
            onChange={(event) => onUserChange((current) => ({ ...current, FullName: event.target.value }))}
            className="input-field"
          />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-gray-600">
            {'نوع الحساب'}
          </label>
          <UserRoleCards value={user.Role} onChange={(role) => onUserChange((current) => ({ ...current, Role: role }))} />
        </div>

        <div className="flex items-center justify-between rounded-xl p-4" style={{ background: '#f8f9fb' }}>
          <span className="text-sm font-semibold text-gray-700">
            {'حالة الحساب'}
          </span>
          <button
            onClick={() => onUserChange((current) => ({ ...current, IsActive: current.IsActive ? 0 : 1 }))}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${user.IsActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
            style={{ border: user.IsActive ? '1px solid rgba(39,171,131,0.15)' : '1px solid rgba(225,45,57,0.15)' }}
          >
            {user.IsActive ? (
              <>
                <ToggleRight size={16} />
                {'مفعل'}
              </>
            ) : (
              <>
                <ToggleLeft size={16} />
                {'معطل'}
              </>
            )}
          </button>
        </div>

        {user.Role !== 'admin' ? (
          <UserPermissionsPanel
            permissions={permissions}
            onToggle={onTogglePermission}
            onSelectAll={onSelectAllPermissions}
            onClearAll={onClearPermissions}
          />
        ) : (
          <div
            className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
            style={{ border: '1px solid rgba(233,185,73,0.2)' }}
          >
            <ShieldAlert size={15} />
            {'المدير لديه جميع الصلاحيات تلقائياً'}
          </div>
        )}

        <div className="flex gap-3 border-t border-gray-100 pt-5">
          <button onClick={onSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={15} />
            {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
          </button>
          <button onClick={onClose} className="btn-outline">
            {'إلغاء'}
          </button>
        </div>
      </div>
    </UserManagementModalShell>
  );
}

import { Save } from 'lucide-react';
import UserManagementModalShell from './UserManagementModalShell';
import UserRoleCards from './UserRoleCards';

export default function UserCreateModal({
  form,
  message,
  saving,
  onClose,
  onSave,
  onFormChange,
}) {
  return (
    <UserManagementModalShell
      title="مستخدم جديد"
      onClose={onClose}
    >
      <div className="space-y-4">
        {message && (
          <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700" style={{ border: '1px solid rgba(225,45,57,0.15)' }}>
            {message}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">
            {'الاسم الكامل'} *
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(event) => onFormChange('fullName', event.target.value)}
            className="input-field"
            placeholder="مثال: أحمد محمد"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">
            {'اسم المستخدم'} *
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(event) => onFormChange('username', event.target.value)}
            className="input-field"
            placeholder="مثال: ahmed"
            dir="ltr"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">
            {'كلمة المرور'} *
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(event) => onFormChange('password', event.target.value)}
            className="input-field"
            dir="ltr"
          />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-gray-600">
            {'الصلاحية'}
          </label>
          <UserRoleCards value={form.role} onChange={(role) => onFormChange('role', role)} />
        </div>

        <div className="flex gap-3 border-t border-gray-100 pt-5">
          <button onClick={onSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={15} />
            {saving ? 'جارٍ الحفظ...' : 'إنشاء'}
          </button>
          <button onClick={onClose} className="btn-outline">
            {'إلغاء'}
          </button>
        </div>
      </div>
    </UserManagementModalShell>
  );
}

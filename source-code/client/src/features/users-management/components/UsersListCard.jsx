import { Key, Plus, UserCog } from "lucide-react";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { USER_ROLE_CONFIG } from "../usersManagementConfig";

export default function UsersListCard({
  users,
  loading,
  onCreate,
  onEdit,
  onResetPassword,
}) {
  return (
    <div className="surface-card overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-5 py-4">
        <div className="text-right">
          <h3 className="text-sm font-black text-slate-900">
            المستخدمون ({users.length})
          </h3>
          <p className="mt-1 text-[11.5px] text-slate-500">
            إضافة المستخدمين وإدارة الصلاحيات وإعادة تعيين كلمات المرور.
          </p>
        </div>

        {onCreate && (
          <button
            onClick={onCreate}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Plus size={15} />
            <span>إضافة مستخدم</span>
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner label="جاري تحميل المستخدمين..." className="py-12" />
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            لا يوجد مستخدمون بعد
          </div>
          <p className="max-w-md text-sm leading-7 text-slate-500">
            ابدأ بإضافة أول مستخدم حتى تتمكن من توزيع الصلاحيات وإدارة الوصول
            داخل النظام.
          </p>
          {onCreate && (
            <button
              onClick={onCreate}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
            >
              <Plus size={15} />
              <span>إضافة أول مستخدم</span>
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {users.map(user => {
            const roleConfig =
              USER_ROLE_CONFIG[user.Role] || USER_ROLE_CONFIG.user;
            const Icon = roleConfig.icon;

            return (
              <div
                key={user.UserID}
                className={`flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50/70 ${!user.IsActive ? "opacity-45" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-3.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${roleConfig.color}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm font-bold text-slate-800">
                      {user.FullName}
                    </h4>
                    <p className="text-xs text-slate-400">@{user.Username}</p>
                  </div>
                  <span
                    className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${roleConfig.color}`}
                  >
                    {roleConfig.label}
                  </span>
                  {!user.IsActive && (
                    <span className="rounded-lg bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
                      معطل
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onEdit(user)}
                    className="flex items-center gap-1 rounded-lg bg-accent-50 px-2.5 py-1.5 text-xs font-semibold text-accent-700 transition-all hover:bg-accent-100"
                  >
                    <UserCog size={13} />
                    تعديل
                  </button>
                  <button
                    onClick={() => onResetPassword(user.UserID)}
                    className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100"
                  >
                    <Key size={13} />
                    كلمة المرور
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

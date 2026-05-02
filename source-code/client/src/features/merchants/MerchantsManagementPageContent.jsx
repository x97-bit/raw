import { fmtNum, fmtUSD } from "../../utils/formatNumber";
import { useState, useEffect, useCallback } from "react";
import { trpc } from "../../utils/trpc";
import UsersListCard from "../users-management/components/UsersListCard";
import MerchantFormModal from "../users-management/components/MerchantFormModal";
import UserResetPasswordModal from "../users-management/components/UserResetPasswordModal";
import PageHeader from "../../components/PageHeader";
import {
  ToggleLeft, ToggleRight, Clock, Shield, ShieldOff,
  Activity, LogIn, AlertTriangle, X, ChevronDown, ChevronUp,
  BarChart3, FileText, CreditCard, Calendar, Wifi, WifiOff
} from "lucide-react";

// ─── Login Log Modal ───────────────────────────────────────
function LoginLogModal({ merchantId, merchantName, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await trpc.merchantUsers.getLoginLog.query({
          merchantUserId: merchantId,
          limit: 50,
        });
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [merchantId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <LogIn size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">سجل الدخول</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{merchantName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-auto max-h-[60vh] p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Clock size={48} className="mx-auto mb-3 opacity-30" />
              <p>لا يوجد سجل دخول بعد</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div
                  key={log.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    log.status === "success"
                      ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30"
                      : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    log.status === "success"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-red-100 dark:bg-red-900/30"
                  }`}>
                    {log.status === "success" ? (
                      <Shield size={16} className="text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        log.status === "success"
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      }`}>
                        {log.status === "success" ? "دخول ناجح" : "محاولة فاشلة"}
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{log.ipAddress || "—"}</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                      {log.userAgent ? log.userAgent.slice(0, 80) + (log.userAgent.length > 80 ? "..." : "") : "—"}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-left flex-shrink-0 whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString("ar-IQ", {
                      year: "numeric", month: "2-digit", day: "2-digit",
                      hour: "2-digit", minute: "2-digit"
                    }) : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stats Modal ───────────────────────────────────────────
function MerchantStatsModal({ merchantId, merchantName, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await trpc.merchantUsers.getMerchantStats.query({
          merchantUserId: merchantId,
        });
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [merchantId]);

  const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <div className={`p-4 rounded-xl border ${color} transition-all`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="opacity-70" />
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <BarChart3 size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">إحصائيات التاجر</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{merchantName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !stats ? (
            <p className="text-center text-gray-500 py-8">لا توجد بيانات</p>
          ) : (
            <div className="space-y-4">
              {/* Login Stats */}
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <LogIn size={16} /> إحصائيات الدخول
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={Shield}
                  label="دخول ناجح"
                  value={stats.loginStats.totalLogins}
                  color="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-300"
                />
                <StatCard
                  icon={AlertTriangle}
                  label="محاولات فاشلة"
                  value={stats.loginStats.failedLogins}
                  color="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300"
                />
                <StatCard
                  icon={Activity}
                  label="آخر 7 أيام"
                  value={stats.loginStats.loginsLast7Days}
                  color="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-300"
                  sub={stats.loginStats.lastLogin
                    ? `آخر دخول: ${new Date(stats.loginStats.lastLogin).toLocaleDateString("ar-IQ")}`
                    : "لم يسجل دخول بعد"}
                />
                <StatCard
                  icon={Calendar}
                  label="تاريخ الإنشاء"
                  value={stats.createdAt ? new Date(stats.createdAt).toLocaleDateString("ar-IQ") : "—"}
                  color="bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600/30 text-gray-700 dark:text-gray-300"
                />
              </div>

              {/* Transaction Stats */}
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2 mt-4">
                <CreditCard size={16} /> إحصائيات المعاملات
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  icon={FileText}
                  label="إجمالي المعاملات"
                  value={stats.transactionStats.totalTransactions}
                  color="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/30 text-indigo-700 dark:text-indigo-300"
                />
                <StatCard
                  icon={CreditCard}
                  label="فواتير ($)"
                  value={`$${fmtUSD(stats.transactionStats.totalInvoicesUSD)}`}
                  color="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300"
                />
                <StatCard
                  icon={CreditCard}
                  label="مدفوعات ($)"
                  value={`$${fmtUSD(stats.transactionStats.totalPaymentsUSD)}`}
                  color="bg-teal-50 dark:bg-teal-900/10 border-teal-200 dark:border-teal-800/30 text-teal-700 dark:text-teal-300"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function MerchantsManagementPage() {
  const [modalState, setModalState] = useState({ type: null, payload: null });
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    accountId: "",
    IsActive: true,
  });
  const [message, setMessage] = useState("");
  const [merchants, setMerchants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  const fetchMerchants = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await trpc.merchantUsers.list.query();
      const mappedData = data.map(user => ({
        ...user,
        UserID: user.id,
        FullName: user.fullName,
        Username: user.username,
        IsActive: user.active === 1 || user.active === true,
        Role: "user"
      }));
      setMerchants(mappedData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const generateStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const randomString = (length, chars) => Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return randomString(3, upperChars) + randomString(3, chars) + randomString(3, numbers) + "@";
  };

  const handleToggleActive = async (merchant) => {
    setTogglingId(merchant.id);
    try {
      await trpc.merchantUsers.toggleActive.mutate({ id: merchant.id });
      await fetchMerchants();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const openCreateModal = () => {
    setForm({ fullName: "", username: "", password: "", accountId: "", IsActive: true });
    setMessage("");
    setModalState({ type: "CREATE", payload: null });
  };

  const openEditModal = (user) => {
    setForm({
      fullName: user.fullName,
      username: user.username,
      accountId: user.accountId || "",
      IsActive: user.active,
    });
    setMessage("");
    setModalState({ type: "EDIT", payload: user.id });
  };

  const openResetPasswordModal = (userId) => {
    setMessage("");
    setResetPasswordVal("");
    setModalState({ type: "RESET_PASSWORD", payload: userId });
  };

  const openLoginLogModal = (merchant) => {
    setModalState({ type: "LOGIN_LOG", payload: { id: merchant.id, name: merchant.fullName } });
  };

  const openStatsModal = (merchant) => {
    setModalState({ type: "STATS", payload: { id: merchant.id, name: merchant.fullName } });
  };

  const closeModal = () => {
    setModalState({ type: null, payload: null });
    setResetPasswordVal("");
  };

  const handleResetPassword = async () => {
    if (!resetPasswordVal) {
      setMessage("يرجى إدخال كلمة مرور جديدة.");
      return;
    }
    setIsSaving(true);
    try {
      await trpc.merchantUsers.resetPassword.mutate({
        id: modalState.payload,
        password: resetPasswordVal,
      });
      setMessage("تم تعيين كلمة المرور بنجاح. يرجى نسخها قبل الإغلاق.");
    } catch (err) {
      setMessage(err.message || "حدث خطأ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setMessage("");
    if (!form.fullName || !form.username || (!form.accountId && form.accountId !== 0)) {
      setMessage("يرجى تعبئة جميع الحقول المطلوبة (الاسم، اسم المستخدم، والحساب المالي).");
      return;
    }
    setIsSaving(true);
    try {
      if (modalState.type === "CREATE") {
        if (!form.password) {
          setMessage("يرجى إدخال كلمة المرور.");
          setIsSaving(false);
          return;
        }
        await trpc.merchantUsers.create.mutate({
          username: form.username,
          password: form.password,
          fullName: form.fullName,
          accountId: Number(form.accountId),
        });
      } else if (modalState.type === "EDIT") {
        await trpc.merchantUsers.update.mutate({
          id: modalState.payload,
          username: form.username,
          fullName: form.fullName,
          accountId: Number(form.accountId),
          active: form.IsActive,
        });
      }
      await fetchMerchants();
      closeModal();
    } catch (err) {
      setMessage(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة التجار"
        subtitle="إضافة التجار وربطهم بحساباتهم المالية وتحديد صلاحيات الدخول لمنصة التجار"
      />

      {/* Merchants Table with Toggle + Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">قائمة التجار</h3>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span>+</span> إضافة تاجر
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : merchants.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <p className="text-lg">لا يوجد تجار مسجلين</p>
            <p className="text-sm mt-1">اضغط "إضافة تاجر" لإنشاء حساب جديد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3">الاسم</th>
                  <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3">المستخدم</th>
                  <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3">الحالة</th>
                  <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3">آخر دخول</th>
                  <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3">عدد الدخول</th>
                  <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {merchants.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                          m.IsActive
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                        }`}>
                          {m.fullName?.charAt(0) || "?"}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{m.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300 font-mono">{m.username}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(m)}
                        disabled={togglingId === m.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          m.IsActive
                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40"
                            : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/40"
                        } ${togglingId === m.id ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                      >
                        {togglingId === m.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : m.IsActive ? (
                          <><Wifi size={14} /> مفعّل</>
                        ) : (
                          <><WifiOff size={14} /> معطّل</>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                      {m.lastLogin
                        ? new Date(m.lastLogin).toLocaleString("ar-IQ", {
                            month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{m.totalLogins || 0}</span>
                      {m.failedLogins > 0 && (
                        <span className="text-xs text-red-500 mr-1">({m.failedLogins} فاشل)</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                          title="تعديل"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openResetPasswordModal(m.id)}
                          className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 transition-colors"
                          title="إعادة تعيين كلمة المرور"
                        >
                          <Shield size={16} />
                        </button>
                        <button
                          onClick={() => openLoginLogModal(m)}
                          className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors"
                          title="سجل الدخول"
                        >
                          <LogIn size={16} />
                        </button>
                        <button
                          onClick={() => openStatsModal(m)}
                          className="p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 transition-colors"
                          title="إحصائيات"
                        >
                          <BarChart3 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {(modalState.type === "CREATE" || modalState.type === "EDIT") && (
        <MerchantFormModal
          title={modalState.type === "CREATE" ? "إضافة تاجر جديد" : "تعديل بيانات التاجر"}
          form={form}
          message={message}
          saving={isSaving}
          isEdit={modalState.type === "EDIT"}
          onClose={closeModal}
          onSave={handleSave}
          onFormChange={(key, value) => setForm(prev => ({ ...prev, [key]: value }))}
        />
      )}

      {modalState.type === "RESET_PASSWORD" && (
        <UserResetPasswordModal
          message={message}
          newPassword={resetPasswordVal}
          saving={isSaving}
          onClose={closeModal}
          onGeneratePassword={() => setResetPasswordVal(generateStrongPassword())}
          onPasswordChange={setResetPasswordVal}
          onSave={handleResetPassword}
        />
      )}

      {modalState.type === "LOGIN_LOG" && (
        <LoginLogModal
          merchantId={modalState.payload.id}
          merchantName={modalState.payload.name}
          onClose={closeModal}
        />
      )}

      {modalState.type === "STATS" && (
        <MerchantStatsModal
          merchantId={modalState.payload.id}
          merchantName={modalState.payload.name}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

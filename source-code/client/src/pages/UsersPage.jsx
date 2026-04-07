import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { Plus, Shield, ShieldAlert, UserCog, Key, X, Save, ToggleLeft, ToggleRight, Check } from 'lucide-react';

const roleConfig = {
  admin: { label: 'مدير النظام', color: 'bg-red-50 text-red-700', icon: ShieldAlert, desc: 'صلاحيات كاملة - جميع الأقسام والعمليات' },
  user: { label: 'مستخدم', color: 'bg-emerald-50 text-emerald-700', icon: Shield, desc: 'صلاحيات محددة حسب الاختيار' },
};

const sectionPerms = [
  { key: 'port-1', label: 'السعودية' },
  { key: 'port-2', label: 'المنذرية' },
  { key: 'port-3', label: 'القائم' },
  { key: 'transport', label: 'النقل' },
  { key: 'partnership', label: 'شراكة' },
  { key: 'fx', label: 'الصيرفة' },
  { key: 'debts', label: 'ديون' },
  { key: 'special', label: 'حسابات خاصة' },
  { key: 'reports', label: 'التقارير' },
];

const actionPerms = [
  { key: 'add_invoice', label: 'إضافة له' },
  { key: 'add_payment', label: 'إضافة عليه' },
  { key: 'edit_transaction', label: 'تعديل المعاملات' },
  { key: 'delete_transaction', label: 'حذف المعاملات' },
  { key: 'export', label: 'تصدير PDF / Excel' },
  { key: 'add_trader', label: 'إضافة تاجر جديد' },
  { key: 'manage_debts', label: 'إدارة الديون' },
];

export default function UsersPage({ onBack }) {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showResetPw, setShowResetPw] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editPerms, setEditPerms] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', role: 'user' });
  const [newPw, setNewPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const u = await api('/auth/users');
      setUsers(u);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.username || !form.password || !form.fullName) { setMsg('جميع الحقول مطلوبة'); return; }
    setSaving(true);
    try {
      await api('/auth/users', { method: 'POST', body: JSON.stringify(form) });
      setShowForm(false);
      setForm({ username: '', password: '', fullName: '', role: 'user' });
      setMsg('');
      load();
    } catch (e) { setMsg(e.message); }
    setSaving(false);
  };

  const openEdit = async (u) => {
    setEditUser({ ...u });
    setMsg('');
    try {
      const perms = await api(`/auth/users/${u.UserID}/permissions`);
      setEditPerms(perms);
    } catch (e) {
      setEditPerms([]);
    }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await api(`/auth/users/${editUser.UserID}`, {
        method: 'PUT',
        body: JSON.stringify({ fullName: editUser.FullName, role: editUser.Role, isActive: editUser.IsActive })
      });
      if (editUser.Role !== 'admin') {
        await api(`/auth/users/${editUser.UserID}/permissions`, {
          method: 'PUT',
          body: JSON.stringify({ permissions: editPerms })
        });
      }
      setEditUser(null);
      load();
    } catch (e) { setMsg(e.message); }
    setSaving(false);
  };

  const handleResetPassword = async () => {
    if (!newPw || newPw.length < 4) { setMsg('كلمة المرور يجب أن تكون 4 أحرف على الأقل'); return; }
    setSaving(true);
    try {
      await api(`/auth/users/${showResetPw}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword: newPw })
      });
      setShowResetPw(null);
      setNewPw('');
      alert('تم إعادة تعيين كلمة المرور بنجاح');
    } catch (e) { setMsg(e.message); }
    setSaving(false);
  };

  const togglePerm = (key) => {
    setEditPerms(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);
  };

  const selectAllPerms = () => {
    const allKeys = [...sectionPerms, ...actionPerms].map(p => p.key);
    setEditPerms(allKeys);
  };

  const clearAllPerms = () => {
    setEditPerms([]);
  };

  return (
    <div className="page-shell">
      <PageHeader title="إدارة المستخدمين والصلاحيات" subtitle="الصفحة الرئيسية" onBack={onBack}>
        <button onClick={() => { setForm({ username: '', password: '', fullName: '', role: 'user' }); setShowForm(true); setMsg(''); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
          <Plus size={14} /> مستخدم جديد
        </button>
      </PageHeader>

      <div className="p-5 space-y-6 max-w-5xl mx-auto">
        <div className="surface-card p-0 overflow-hidden">
          <div className="px-5 py-3.5" style={{ background: 'linear-gradient(135deg, #102a43, #243b53)' }}>
            <h3 className="font-bold text-white text-sm">المستخدمون ({users.length})</h3>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">جارٍ التحميل...</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map(u => {
                const rc = roleConfig[u.Role] || roleConfig.user;
                const Icon = rc.icon;
                return (
                  <div key={u.UserID} className={`flex items-center justify-between p-4 hover:bg-gray-50/60 transition-colors ${!u.IsActive ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rc.color}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">{u.FullName}</h4>
                        <p className="text-xs text-gray-400">@{u.Username}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${rc.color}`}>{rc.label}</span>
                      {!u.IsActive && <span className="px-2 py-0.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold">معطل</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(u)}
                        className="flex items-center gap-1 bg-accent-50 text-accent-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-accent-100 transition-all">
                        <UserCog size={13} /> تعديل
                      </button>
                      <button onClick={() => { setShowResetPw(u.UserID); setNewPw(''); setMsg(''); }}
                        className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-all">
                        <Key size={13} /> كلمة المرور
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 modal-backdrop flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md animate-modal-in"
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.12), 0 32px 80px rgba(0,0,0,0.08)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">مستخدم جديد</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"><X size={17} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              {msg && <div className="bg-red-50 text-red-700 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ border: '1px solid rgba(225,45,57,0.15)' }}>{msg}</div>}
              <div>
                <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">الاسم الكامل *</label>
                <input type="text" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="input-field" placeholder="مثال: أحمد محمد" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">اسم المستخدم *</label>
                <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="input-field" placeholder="مثال: ahmed" dir="ltr" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">كلمة المرور *</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-600 mb-2">الصلاحية</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(roleConfig).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button key={key} type="button"
                        onClick={() => setForm(f => ({ ...f, role: key }))}
                        className={`flex items-center gap-2 p-3 rounded-xl transition-all text-sm ${form.role === key ? 'bg-accent-50 ring-2 ring-accent-500/30' : 'bg-gray-50 hover:bg-gray-100'}`}
                        style={{ border: form.role === key ? '1px solid rgba(9,103,210,0.2)' : '1px solid rgba(0,0,0,0.04)' }}>
                        <Icon size={16} className={form.role === key ? 'text-accent-600' : 'text-gray-400'} />
                        <div className="text-right">
                          <p className="font-bold text-sm">{cfg.label}</p>
                          <p className="text-[11px] text-gray-400">{cfg.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-5 border-t border-gray-100">
                <button onClick={handleCreate} disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save size={15} /> {saving ? 'جارٍ الحفظ...' : 'إنشاء'}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-outline">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User + Permissions Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 modal-backdrop flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setEditUser(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modal-in"
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.12), 0 32px 80px rgba(0,0,0,0.08)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm rounded-t-2xl z-10">
              <h2 className="text-base font-bold text-gray-800">تعديل المستخدم - {editUser.FullName}</h2>
              <button onClick={() => setEditUser(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"><X size={17} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-5">
              {msg && <div className="bg-red-50 text-red-700 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ border: '1px solid rgba(225,45,57,0.15)' }}>{msg}</div>}

              <div>
                <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">الاسم الكامل</label>
                <input type="text" value={editUser.FullName} onChange={e => setEditUser(u => ({ ...u, FullName: e.target.value }))} className="input-field" />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-600 mb-2">نوع الحساب</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(roleConfig).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button key={key} type="button"
                        onClick={() => setEditUser(u => ({ ...u, Role: key }))}
                        className={`flex items-center gap-2 p-3 rounded-xl transition-all text-sm ${editUser.Role === key ? 'bg-accent-50 ring-2 ring-accent-500/30' : 'bg-gray-50 hover:bg-gray-100'}`}
                        style={{ border: editUser.Role === key ? '1px solid rgba(9,103,210,0.2)' : '1px solid rgba(0,0,0,0.04)' }}>
                        <Icon size={16} className={editUser.Role === key ? 'text-accent-600' : 'text-gray-400'} />
                        <div className="text-right">
                          <p className="font-bold text-sm">{cfg.label}</p>
                          <p className="text-[11px] text-gray-400">{cfg.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl p-4" style={{ background: '#f8f9fb' }}>
                <span className="font-semibold text-sm text-gray-700">حالة الحساب</span>
                <button onClick={() => setEditUser(u => ({ ...u, IsActive: u.IsActive ? 0 : 1 }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${editUser.IsActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
                  style={{ border: editUser.IsActive ? '1px solid rgba(39,171,131,0.15)' : '1px solid rgba(225,45,57,0.15)' }}>
                  {editUser.IsActive ? <><ToggleRight size={16} /> مفعل</> : <><ToggleLeft size={16} /> معطل</>}
                </button>
              </div>

              {editUser.Role !== 'admin' && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #102a43, #243b53)' }}>
                    <h3 className="font-bold text-sm text-white">الصلاحيات</h3>
                    <div className="flex gap-1.5">
                      <button onClick={selectAllPerms} className="text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all"
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>تحديد الكل</button>
                      <button onClick={clearAllPerms} className="text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all"
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>إلغاء الكل</button>
                    </div>
                  </div>

                  <div className="p-4 border-b border-gray-100">
                    <h4 className="text-[11px] font-bold text-gray-400 mb-3 tracking-wide">الأقسام المسموح الوصول إليها</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {sectionPerms.map(p => (
                        <label key={p.key}
                          className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all text-sm ${editPerms.includes(p.key) ? 'bg-accent-50 text-accent-800' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                          style={{ border: editPerms.includes(p.key) ? '1px solid rgba(9,103,210,0.2)' : '1px solid rgba(0,0,0,0.04)' }}>
                          <div className={`w-4.5 h-4.5 rounded flex items-center justify-center transition-all flex-shrink-0 ${editPerms.includes(p.key) ? 'bg-accent-600' : 'border border-gray-300'}`}
                            style={{ width: '18px', height: '18px' }}>
                            {editPerms.includes(p.key) && <Check size={11} className="text-white" />}
                          </div>
                          <span className="font-semibold text-xs">{p.label}</span>
                          <input type="checkbox" checked={editPerms.includes(p.key)} onChange={() => togglePerm(p.key)} className="hidden" />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-4">
                    <h4 className="text-[11px] font-bold text-gray-400 mb-3 tracking-wide">العمليات المسموحة</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {actionPerms.map(p => (
                        <label key={p.key}
                          className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all text-sm ${editPerms.includes(p.key) ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                          style={{ border: editPerms.includes(p.key) ? '1px solid rgba(39,171,131,0.15)' : '1px solid rgba(0,0,0,0.04)' }}>
                          <div className={`w-4.5 h-4.5 rounded flex items-center justify-center transition-all flex-shrink-0 ${editPerms.includes(p.key) ? 'bg-emerald-600' : 'border border-gray-300'}`}
                            style={{ width: '18px', height: '18px' }}>
                            {editPerms.includes(p.key) && <Check size={11} className="text-white" />}
                          </div>
                          <span className="font-semibold text-xs">{p.label}</span>
                          <input type="checkbox" checked={editPerms.includes(p.key)} onChange={() => togglePerm(p.key)} className="hidden" />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {editUser.Role === 'admin' && (
                <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
                  style={{ border: '1px solid rgba(233,185,73,0.2)' }}>
                  <ShieldAlert size={15} />
                  المدير لديه جميع الصلاحيات تلقائياً
                </div>
              )}

              <div className="flex gap-3 pt-5 border-t border-gray-100">
                <button onClick={handleUpdate} disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save size={15} /> {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button onClick={() => setEditUser(null)} className="btn-outline">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPw && (
        <div className="fixed inset-0 bg-black/40 modal-backdrop flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setShowResetPw(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm animate-modal-in"
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.12), 0 32px 80px rgba(0,0,0,0.08)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">إعادة تعيين كلمة المرور</h2>
              <button onClick={() => setShowResetPw(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"><X size={17} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              {msg && <div className="bg-red-50 text-red-700 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ border: '1px solid rgba(225,45,57,0.15)' }}>{msg}</div>}
              <div>
                <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">كلمة المرور الجديدة</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="input-field" dir="ltr" autoFocus />
              </div>
              <div className="flex gap-3 pt-5 border-t border-gray-100">
                <button onClick={handleResetPassword} disabled={saving} className="btn-primary flex items-center gap-2">
                  <Key size={15} /> {saving ? 'جارٍ...' : 'تعيين'}
                </button>
                <button onClick={() => setShowResetPw(null)} className="btn-outline">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

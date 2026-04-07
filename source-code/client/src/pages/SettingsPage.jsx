import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Users, Key, Database } from 'lucide-react';

export default function SettingsPage() {
  const { api, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '' });
  const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', role: 'user' });
  const [msg, setMsg] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.Role === 'admin';

  useEffect(() => {
    if (isAdmin) api('/auth/users').then(setUsers).catch(() => {});
  }, []);

  const changePassword = async () => {
    try {
      await api('/auth/change-password', { method: 'PUT', body: JSON.stringify(passForm) });
      setMsg('تم تغيير كلمة المرور بنجاح'); setPassForm({ oldPassword: '', newPassword: '' });
    } catch (e) { setMsg(e.message); }
    setTimeout(() => setMsg(''), 3000);
  };

  const addUser = async () => {
    try {
      await api('/auth/users', { method: 'POST', body: JSON.stringify(newUser) });
      setMsg('تم إنشاء المستخدم بنجاح');
      setShowAddUser(false); setNewUser({ username: '', password: '', fullName: '', role: 'user' });
      api('/auth/users').then(setUsers);
    } catch (e) { setMsg(e.message); }
    setTimeout(() => setMsg(''), 3000);
  };

  const roleLabels = { admin: 'مدير النظام', manager: 'مدير', user: 'مستخدم', viewer: 'مشاهد' };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">الإعدادات</h1>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{msg}</div>}

      {/* Change Password */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Key size={24} className="text-primary-600" />
          <h2 className="text-lg font-bold">تغيير كلمة المرور</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">كلمة المرور الحالية</label>
            <input type="password" value={passForm.oldPassword} onChange={e => setPassForm(f => ({ ...f, oldPassword: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">كلمة المرور الجديدة</label>
            <input type="password" value={passForm.newPassword} onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))} className="input-field" />
          </div>
        </div>
        <button onClick={changePassword} className="btn-primary mt-4">تغيير كلمة المرور</button>
      </div>

      {/* User Management (Admin only) */}
      {isAdmin && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users size={24} className="text-primary-600" />
              <h2 className="text-lg font-bold">إدارة المستخدمين</h2>
            </div>
            <button onClick={() => setShowAddUser(true)} className="btn-primary text-sm">+ إضافة مستخدم</button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-right border-b">
                <th className="pb-2 font-medium">الاسم</th>
                <th className="pb-2 font-medium">المستخدم</th>
                <th className="pb-2 font-medium">الصلاحية</th>
                <th className="pb-2 font-medium">الحالة</th>
                <th className="pb-2 font-medium">آخر دخول</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.UserID} className="border-b border-gray-50">
                  <td className="py-3 font-medium">{u.FullName}</td>
                  <td className="py-3 text-gray-600">{u.Username}</td>
                  <td className="py-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{roleLabels[u.Role]}</span></td>
                  <td className="py-3"><span className={`px-2 py-0.5 rounded text-xs ${u.IsActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.IsActive ? 'نشط' : 'معطل'}</span></td>
                  <td className="py-3 text-gray-500 text-xs">{u.LastLogin || 'لم يسجل دخول'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {showAddUser && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <h3 className="font-bold">مستخدم جديد</h3>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="اسم المستخدم" value={newUser.username} onChange={e => setNewUser(f => ({ ...f, username: e.target.value }))} className="input-field" />
                <input type="text" placeholder="الاسم الكامل" value={newUser.fullName} onChange={e => setNewUser(f => ({ ...f, fullName: e.target.value }))} className="input-field" />
                <input type="password" placeholder="كلمة المرور" value={newUser.password} onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))} className="input-field" />
                <select value={newUser.role} onChange={e => setNewUser(f => ({ ...f, role: e.target.value }))} className="input-field">
                  <option value="user">مستخدم</option>
                  <option value="manager">مدير</option>
                  <option value="admin">مدير النظام</option>
                  <option value="viewer">مشاهد</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={addUser} className="btn-primary text-sm">إنشاء</button>
                <button onClick={() => setShowAddUser(false)} className="btn-outline text-sm">إلغاء</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* System Info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Database size={24} className="text-primary-600" />
          <h2 className="text-lg font-bold">معلومات النظام</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500">الإصدار</p>
            <p className="font-bold">2.0.0</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500">قاعدة البيانات</p>
            <p className="font-bold">SQLite</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500">الصلاحيات</p>
            <p className="font-bold">{roleLabels[user?.role || user?.Role]}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500">المستخدم الحالي</p>
            <p className="font-bold">{user?.fullName || user?.FullName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

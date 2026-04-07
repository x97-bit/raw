import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { Plus, DollarSign, Trash2, Edit, Receipt, X } from 'lucide-react';
import ExportButtons from '../components/ExportButtons';

const formatNum = n => n ? Number(n).toLocaleString('en-US') : '0';

const PORT_OPTIONS = [
  { value: 'general', label: 'مصاريف عام' },
  { value: 'port-2', label: 'مصاريف المنذرية' },
  { value: 'port-3', label: 'مصاريف القائم' },
];

const COLUMNS = [
  { key: 'expense_date', dataKey: 'expenseDate', label: 'التاريخ', render: v => v?.split(' ')[0] || '-' },
  { key: 'description', dataKey: 'description', label: 'الوصف', render: v => v || '-' },
  { key: 'amount_usd', dataKey: 'amountUSD', label: 'المبلغ ($)', render: v => v && v !== '0' ? `$${formatNum(v)}` : '-', bold: true },
  { key: 'amount_iqd', dataKey: 'amountIQD', label: 'المبلغ (د.ع)', render: v => v && v !== '0' ? formatNum(v) : '-' },
  { key: 'port_id', dataKey: 'portId', label: 'القسم', render: v => PORT_OPTIONS.find(p => p.value === v)?.label || v || '-' },
];

export default function ExpensesPage({ onBack }) {
  const { api, can } = useAuth();
  const [data, setData] = useState({ expenses: [], summary: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [filterPort, setFilterPort] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const d = await api('/reports/expenses-summary');
      setData(d);
    } catch (e) {
      console.error('Error loading expenses:', e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (editId) {
      await api(`/expenses/${editId}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await api('/expenses', { method: 'POST', body: JSON.stringify(form) });
    }
    setShowForm(false); setForm({}); setEditId(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm('هل تريد حذف هذا المصروف؟')) return;
    await api(`/expenses/${id}`, { method: 'DELETE' });
    load();
  };

  const handleEdit = (expense) => {
    setForm({
      expenseDate: expense.expenseDate?.split(' ')[0] || '',
      amountUSD: expense.amountUSD || '',
      amountIQD: expense.amountIQD || '',
      description: expense.description || '',
      portId: expense.portId || 'general',
    });
    setEditId(expense.id);
    setShowForm(true);
  };

  const filteredExpenses = filterPort
    ? data.expenses.filter(e => e.portId === filterPort)
    : data.expenses;

  const totalUSD = filteredExpenses.reduce((s, e) => s + parseFloat(e.amountUSD || '0'), 0);
  const totalIQD = filteredExpenses.reduce((s, e) => s + parseFloat(e.amountIQD || '0'), 0);

  return (
    <div className="page-shell">
      <PageHeader title="المصاريف" subtitle="الصفحة الرئيسية" onBack={onBack}>
        {filteredExpenses.length > 0 && (
          <ExportButtons inHeader
            rows={filteredExpenses}
            columns={COLUMNS.map(c => ({ key: c.dataKey, label: c.label }))}
            title="المصاريف"
            filename="المصاريف"
          />
        )}
        {can.manageDebts && (
          <button onClick={() => { setForm({ expenseDate: new Date().toISOString().split('T')[0], portId: 'general' }); setEditId(null); setShowForm(true); }}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all text-sm font-medium">
            <Plus size={16} /> إضافة مصروف
          </button>
        )}
      </PageHeader>

      <div className="p-5 space-y-5">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">جارٍ التحميل...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total card */}
              <div className={`stat-card-modern cursor-pointer transition-all ${!filterPort ? 'ring-2 ring-primary-500 bg-primary-50/30' : 'hover:shadow-md'}`}
                onClick={() => setFilterPort('')}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
                    <Receipt size={20} className="text-accent-600" />
                  </div>
                  <h3 className="font-bold text-primary-900">إجمالي المصاريف</h3>
                </div>
                <p className="text-xl font-bold text-accent-600">${formatNum(data.totals.totalUSD || 0)}</p>
                {(data.totals.totalIQD || 0) != 0 && <p className="text-sm text-gray-600 mt-1">{formatNum(data.totals.totalIQD)} د.ع</p>}
                <p className="text-xs text-gray-400 mt-1.5">{data.totals.count || 0} مصروف</p>
              </div>

              {data.summary.map(s => (
                <div key={s.portId}
                  className={`stat-card-modern cursor-pointer transition-all ${filterPort === s.portId ? 'ring-2 ring-primary-500 bg-primary-50/30' : 'hover:shadow-md'}`}
                  onClick={() => setFilterPort(filterPort === s.portId ? '' : s.portId)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                      <DollarSign size={20} className="text-orange-600" />
                    </div>
                    <h3 className="font-bold text-primary-900">{s.label}</h3>
                  </div>
                  <p className="text-xl font-bold text-orange-600">${formatNum(s.totalUSD)}</p>
                  {s.totalIQD != 0 && <p className="text-sm text-gray-600 mt-1">{formatNum(s.totalIQD)} د.ع</p>}
                  <p className="text-xs text-gray-400 mt-1.5">{s.count} مصروف</p>
                </div>
              ))}
            </div>

            {/* Totals bar */}
            <div className="flex items-center gap-4 surface-card px-5 py-3.5">
              <span className="text-sm text-gray-500">المجموع:</span>
              <span className="font-bold text-accent-600">${formatNum(totalUSD)}</span>
              {totalIQD != 0 && <span className="font-bold text-gray-700">{formatNum(totalIQD)} د.ع</span>}
              <span className="text-xs text-gray-400 mr-auto">{filteredExpenses.length} مصروف</span>
            </div>

            {/* Expenses Table */}
            <div className="surface-card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                      {COLUMNS.map(col => (
                        <th key={col.key} className="px-4 py-3 font-semibold">{col.label}</th>
                      ))}
                      <th className="px-4 py-3 w-20 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length === 0 ? (
                      <tr><td colSpan={COLUMNS.length + 1} className="text-center py-12 text-gray-400">لا توجد مصاريف</td></tr>
                    ) : (
                      filteredExpenses.map(e => (
                        <tr key={e.id} className="border-b border-gray-50 hover:bg-primary-50/50 transition-colors">
                          {COLUMNS.map(col => (
                            <td key={col.key} className={`px-4 py-3 ${col.bold ? 'font-bold text-accent-600' : ''}`}>
                              {col.render(e[col.dataKey])}
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => handleEdit(e)} className="w-7 h-7 flex items-center justify-center hover:bg-accent-50 rounded-lg text-accent-600 transition-colors" title="تعديل">
                                <Edit size={14} />
                              </button>
                              <button onClick={() => handleDelete(e.id)} className="w-7 h-7 flex items-center justify-center hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="حذف">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 modal-backdrop flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg animate-modal-in shadow-[0_8px_40px_rgba(0,0,0,0.15)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
              <h2 className="text-lg font-bold text-primary-900">{editId ? 'تعديل مصروف' : 'إضافة مصروف جديد'}</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">التاريخ</label>
                  <input type="date" value={form.expenseDate || ''} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">القسم</label>
                  <select value={form.portId || 'general'} onChange={e => setForm(f => ({ ...f, portId: e.target.value }))} className="input-field">
                    {PORT_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">المبلغ ($)</label>
                  <input type="number" step="0.01" value={form.amountUSD || ''} onChange={e => setForm(f => ({ ...f, amountUSD: e.target.value }))} className="input-field" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">المبلغ (د.ع)</label>
                  <input type="number" value={form.amountIQD || ''} onChange={e => setForm(f => ({ ...f, amountIQD: e.target.value }))} className="input-field" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الوصف</label>
                <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field" rows="3" placeholder="وصف المصروف..." />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button onClick={handleSave} className="btn-primary flex-1">{editId ? 'تحديث' : 'حفظ'}</button>
                <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn-outline">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

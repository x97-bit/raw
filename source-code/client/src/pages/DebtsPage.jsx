import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { Plus, DollarSign, Eye, X } from 'lucide-react';
import ExportButtons from '../components/ExportButtons';
import AutocompleteInput from '../components/AutocompleteInput';

const formatNum = n => n ? Number(n).toLocaleString('en-US') : '0';

// Per-debtor field definitions matching original Access DB
const DEBTOR_CONFIGS = {
  basim: {
    label: 'باسم',
    columns: [
      { key: 'trans_date', dataKey: 'TransDate', label: 'التاريخ', render: v => v?.split(' ')[0] || '-' },
      { key: 'amount_usd', dataKey: 'AmountUSD', label: 'المبلغ ($)', render: v => v ? `$${formatNum(v)}` : '-', bold: true, color: true },
      { key: 'fee_usd', dataKey: 'FeeUSD', label: 'الرسوم ($)', render: v => v ? `$${formatNum(v)}` : '-' },
      { key: 'amount_iqd', dataKey: 'AmountIQD', label: 'المبلغ (د.ع)', render: v => v ? formatNum(v) : '-' },
      { key: 'fee_iqd', dataKey: 'FeeIQD', label: 'الرسوم (د.ع)', render: v => v ? formatNum(v) : '-' },
      { key: 'trans_type', dataKey: 'TransType', label: 'النوع', render: v => v || '-' },
      { key: 'state', dataKey: 'State', label: 'الحالة', render: v => v || '-' },
      { key: 'notes', dataKey: 'Notes', label: 'ملاحظات', render: v => v || '', isNotes: true },
    ],
    formFields: [
      { key: 'TransDate', label: 'التاريخ', type: 'date' },
      { key: 'AmountUSD', label: 'المبلغ ($)', type: 'number' },
      { key: 'FeeUSD', label: 'الرسوم ($)', type: 'number' },
      { key: 'AmountIQD', label: 'المبلغ (د.ع)', type: 'number' },
      { key: 'FeeIQD', label: 'الرسوم (د.ع)', type: 'number' },
      { key: 'TransType', label: 'النوع', type: 'text' },
      { key: 'State', label: 'الحالة', type: 'select', options: ['مسدد', 'غير مسدد'] },
      { key: 'Notes', label: 'ملاحظات', type: 'textarea' },
    ],
  },
  noman: {
    label: 'نعمان',
    columns: [
      { key: 'trans_date', dataKey: 'TransDate', label: 'التاريخ', render: v => v?.split(' ')[0] || '-' },
      { key: 'amount_usd', dataKey: 'AmountUSD', label: 'المبلغ ($)', render: v => v ? `$${formatNum(v)}` : '-', bold: true, color: true },
      { key: 'fee_usd', dataKey: 'FeeUSD', label: 'الرسوم ($)', render: v => v ? `$${formatNum(v)}` : '-' },
      { key: 'amount_iqd', dataKey: 'AmountIQD', label: 'المبلغ (د.ع)', render: v => v ? formatNum(v) : '-' },
      { key: 'fee_iqd', dataKey: 'FeeIQD', label: 'الرسوم (د.ع)', render: v => v ? formatNum(v) : '-' },
      { key: 'trans_type', dataKey: 'TransType', label: 'النوع', render: v => v || '-' },
      { key: 'state', dataKey: 'State', label: 'الحالة', render: v => v || '-' },
      { key: 'notes', dataKey: 'Notes', label: 'ملاحظات', render: v => v || '', isNotes: true },
    ],
    formFields: [
      { key: 'TransDate', label: 'التاريخ', type: 'date' },
      { key: 'AmountUSD', label: 'المبلغ ($)', type: 'number' },
      { key: 'FeeUSD', label: 'الرسوم ($)', type: 'number' },
      { key: 'AmountIQD', label: 'المبلغ (د.ع)', type: 'number' },
      { key: 'FeeIQD', label: 'الرسوم (د.ع)', type: 'number' },
      { key: 'TransType', label: 'النوع', type: 'text' },
      { key: 'State', label: 'الحالة', type: 'select', options: ['مسدد', 'غير مسدد'] },
      { key: 'Notes', label: 'ملاحظات', type: 'textarea' },
    ],
  },
  luay: {
    label: 'لؤي',
    columns: [
      { key: 'trans_date', dataKey: 'TransDate', label: 'التاريخ', render: v => v?.split(' ')[0] || '-' },
      { key: 'driver_name', dataKey: 'DriverName', label: 'السائق', render: v => v || '-' },
      { key: 'vehicle_plate', dataKey: 'VehiclePlate', label: 'السيارة', render: v => v || '-' },
      { key: 'good_type', dataKey: 'GoodTypeName', label: 'البضاعة', render: v => v || '-' },
      { key: 'weight', dataKey: 'Weight', label: 'الوزن', render: v => v ? formatNum(v) : '-' },
      { key: 'amount_usd', dataKey: 'AmountUSD', label: 'المبلغ ($)', render: v => v ? `$${formatNum(v)}` : '-', bold: true, color: true },
      { key: 'cost_usd', dataKey: 'CostUSD', label: 'التكلفة ($)', render: v => v ? `$${formatNum(v)}` : '-' },
      { key: 'notes', dataKey: 'Notes', label: 'ملاحظات', render: v => v || '', isNotes: true },
    ],
    formFields: [
      { key: 'TransDate', label: 'التاريخ', type: 'date' },
      { key: 'DriverName', label: 'السائق', type: 'text' },
      { key: 'VehiclePlate', label: 'السيارة', type: 'text' },
      { key: 'GoodTypeName', label: 'البضاعة', type: 'text' },
      { key: 'Weight', label: 'الوزن', type: 'number' },
      { key: 'AmountUSD', label: 'المبلغ ($)', type: 'number' },
      { key: 'CostUSD', label: 'التكلفة ($)', type: 'number' },
      { key: 'Notes', label: 'ملاحظات', type: 'textarea' },
    ],
  },
  luay2: {
    label: 'لؤي 2',
    columns: [
      { key: 'trans_date', dataKey: 'TransDate', label: 'التاريخ', render: v => v?.split(' ')[0] || '-' },
      { key: 'amount_usd', dataKey: 'AmountUSD', label: 'المبلغ ($)', render: v => v ? `$${formatNum(v)}` : '-', bold: true, color: true },
      { key: 'trans_type', dataKey: 'TransType', label: 'النوع', render: v => v || '-' },
      { key: 'amount_iqd', dataKey: 'AmountIQD', label: 'المبلغ (د.ع)', render: v => v ? formatNum(v) : '-' },
      { key: 'notes', dataKey: 'Notes', label: 'ملاحظات', render: v => v || '', isNotes: true },
    ],
    formFields: [
      { key: 'TransDate', label: 'التاريخ', type: 'date' },
      { key: 'AmountUSD', label: 'المبلغ ($)', type: 'number' },
      { key: 'TransType', label: 'النوع', type: 'text' },
      { key: 'AmountIQD', label: 'المبلغ (د.ع)', type: 'number' },
      { key: 'Notes', label: 'ملاحظات', type: 'textarea' },
    ],
  },
  abdalkarem: {
    label: 'عبد الكريم',
    columns: [
      { key: 'trans_date', dataKey: 'TransDate', label: 'التاريخ', render: v => v?.split(' ')[0] || '-' },
      { key: 'driver_name', dataKey: 'DriverName', label: 'السائق', render: v => v || '-' },
      { key: 'vehicle_plate', dataKey: 'VehiclePlate', label: 'السيارة', render: v => v || '-' },
      { key: 'good_type', dataKey: 'GoodTypeName', label: 'البضاعة', render: v => v || '-' },
      { key: 'qty', dataKey: 'Qty', label: 'الكمية', render: v => v ? formatNum(v) : '-' },
      { key: 'amount_usd', dataKey: 'AmountUSD', label: 'المبلغ ($)', render: v => v ? `$${formatNum(v)}` : '-', bold: true, color: true },
      { key: 'amount_iqd', dataKey: 'AmountIQD', label: 'المبلغ (د.ع)', render: v => v ? formatNum(v) : '-' },
      { key: 'account_name', dataKey: 'AccountName', label: 'التاجر', render: v => v || '-' },
      { key: 'port_name', dataKey: 'PortName', label: 'المنفذ', render: v => v || '-' },
      { key: 'notes', dataKey: 'Notes', label: 'ملاحظات', render: v => v || '', isNotes: true },
    ],
    formFields: [
      { key: 'TransDate', label: 'التاريخ', type: 'date' },
      { key: 'DriverName', label: 'السائق', type: 'text' },
      { key: 'VehiclePlate', label: 'السيارة', type: 'text' },
      { key: 'GoodTypeName', label: 'البضاعة', type: 'text' },
      { key: 'Qty', label: 'الكمية', type: 'number' },
      { key: 'AmountUSD', label: 'المبلغ ($)', type: 'number' },
      { key: 'AmountIQD', label: 'المبلغ (د.ع)', type: 'number' },
      { key: 'AccountName', label: 'التاجر', type: 'text' },
      { key: 'PortName', label: 'المنفذ', type: 'text' },
      { key: 'Notes', label: 'ملاحظات', type: 'textarea' },
    ],
  },
};

const DEFAULT_COLUMNS = [
  { key: 'trans_date', dataKey: 'TransDate', label: 'التاريخ', render: v => v?.split(' ')[0] || '-' },
  { key: 'amount_usd', dataKey: 'AmountUSD', label: 'المبلغ ($)', render: v => v ? `$${formatNum(v)}` : '-', bold: true, color: true },
  { key: 'amount_iqd', dataKey: 'AmountIQD', label: 'المبلغ (د.ع)', render: v => v ? formatNum(v) : '-' },
  { key: 'notes', dataKey: 'Notes', label: 'ملاحظات', render: v => v || '', isNotes: true },
];

const DEFAULT_FORM_FIELDS = [
  { key: 'TransDate', label: 'التاريخ', type: 'date' },
  { key: 'AmountUSD', label: 'المبلغ ($)', type: 'number' },
  { key: 'AmountIQD', label: 'المبلغ (د.ع)', type: 'number' },
  { key: 'Notes', label: 'ملاحظات', type: 'textarea' },
];

function getDebtorKey(accountName) {
  if (!accountName) return null;
  const name = accountName.trim().toLowerCase();
  if (name.includes('باسم')) return 'basim';
  if (name.includes('نعمان') || name.includes('نومان')) return 'noman';
  if (name.includes('لؤي 2') || name.includes('لؤي2')) return 'luay2';
  if (name.includes('لؤي')) return 'luay';
  if (name.includes('عبد الكريم') || name.includes('عبدالكريم')) return 'abdalkarem';
  return null;
}

function getDebtorConfig(accountName) {
  const key = getDebtorKey(accountName);
  return key ? DEBTOR_CONFIGS[key] : null;
}

export default function DebtsPage({ onBack }) {
  const { api, can } = useAuth();
  const [data, setData] = useState({ debts: [], summary: [] });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [filterAccount, setFilterAccount] = useState('');
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [accountText, setAccountText] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [d, a] = await Promise.all([api('/reports/debts-summary'), api('/accounts?type=4')]);
    setData(d); setAccounts(a); setLoading(false);
  };

  const handleSave = async () => {
    await api('/debts', { method: 'POST', body: JSON.stringify(form) });
    setShowForm(false); setForm({}); setAccountText(''); load();
  };

  const filteredDebts = filterAccount ? data.debts.filter(d => d.AccountID == filterAccount) : data.debts;

  const activeAccountName = filterAccount
    ? data.summary.find(s => s.AccountID == filterAccount)?.AccountName
    : null;
  const activeConfig = getDebtorConfig(activeAccountName);
  const activeCols = activeConfig?.columns || DEFAULT_COLUMNS;
  const activeFormFields = activeConfig?.formFields || DEFAULT_FORM_FIELDS;

  const formAccountName = accountText || '';
  const formConfig = getDebtorConfig(formAccountName);
  const formFields = formConfig?.formFields || DEFAULT_FORM_FIELDS;

  return (
    <div className="page-shell">
      <PageHeader title="الديون" subtitle="الصفحة الرئيسية" onBack={onBack}>
        {filteredDebts.length > 0 && (
          <ExportButtons inHeader
            rows={filteredDebts}
            columns={activeCols.map(c => ({ key: c.dataKey, label: c.label }))}
            title="الديون"
            filename="الديون"
          />
        )}
        {can.manageDebts && (
          <button onClick={() => { setForm({ TransDate: new Date().toISOString().split('T')[0] }); setAccountText(''); setShowForm(true); }}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all text-sm font-medium">
            <Plus size={16} /> إضافة دين
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {data.summary.map(s => {
                const config = getDebtorConfig(s.AccountName);
                return (
                  <div key={s.AccountID}
                    className={`stat-card-modern cursor-pointer transition-all ${filterAccount == s.AccountID ? 'ring-2 ring-primary-500 bg-primary-50/30' : 'hover:shadow-md'}`}
                    onClick={() => setFilterAccount(filterAccount == s.AccountID ? '' : s.AccountID)}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                        <DollarSign size={20} className="text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-primary-900">{s.AccountName}</h3>
                        {config && <span className="text-xs text-gray-400">{config.columns.length} حقل</span>}
                      </div>
                    </div>
                    <p className="text-xl font-bold text-red-600">${formatNum(s.totalUSD)}</p>
                    {s.totalIQD != 0 && <p className="text-sm text-gray-600 mt-1">{formatNum(s.totalIQD)} د.ع</p>}
                    <p className="text-xs text-gray-400 mt-1.5">{s.count} عملية</p>
                  </div>
                );
              })}
            </div>

            {/* Active filter indicator */}
            {filterAccount && activeAccountName && (
              <div className="flex items-center gap-2.5 surface-card px-5 py-3">
                <Eye size={16} className="text-primary-600" />
                <span className="text-sm font-semibold text-primary-800">عرض ديون: {activeAccountName}</span>
                {activeConfig && <span className="text-xs text-primary-500">({activeConfig.columns.length} حقل مخصص)</span>}
                <button onClick={() => setFilterAccount('')} className="mr-auto text-xs text-primary-600 hover:text-primary-800 font-medium underline underline-offset-2">عرض الكل</button>
              </div>
            )}

            {/* Debts Table */}
            <div className="surface-card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                      {activeCols.map(col => (
                        <th key={col.key} className="px-4 py-3 font-semibold">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDebts.length === 0 ? (
                      <tr><td colSpan={activeCols.length} className="text-center py-12 text-gray-400">لا توجد ديون</td></tr>
                    ) : (
                      filteredDebts.map(d => (
                        <tr key={d.DebtID} onClick={() => setSelectedDebt(d)} className="border-b border-gray-50 hover:bg-primary-50/50 cursor-pointer transition-colors">
                          {activeCols.map(col => (
                            <td key={col.key} className={`px-4 py-3 ${col.bold ? 'font-bold' : ''} ${col.color && (d[col.dataKey] || 0) < 0 ? 'text-red-600' : col.color ? 'text-emerald-600' : ''} ${col.isNotes ? 'text-gray-500 text-xs max-w-[200px] truncate' : ''}`}>
                              {col.render(d[col.dataKey])}
                            </td>
                          ))}
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

      {/* Debt Preview Modal */}
      {selectedDebt && (() => {
        const debtConfig = getDebtorConfig(selectedDebt.AccountName);
        const previewCols = debtConfig?.columns || DEFAULT_COLUMNS;
        return (
          <div className="fixed inset-0 bg-black/40 modal-backdrop flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={e => e.target === e.currentTarget && setSelectedDebt(null)}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg animate-modal-in shadow-[0_8px_40px_rgba(0,0,0,0.15)]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <button onClick={() => setSelectedDebt(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
                <h2 className="text-lg font-bold text-primary-900">معاينة الدين - {selectedDebt.AccountName}</h2>
              </div>

              <div className="p-5 grid grid-cols-2 gap-3">
                {previewCols.filter(c => !c.isNotes).map((col, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3.5">
                    <span className="text-xs text-gray-500 block mb-1">{col.label}</span>
                    <p className={`font-semibold ${col.bold ? 'text-lg' : ''} ${col.color && (selectedDebt[col.dataKey] || 0) < 0 ? 'text-red-600' : col.color ? 'text-emerald-600' : 'text-primary-900'}`}>
                      {col.render(selectedDebt[col.dataKey])}
                    </p>
                  </div>
                ))}
              </div>
              {selectedDebt.Notes && (
                <div className="px-5 pb-5">
                  <div className="bg-amber-50/60 ring-1 ring-amber-100 rounded-xl p-4">
                    <span className="text-xs text-amber-700 font-semibold block mb-1">ملاحظات</span>
                    <p className="text-sm text-gray-700">{selectedDebt.Notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 modal-backdrop flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg animate-modal-in shadow-[0_8px_40px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm flex items-center justify-between px-6 py-4 border-b border-gray-100 z-10">
              <button onClick={() => { setShowForm(false); setAccountText(''); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
              <h2 className="text-lg font-bold text-primary-900">إضافة دين جديد</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Account selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الشخص</label>
                <AutocompleteInput
                  value={accountText}
                  options={accounts}
                  labelKey="AccountName"
                  valueKey="AccountID"
                  onChange={(text) => { setAccountText(text); setForm(f => ({ ...f, AccountID: null })); }}
                  onSelect={(acc) => { setAccountText(acc.AccountName); setForm(f => ({ ...f, AccountID: acc.AccountID })); }}
                  placeholder="ابدأ بكتابة اسم الشخص..."
                  className="input-field"
                />
                {formConfig && (
                  <p className="text-xs text-primary-600 mt-1.5">نموذج: {formConfig.label} ({formConfig.formFields.length} حقل)</p>
                )}
              </div>

              {/* Dynamic form fields */}
              <div className="grid grid-cols-2 gap-4">
                {formFields.map(field => {
                  if (field.type === 'textarea') return null;
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                      {field.type === 'select' ? (
                        <select value={form[field.key] || ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className="input-field">
                          <option value="">اختر</option>
                          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          step={field.type === 'number' ? '0.01' : undefined}
                          value={form[field.key] || ''}
                          onChange={e => setForm(f => ({ ...f, [field.key]: field.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value }))}
                          className="input-field"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Notes field */}
              {formFields.find(f => f.type === 'textarea') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ملاحظات</label>
                  <textarea value={form.Notes || ''} onChange={e => setForm(f => ({ ...f, Notes: e.target.value }))} className="input-field" rows="2" />
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button onClick={handleSave} className="btn-primary flex-1">حفظ</button>
                <button onClick={() => { setShowForm(false); setAccountText(''); }} className="btn-outline">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

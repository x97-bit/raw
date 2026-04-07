import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { Plus, TrendingUp, Receipt, Users, BarChart3 } from 'lucide-react';
import ExportButtons from '../components/ExportButtons';
import TransactionModal from '../components/TransactionModal';
import AutocompleteInput from '../components/AutocompleteInput';

const formatNum = n => n ? Number(n).toLocaleString('en-US') : '0';

const ports = [
  { id: 'port-1', name: 'السعودية', icon: '🇸🇦' },
  { id: 'port-2', name: 'المنذرية', icon: '🏭' },
  { id: 'port-3', name: 'القائم', icon: '🏗️' },
];

export default function ReportsPage({ onBack }) {
  const { api } = useAuth();
  const [view, setView] = useState('main');
  const [activePort, setActivePort] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [selectedTx, setSelectedTx] = useState(null);

  const [traderForm, setTraderForm] = useState({ AccountName: '', AccountTypeID: 1, DefaultCurrencyID: 1 });
  const [saving, setSaving] = useState(false);
  const [allAccounts, setAllAccounts] = useState([]);

  useEffect(() => {
    api('/accounts').then(a => setAllAccounts(a)).catch(() => {});
  }, []);

  const openAction = async (portId, action) => {
    setActivePort(ports.find(p => p.id === portId));
    if (action === 'add-trader') {
      setTraderForm({ AccountName: '', AccountTypeID: 1, DefaultCurrencyID: 1, DefaultPortID: portId });
      setView('add-trader');
    } else if (action === 'expenses') {
      setLoading(true);
      setView('expenses');
      try {
        const d = await api(`/reports/expenses/${portId}?from=${filters.from}&to=${filters.to}`);
        setData(d);
      } catch (e) { console.error(e); }
      setLoading(false);
    } else if (action === 'profits') {
      setLoading(true);
      setView('profits');
      try {
        const d = await api(`/reports/profits?port=${portId}&from=${filters.from}&to=${filters.to}`);
        setData(d);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
  };

  const handleSaveTrader = async () => {
    if (!traderForm.AccountName) return alert('ادخل اسم التاجر');
    setSaving(true);
    try {
      await api('/accounts', { method: 'POST', body: JSON.stringify(traderForm) });
      alert('تم اضافة التاجر بنجاح');
      setView('main');
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="text-center py-16">
      <div className="inline-block w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3" />
      <p className="text-gray-500 text-sm">جارٍ التحميل...</p>
    </div>
  );

  // Main view
  if (view === 'main') return (
    <div className="page-shell">
      <PageHeader title="التقارير" subtitle="الصفحة الرئيسية" onBack={onBack} />
      <div className="p-5">
        <div className="max-w-4xl mx-auto space-y-4">
          {ports.map(port => (
            <div key={port.id} className="surface-card p-0 overflow-hidden">
              <div className="bg-gradient-to-l from-primary-700 to-primary-900 text-white py-3.5 px-5 flex items-center gap-3">
                <span className="text-xl">{port.icon}</span>
                <h3 className="text-lg font-bold">{port.name}</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 p-4">
                <button onClick={() => openAction(port.id, 'add-trader')}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-800 font-semibold text-sm transition-all hover:shadow-sm">
                  <Users size={16} /> اضافة تاجر
                </button>
                <button onClick={() => openAction(port.id, 'expenses')}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 font-semibold text-sm transition-all hover:shadow-sm">
                  <Receipt size={16} /> المصاريف
                </button>
                <button onClick={() => openAction(port.id, 'profits')}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-sm transition-all hover:shadow-sm">
                  <TrendingUp size={16} /> الأرباح
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Add Trader form
  if (view === 'add-trader') return (
    <div className="page-shell">
      <PageHeader title={`اضافة تاجر - ${activePort?.name}`} subtitle="التقارير" onBack={() => setView('main')} />
      <div className="p-5 max-w-lg mx-auto">
        <div className="surface-card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم التاجر *</label>
            <AutocompleteInput
              value={traderForm.AccountName}
              options={allAccounts}
              labelKey="AccountName"
              valueKey="AccountID"
              onChange={(text) => setTraderForm(f => ({ ...f, AccountName: text }))}
              onSelect={(acc) => setTraderForm(f => ({ ...f, AccountName: acc.AccountName }))}
              placeholder="ابدأ بكتابة اسم التاجر..."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الهاتف</label>
            <input type="text" value={traderForm.Phone || ''} onChange={e => setTraderForm(f => ({ ...f, Phone: e.target.value }))}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الشركة</label>
            <input type="text" value={traderForm.Company || ''} onChange={e => setTraderForm(f => ({ ...f, Company: e.target.value }))}
              className="input-field" />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button onClick={handleSaveTrader} disabled={saving} className="btn-primary flex items-center gap-2 flex-1">
              <Plus size={18} /> {saving ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
            <button onClick={() => setView('main')} className="btn-outline">رجوع</button>
          </div>
        </div>
      </div>
    </div>
  );

  // Expenses view
  if (view === 'expenses') return (
    <div className="page-shell">
      <PageHeader title={`المصاريف - ${activePort?.name}`} subtitle="التقارير" onBack={() => { setView('main'); setData(null); }}>
        {data && data.rows && (
          <ExportButtons inHeader
            rows={data.rows}
            columns={[
              { key: 'TransDate', label: 'التاريخ', format: 'date' },
              { key: 'RefNo', label: 'المرجع' },
              { key: 'AccountName', label: 'التاجر' },
              { key: 'GoodType', label: 'البضاعة' },
              { key: 'Weight', label: 'الوزن', format: 'number' },
              { key: 'CostUSD', label: 'التكلفة ($)', format: 'money' },
              { key: 'AmountUSD', label: 'المبلغ ($)', format: 'money' },
            ]}
            title={`المصاريف - ${activePort?.name}`}
            subtitle="التقارير"
            filename={`مصاريف_${activePort?.name}`}
            summaryCards={[
              { label: 'عدد الفواتير', value: data.rows.length },
              { label: 'إجمالي التكلفة', value: `$${formatNum(data.totals.totalCostUSD)}` },
              { label: 'إجمالي المبلغ', value: `$${formatNum(data.totals.totalAmountUSD)}` },
            ]}
            totalsRow={{ CostUSD: data.totals.totalCostUSD, AmountUSD: data.totals.totalAmountUSD }}
          />
        )}
      </PageHeader>
      <div className="p-5 space-y-4">
        {/* Date filters */}
        <div className="surface-card flex gap-3 flex-wrap items-end no-print">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">من تاريخ</label>
            <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">إلى تاريخ</label>
            <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} className="input-field" />
          </div>
          <button onClick={() => openAction(activePort.id, 'expenses')} className="btn-primary">عرض</button>
        </div>

        {loading ? <LoadingSpinner /> : data && (
          <div className="surface-card p-0 overflow-hidden">
            <div className="px-5 py-3.5 bg-orange-50/60 border-b border-orange-100 flex justify-between items-center">
              <span className="font-bold text-orange-800 flex items-center gap-2"><Receipt size={16} /> المصاريف ({data.rows.length} معاملة)</span>
              <span className="font-bold text-orange-700">إجمالي التكلفة: ${formatNum(data.totals.totalCostUSD)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                    <th className="px-4 py-3 font-semibold">التاريخ</th>
                    <th className="px-4 py-3 font-semibold">المرجع</th>
                    <th className="px-4 py-3 font-semibold">التاجر</th>
                    <th className="px-4 py-3 font-semibold">البضاعة</th>
                    <th className="px-4 py-3 font-semibold">الوزن</th>
                    <th className="px-4 py-3 font-semibold">التكلفة ($)</th>
                    <th className="px-4 py-3 font-semibold">المبلغ ($)</th>
                    <th className="px-4 py-3 font-semibold">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r, i) => (
                    <tr key={i} onClick={() => setSelectedTx(r)} className="border-b border-gray-50 hover:bg-primary-50/50 cursor-pointer transition-colors">
                      <td className="px-4 py-3">{r.TransDate?.split(' ')[0]}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{r.RefNo}</td>
                      <td className="px-4 py-3 font-semibold">{r.AccountName}</td>
                      <td className="px-4 py-3">{r.GoodType || '-'}</td>
                      <td className="px-4 py-3">{r.Weight ? formatNum(r.Weight) : '-'}</td>
                      <td className="px-4 py-3 font-bold text-accent-600">${formatNum(r.CostUSD)}</td>
                      <td className="px-4 py-3">${formatNum(r.AmountUSD)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">{r.Notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <td colSpan="5" className="px-4 py-3 text-primary-900">المجموع</td>
                    <td className="px-4 py-3 text-accent-600">${formatNum(data.totals.totalCostUSD)}</td>
                    <td className="px-4 py-3">${formatNum(data.totals.totalAmountUSD)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        <TransactionModal transaction={selectedTx} onClose={() => setSelectedTx(null)} readOnly />
      </div>
    </div>
  );

  // Profits view
  if (view === 'profits') {
    const rows = data?.rows || [];
    const totals = data?.totals || {};
    const traderProfits = data?.traderProfits || [];
    return (
      <div className="page-shell">
        <PageHeader title={`الأرباح - ${activePort?.name}`} subtitle="التقارير" onBack={() => { setView('main'); setData(null); }}>
          {data && rows.length > 0 && (
            <ExportButtons inHeader
              rows={rows}
              columns={[
                { key: 'TransDate', label: 'التاريخ', format: 'date' },
                { key: 'RefNo', label: 'المرجع' },
                { key: 'AccountName', label: 'التاجر' },
                { key: 'GoodTypeName', label: 'البضاعة' },
                { key: 'CostUSD', label: 'التكلفة ($)', format: 'money' },
                { key: 'AmountUSD', label: 'المبلغ ($)', format: 'money' },
                { key: 'ProfitUSD', label: 'الربح ($)', format: 'money' },
              ]}
              title={`الأرباح - ${activePort?.name}`}
              subtitle="التقارير"
              filename={`أرباح_${activePort?.name}`}
              summaryCards={[
                { label: 'عدد الشحنات', value: totals.shipmentCount },
                { label: 'إجمالي التكلفة', value: `$${formatNum(totals.totalCostUSD)}` },
                { label: 'إجمالي المبلغ', value: `$${formatNum(totals.totalAmountUSD)}` },
                { label: 'إجمالي الربح', value: `$${formatNum(totals.totalProfitUSD)}` },
              ]}
              totalsRow={{ CostUSD: totals.totalCostUSD, AmountUSD: totals.totalAmountUSD, ProfitUSD: totals.totalProfitUSD }}
            />
          )}
        </PageHeader>
        <div className="p-5 space-y-4">
          {/* Date filters */}
          <div className="surface-card flex gap-3 flex-wrap items-end no-print">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">من تاريخ</label>
              <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">إلى تاريخ</label>
              <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} className="input-field" />
            </div>
            <button onClick={() => openAction(activePort.id, 'profits')} className="btn-primary">عرض</button>
          </div>

          {loading ? <LoadingSpinner /> : data && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="stat-card-modern text-center">
                  <div className="text-xs text-gray-500 mb-1">عدد الشحنات</div>
                  <div className="text-2xl font-bold text-accent-600">{totals.shipmentCount || 0}</div>
                </div>
                <div className="stat-card-modern text-center">
                  <div className="text-xs text-gray-500 mb-1">إجمالي التكلفة ($)</div>
                  <div className="text-2xl font-bold text-primary-800">${formatNum(totals.totalCostUSD)}</div>
                </div>
                <div className="stat-card-modern text-center">
                  <div className="text-xs text-gray-500 mb-1">إجمالي المبلغ ($)</div>
                  <div className="text-2xl font-bold text-accent-600">${formatNum(totals.totalAmountUSD)}</div>
                </div>
                <div className="stat-card-modern text-center">
                  <div className="text-xs text-gray-500 mb-1">إجمالي الربح ($)</div>
                  <div className={`text-2xl font-bold ${(totals.totalProfitUSD || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${formatNum(totals.totalProfitUSD)}
                  </div>
                </div>
              </div>

              {/* Per-Trader Profit Summary */}
              {traderProfits.length > 0 && (
                <div className="surface-card p-0 overflow-hidden">
                  <div className="px-5 py-3.5 bg-accent-50/40 border-b border-accent-100 flex items-center gap-2">
                    <BarChart3 size={16} className="text-accent-600" />
                    <span className="font-bold text-accent-800">ملخص الأرباح حسب التاجر</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                          <th className="px-4 py-3 font-semibold">التاجر</th>
                          <th className="px-4 py-3 font-semibold">عدد الشحنات</th>
                          <th className="px-4 py-3 font-semibold">التكلفة ($)</th>
                          <th className="px-4 py-3 font-semibold">المبلغ ($)</th>
                          <th className="px-4 py-3 font-semibold">الربح ($)</th>
                          <th className="px-4 py-3 font-semibold">الربح (د.ع)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {traderProfits.map((tp, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-semibold">{tp.AccountName}</td>
                            <td className="px-4 py-3 text-center text-accent-600 font-semibold">{tp.shipmentCount}</td>
                            <td className="px-4 py-3">${formatNum(tp.totalCostUSD)}</td>
                            <td className="px-4 py-3">${formatNum(tp.totalAmountUSD)}</td>
                            <td className={`px-4 py-3 font-bold ${(tp.totalProfitUSD || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              ${formatNum(tp.totalProfitUSD)}
                            </td>
                            <td className={`px-4 py-3 ${(tp.totalProfitIQD || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {formatNum(tp.totalProfitIQD)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                          <td className="px-4 py-3 text-primary-900">المجموع</td>
                          <td className="px-4 py-3 text-center">{totals.shipmentCount}</td>
                          <td className="px-4 py-3">${formatNum(totals.totalCostUSD)}</td>
                          <td className="px-4 py-3">${formatNum(totals.totalAmountUSD)}</td>
                          <td className={`px-4 py-3 ${(totals.totalProfitUSD || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${formatNum(totals.totalProfitUSD)}</td>
                          <td className={`px-4 py-3 ${(totals.totalProfitIQD || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatNum(totals.totalProfitIQD)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Per-Shipment Details */}
              <div className="surface-card p-0 overflow-hidden">
                <div className="px-5 py-3.5 bg-emerald-50/60 border-b border-emerald-100 flex justify-between items-center">
                  <span className="font-bold text-emerald-800 flex items-center gap-2"><TrendingUp size={16} /> تفاصيل الشحنات ({rows.length} شحنة)</span>
                  <span className={`font-bold ${(totals.totalProfitUSD || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    إجمالي الربح: ${formatNum(totals.totalProfitUSD)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                        <th className="px-4 py-3 font-semibold">التاريخ</th>
                        <th className="px-4 py-3 font-semibold">المرجع</th>
                        <th className="px-4 py-3 font-semibold">التاجر</th>
                        <th className="px-4 py-3 font-semibold">البضاعة</th>
                        <th className="px-4 py-3 font-semibold">التكلفة ($)</th>
                        <th className="px-4 py-3 font-semibold">المبلغ ($)</th>
                        <th className="px-4 py-3 font-semibold">الربح ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} onClick={() => setSelectedTx(r)} className="border-b border-gray-50 hover:bg-primary-50/50 cursor-pointer transition-colors">
                          <td className="px-4 py-3">{r.TransDate?.split(' ')[0]}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{r.RefNo}</td>
                          <td className="px-4 py-3 font-semibold">{r.AccountName}</td>
                          <td className="px-4 py-3">{r.GoodTypeName || r.GoodType || '-'}</td>
                          <td className="px-4 py-3">${formatNum(r.CostUSD)}</td>
                          <td className="px-4 py-3">${formatNum(r.AmountUSD)}</td>
                          <td className={`px-4 py-3 font-bold ${(r.ProfitUSD || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ${formatNum(r.ProfitUSD)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                        <td colSpan="4" className="px-4 py-3 text-primary-900">المجموع</td>
                        <td className="px-4 py-3">${formatNum(totals.totalCostUSD)}</td>
                        <td className="px-4 py-3">${formatNum(totals.totalAmountUSD)}</td>
                        <td className={`px-4 py-3 ${(totals.totalProfitUSD || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${formatNum(totals.totalProfitUSD)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
          <TransactionModal transaction={selectedTx} onClose={() => setSelectedTx(null)} readOnly />
        </div>
      </div>
    );
  }

  return null;
}

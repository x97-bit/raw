import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { Building2, Handshake, Eye } from 'lucide-react';
import ExportButtons from '../components/ExportButtons';
import TransactionModal from '../components/TransactionModal';
import { buildFieldConfigMap, getFieldLabel } from '../utils/fieldConfigMetadata';

const formatNum = n => n ? Number(n).toLocaleString('en-US') : '0';

const specialAccounts = [
  { id: 'haider', label: 'حيدر شركة الأنوار', endpoint: '/special/haider', icon: Building2, color: 'from-teal-500 to-emerald-700', glow: 'hover:shadow-teal-500/20', sectionKey: 'special-haider' },
  { id: 'partnership-yaser', label: 'ياسر عادل', endpoint: '/special/partnership', icon: Handshake, color: 'from-violet-500 to-purple-700', glow: 'hover:shadow-violet-500/20', sectionKey: 'special-partner' },
];

const HAIDER_ALL_COLUMNS = [
  { key: 'trans_date', dataKey: 'TransDate', label: 'التاريخ', format: 'date', render: v => v?.split(' ')[0] || '-' },
  { key: 'driver_name', dataKey: 'DriverName', label: 'اسم السائق', render: v => v || '-' },
  { key: 'vehicle_plate', dataKey: 'PlateNumber', label: 'رقم السيارة', render: v => v || '-' },
  { key: 'good_type', dataKey: 'GoodType', label: 'نوع البضاعة', render: v => v || '-' },
  { key: 'weight', dataKey: 'Weight', label: 'الوزن', format: 'number', render: v => v ? formatNum(v) : '-' },
  { key: 'cost_usd', dataKey: 'CostUSD', label: 'التكلفة ($)', format: 'money', render: v => `$${formatNum(v)}` },
  { key: 'amount_usd', dataKey: 'AmountUSD', label: 'المبلغ ($)', format: 'money', render: v => `$${formatNum(v)}`, isBold: true },
  { key: 'profit_usd', dataKey: 'ProfitUSD', label: 'الربح ($)', format: 'money', render: v => `$${formatNum(v)}`, colorFn: v => (v || 0) >= 0 ? 'text-emerald-600' : 'text-red-600', isBold: true },
  { key: 'amount_iqd', dataKey: 'AmountIQD', label: 'المبلغ بالدينار', format: 'money_iqd', render: v => v ? formatNum(v) : '-' },
  { key: 'notes', dataKey: 'TraderNote', label: 'ملاحظات', render: v => v || '-', isNotes: true },
];

const PARTNER_ALL_COLUMNS = [
  { key: 'trans_date', dataKey: 'TransDate', label: 'التاريخ', format: 'date', render: v => v?.split(' ')[0] || '-' },
  { key: 'port_name', dataKey: 'PortName', label: 'المنفذ', render: v => v || '-' },
  { key: 'trader_name', dataKey: 'TraderName', label: 'التاجر', render: v => v || '-', isMedium: true },
  { key: 'driver_name', dataKey: 'DriverName', label: 'اسم السائق', render: v => v || '-' },
  { key: 'good_type', dataKey: 'GoodType', label: 'نوع البضاعة', render: v => v || '-' },
  { key: 'gov_name', dataKey: 'GovName', label: 'الجهة الحكومية', render: v => v || '-' },
  { key: 'qty', dataKey: 'Qty', label: 'الكمية', format: 'number', render: v => v || '-' },
  { key: 'amount_usd', dataKey: 'AmountUSD', label: 'المبلغ ($)', format: 'money', render: v => `$${formatNum(v)}`, isBold: true },
  { key: 'amount_usd_partner', dataKey: 'AmountUSD_Partner', label: 'الشريك ($)', format: 'money', render: v => v ? `$${formatNum(v)}` : '-' },
  { key: 'clr', dataKey: 'CLR', label: 'CLR', format: 'number', render: v => v || '-' },
  { key: 'tx', dataKey: 'TX', label: 'TX', format: 'number', render: v => v || '-' },
  { key: 'notes', dataKey: 'Notes', label: 'ملاحظات', render: v => v || '-', isNotes: true },
];

const LoadingSpinner = () => (
  <div className="text-center py-16">
    <div className="inline-block w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3" />
    <p className="text-gray-500 text-sm">جارٍ التحميل...</p>
  </div>
);

export default function AccountsPage({ onBack }) {
  const { api } = useAuth();
  const [view, setView] = useState('main');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [selectedTx, setSelectedTx] = useState(null);
  const [haiderVisibleCols, setHaiderVisibleCols] = useState(HAIDER_ALL_COLUMNS.map(c => c.key));
  const [partnerVisibleCols, setPartnerVisibleCols] = useState(PARTNER_ALL_COLUMNS.map(c => c.key));
  const [haiderConfigMap, setHaiderConfigMap] = useState({});
  const [partnerConfigMap, setPartnerConfigMap] = useState({});

  useEffect(() => {
    loadFieldConfigs();
  }, []);

  const loadFieldConfigs = async () => {
    try {
      const [haiderConfig, partnerConfig] = await Promise.all([
        api('/field-config/special-haider').catch(() => null),
        api('/field-config/special-partner').catch(() => null),
      ]);
      if (Array.isArray(haiderConfig) && haiderConfig.length > 0) {
        setHaiderConfigMap(buildFieldConfigMap(haiderConfig));
        setHaiderVisibleCols(haiderConfig.filter(f => f.visible).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(f => f.fieldKey));
      }
      if (Array.isArray(partnerConfig) && partnerConfig.length > 0) {
        setPartnerConfigMap(buildFieldConfigMap(partnerConfig));
        setPartnerVisibleCols(partnerConfig.filter(f => f.visible).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(f => f.fieldKey));
      }
    } catch (e) {
      console.log('No field configs for special accounts, using defaults');
    }
  };

  const openAccount = async (account) => {
    setLoading(true);
    setView(account.id);
    try {
      const d = await api(`${account.endpoint}?from=${filters.from}&to=${filters.to}`);
      setData(d);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // Main view - account buttons
  if (view === 'main') return (
    <div className="page-shell">
      <PageHeader title="حسابات خاصة" subtitle="الصفحة الرئيسية" onBack={onBack} />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="grid grid-cols-2 gap-5 max-w-xl w-full">
          {specialAccounts.map((acc, i) => {
            const Icon = acc.icon;
            return (
              <button
                key={acc.id}
                onClick={() => openAccount(acc)}
                className={`group relative overflow-hidden bg-gradient-to-br ${acc.color} text-white rounded-2xl shadow-lg ${acc.glow} hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 active:translate-y-0 active:shadow-md animate-fade-up`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-[100%] transition-all duration-700" />
                <div className="absolute inset-[1px] rounded-2xl border border-white/15 pointer-events-none" />
                <div className="relative px-4 py-8 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300">
                    <Icon size={24} strokeWidth={1.8} />
                  </div>
                  <span className="text-lg font-bold">{acc.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Haider view
  if (view === 'haider') {
    const cols = haiderVisibleCols
      .map(key => {
        const column = HAIDER_ALL_COLUMNS.find(c => c.key === key);
        return column ? { ...column, label: getFieldLabel(haiderConfigMap, key, column.label) } : null;
      })
      .filter(Boolean);
    const totalsMap = {
      cost_usd: () => `$${formatNum(data?.totals?.totalCostUSD)}`,
      amount_usd: () => `$${formatNum(data?.totals?.totalAmountUSD)}`,
      profit_usd: () => `$${formatNum((data?.totals?.totalAmountUSD || 0) - (data?.totals?.totalCostUSD || 0))}`,
      amount_iqd: () => formatNum(data?.totals?.totalAmountIQD),
      amount_iqd2: () => formatNum(data?.totals?.totalAmountIQD2),
    };

    return (
      <div className="page-shell">
        <PageHeader title="حيدر شركة الأنوار" subtitle="حسابات خاصة" onBack={() => { setView('main'); setData(null); }}>
          {data && data.statement && (
            <ExportButtons inHeader
              rows={data.statement}
              columns={cols.map(c => ({ key: c.dataKey, label: c.label, format: c.format }))}
              title="حيدر شركة الأنوار"
              subtitle="حسابات خاصة"
              filename="حيدر_شركة_الانوار"
              summaryCards={[
                { label: 'عدد المعاملات', value: data.totals.count },
                { label: 'التكلفة ($)', value: `$${formatNum(data.totals.totalCostUSD)}` },
                { label: 'المبلغ ($)', value: `$${formatNum(data.totals.totalAmountUSD)}` },
              ]}
              totalsRow={{ CostUSD: data.totals.totalCostUSD, AmountUSD: data.totals.totalAmountUSD, AmountIQD: data.totals.totalAmountIQD }}
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
            <button onClick={() => openAccount(specialAccounts[0])} className="btn-primary">عرض</button>
          </div>

          {loading ? <LoadingSpinner /> : data && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card-modern text-center">
                  <span className="text-xs text-gray-500">عدد المعاملات</span>
                  <p className="text-2xl font-bold mt-1 text-primary-900">{data.totals.count}</p>
                </div>
                <div className="stat-card-modern text-center">
                  <span className="text-xs text-gray-500">إجمالي التكلفة ($)</span>
                  <p className="text-2xl font-bold mt-1 text-primary-800">${formatNum(data.totals.totalCostUSD)}</p>
                </div>
                <div className="stat-card-modern text-center">
                  <span className="text-xs text-gray-500">إجمالي المبلغ ($)</span>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">${formatNum(data.totals.totalAmountUSD)}</p>
                </div>
                <div className="stat-card-modern text-center">
                  <span className="text-xs text-gray-500">إجمالي (د.ع)</span>
                  <p className="text-2xl font-bold mt-1 text-primary-800">{formatNum(data.totals.totalAmountIQD)}</p>
                </div>
              </div>

              <div className="surface-card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                        {cols.map(col => (
                          <th key={col.key} className="px-4 py-3 font-semibold">{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.statement.map((r, i) => (
                        <tr key={i} onClick={() => setSelectedTx(r)} className="border-b border-gray-50 hover:bg-primary-50/50 cursor-pointer transition-colors">
                          {cols.map(col => (
                            <td key={col.key} className={`px-4 py-3 ${col.isBold ? 'font-bold' : ''} ${col.isMedium ? 'font-semibold' : ''} ${col.colorFn ? col.colorFn(r[col.dataKey]) : ''} ${col.isNotes ? 'text-gray-400 text-xs max-w-[200px] truncate' : ''}`}>
                              {col.render(r[col.dataKey])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                        {cols.map((col, idx) => {
                          if (totalsMap[col.key]) {
                            return <td key={col.key} className={`px-4 py-3 ${col.key === 'profit_usd' ? 'text-emerald-600' : ''}`}>{totalsMap[col.key]()}</td>;
                          }
                          if (idx === 0) return <td key={col.key} className="px-4 py-3 text-primary-900">المجموع</td>;
                          return <td key={col.key} className="px-4 py-3"></td>;
                        })}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
        <TransactionModal transaction={selectedTx} onClose={() => setSelectedTx(null)} readOnly />
      </div>
    );
  }

  // Partnership (ياسر عادل) view
  if (view === 'partnership-yaser') {
    const cols = partnerVisibleCols
      .map(key => {
        const column = PARTNER_ALL_COLUMNS.find(c => c.key === key);
        return column ? { ...column, label: getFieldLabel(partnerConfigMap, key, column.label) } : null;
      })
      .filter(Boolean);
    const totalsMap = {
      amount_usd: () => `$${formatNum(data?.totals?.totalAmountUSD)}`,
      amount_usd_partner: () => `$${formatNum(data?.totals?.totalPartnerUSD)}`,
      clr: () => formatNum(data?.totals?.totalCLR),
      tx: () => formatNum(data?.totals?.totalTX),
    };

    return (
      <div className="page-shell">
        <PageHeader title="ياسر عادل - شراكة" subtitle="حسابات خاصة" onBack={() => { setView('main'); setData(null); }}>
          {data && data.rows && (
            <ExportButtons inHeader
              rows={data.rows}
              columns={cols.map(c => ({ key: c.dataKey, label: c.label, format: c.format }))}
              title="ياسر عادل - شراكة"
              subtitle="حسابات خاصة"
              filename="ياسر_عادل_شراكة"
              summaryCards={[
                { label: 'عدد المعاملات', value: data.totals.count },
                { label: 'المبلغ ($)', value: `$${formatNum(data.totals.totalAmountUSD)}` },
                { label: 'مبلغ الشريك ($)', value: `$${formatNum(data.totals.totalPartnerUSD)}` },
              ]}
              totalsRow={{ AmountUSD: data.totals.totalAmountUSD, AmountUSD_Partner: data.totals.totalPartnerUSD, CLR: data.totals.totalCLR, TX: data.totals.totalTX }}
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
            <button onClick={() => openAccount(specialAccounts[1])} className="btn-primary">عرض</button>
          </div>

          {loading ? <LoadingSpinner /> : data && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card-modern text-center">
                  <span className="text-xs text-gray-500">عدد المعاملات</span>
                  <p className="text-2xl font-bold mt-1 text-primary-900">{data.totals.count}</p>
                </div>
                <div className="stat-card-modern text-center">
                  <span className="text-xs text-gray-500">إجمالي المبلغ ($)</span>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">${formatNum(data.totals.totalAmountUSD)}</p>
                </div>
                <div className="stat-card-modern text-center">
                  <span className="text-xs text-gray-500">مبلغ الشريك ($)</span>
                  <p className="text-2xl font-bold mt-1 text-primary-800">${formatNum(data.totals.totalPartnerUSD)}</p>
                </div>
                <div className="stat-card-modern text-center">
                  <span className="text-xs text-gray-500">التخليص</span>
                  <p className="text-2xl font-bold mt-1 text-primary-800">${formatNum(data.totals.totalCLR)}</p>
                </div>
              </div>

              <div className="surface-card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                        {cols.map(col => (
                          <th key={col.key} className="px-4 py-3 font-semibold">{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((r, i) => (
                        <tr key={i} onClick={() => setSelectedTx(r)} className="border-b border-gray-50 hover:bg-primary-50/50 cursor-pointer transition-colors">
                          {cols.map(col => (
                            <td key={col.key} className={`px-4 py-3 ${col.isBold ? 'font-bold' : ''} ${col.isMedium ? 'font-semibold' : ''} ${col.colorFn ? col.colorFn(r[col.dataKey]) : ''} ${col.isNotes ? 'text-gray-400 text-xs max-w-[200px] truncate' : ''}`}>
                              {col.render(r[col.dataKey])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                        {cols.map((col, idx) => {
                          if (totalsMap[col.key]) {
                            return <td key={col.key} className="px-4 py-3">{totalsMap[col.key]()}</td>;
                          }
                          if (idx === 0) return <td key={col.key} className="px-4 py-3 text-primary-900">المجموع</td>;
                          return <td key={col.key} className="px-4 py-3"></td>;
                        })}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
        <TransactionModal transaction={selectedTx} onClose={() => setSelectedTx(null)} readOnly />
      </div>
    );
  }

  return null;
}

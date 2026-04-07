import { Fragment, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import ExportButtons from '../components/ExportButtons';
import { Scale, Calendar } from 'lucide-react';
import { buildFieldConfigMap, getFieldLabel } from '../utils/fieldConfigMetadata';

const formatNum = n => n ? Number(n).toLocaleString('en-US') : '0';

const ALL_COLUMNS = [
  { key: 'account_name', dataKey: 'AccountName', label: 'الحساب', render: v => v || '-', isMedium: true },
  { key: 'account_type', dataKey: 'AccountTypeName', label: 'النوع', render: v => v || '-', isSmall: true },
  { key: 'shipment_count', dataKey: 'shipment_count', label: 'عدد الشحنات', format: 'number', render: v => v || 0, isCenter: true, colorClass: 'text-accent-600 font-semibold' },
  { key: 'opening_usd', dataKey: 'opening_usd', label: 'رصيد افتتاحي ($)', format: 'money', render: v => v ? formatNum(v) : '-', colorFn: v => (v || 0) >= 0 ? 'text-accent-700' : 'text-red-600' },
  { key: 'opening_iqd', dataKey: 'opening_iqd', label: 'رصيد افتتاحي (د.ع)', format: 'money_iqd', render: v => v ? formatNum(v) : '-', colorFn: v => (v || 0) >= 0 ? 'text-accent-700' : 'text-red-600' },
  { key: 'debit_usd', dataKey: 'debit_usd', label: 'مدين ($)', format: 'money', render: v => v ? formatNum(v) : '-', colorClass: 'text-emerald-700' },
  { key: 'credit_usd', dataKey: 'credit_usd', label: 'دائن ($)', format: 'money', render: v => v ? formatNum(v) : '-', colorClass: 'text-red-600' },
  { key: 'balance_usd', dataKey: 'balance_usd', label: 'الرصيد ($)', format: 'money', render: v => formatNum(v || 0), isBold: true, colorFn: v => (v || 0) >= 0 ? 'text-emerald-700' : 'text-red-600' },
  { key: 'debit_iqd', dataKey: 'debit_iqd', label: 'مدين (د.ع)', format: 'money_iqd', render: v => v ? formatNum(v) : '-', colorClass: 'text-emerald-700' },
  { key: 'credit_iqd', dataKey: 'credit_iqd', label: 'دائن (د.ع)', format: 'money_iqd', render: v => v ? formatNum(v) : '-', colorClass: 'text-red-600' },
  { key: 'balance_iqd', dataKey: 'balance_iqd', label: 'الرصيد (د.ع)', format: 'money_iqd', render: v => formatNum(v || 0), isBold: true, colorFn: v => (v || 0) >= 0 ? 'text-emerald-700' : 'text-red-600' },
  { key: 'profit_usd', dataKey: 'profit_usd', label: 'الربح ($)', format: 'money', render: v => v ? formatNum(v) : '-', isBold: true, colorFn: v => (v || 0) >= 0 ? 'text-emerald-600' : 'text-red-600' },
  { key: 'profit_iqd', dataKey: 'profit_iqd', label: 'الربح (د.ع)', format: 'money_iqd', render: v => v ? formatNum(v) : '-', colorFn: v => (v || 0) >= 0 ? 'text-emerald-600' : 'text-red-600' },
  { key: 'transaction_count', dataKey: 'trans_count', label: 'المعاملات', format: 'number', render: v => v || 0, isCenter: true },
];

export default function TrialBalancePage({ onBack }) {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ from: '', to: '', port: '', accountType: '' });
  const [ports, setPorts] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(ALL_COLUMNS.map(c => c.key));
  const [fieldConfigMap, setFieldConfigMap] = useState({});

  useEffect(() => {
    api('/lookups/ports').then(setPorts).catch(() => {});
    api('/lookups/account-types').then(setAccountTypes).catch(() => {});
    loadData();
    loadFieldConfig();
  }, []);

  const loadFieldConfig = async () => {
    try {
      const config = await api('/field-config/trial-balance');
      if (Array.isArray(config) && config.length > 0) {
        setFieldConfigMap(buildFieldConfigMap(config));
        setVisibleColumns(
          config
            .filter(f => f.visible)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map(f => f.fieldKey)
        );
      }
    } catch (e) {
      console.log('No field config for trial-balance, using defaults');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.set('startDate', filters.from);
      if (filters.to) params.set('endDate', filters.to);
      if (filters.port) params.set('portId', filters.port);
      if (filters.accountType) params.set('accountType', filters.accountType);
      const d = await api(`/reports/trial-balance?${params}`);
      setData(d);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const groupedRows = data?.rows ? data.rows.reduce((acc, row) => {
    const key = row.AccountTypeName || 'اخرى';
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {}) : {};

  const cols = visibleColumns
    .map(key => {
      const column = ALL_COLUMNS.find(c => c.key === key);
      return column ? { ...column, label: getFieldLabel(fieldConfigMap, key, column.label) } : null;
    })
    .filter(Boolean);
  const colCount = cols.length;
  const summableKeys = ['shipment_count', 'opening_usd', 'opening_iqd', 'debit_usd', 'credit_usd', 'balance_usd', 'debit_iqd', 'credit_iqd', 'balance_iqd', 'profit_usd', 'profit_iqd', 'transaction_count'];
  const hasPeriodFilter = filters.from || filters.to;

  return (
    <div className="page-shell">
      <PageHeader title="ميزان المراجعة" subtitle="التقارير" onBack={onBack}>
        {data && data.rows && data.totals && (
          <ExportButtons inHeader
            rows={data.rows}
            columns={cols.map(c => ({ key: c.dataKey, label: c.label, format: c.format }))}
            title="ميزان المراجعة"
            filename="ميزان_المراجعة"
            summaryCards={[
              { label: 'عدد الحسابات', value: data.totals.account_count },
              { label: 'عدد الشحنات', value: data.totals.shipment_count },
              { label: 'مدين ($)', value: `$${formatNum(data.totals.debit_usd)}` },
              { label: 'دائن ($)', value: `$${formatNum(data.totals.credit_usd)}` },
              { label: 'صافي ($)', value: `$${formatNum(data.totals.balance_usd)}` },
              { label: 'الربح ($)', value: `$${formatNum(data.totals.profit_usd)}` },
            ]}
            totalsRow={{
              debit_usd: data.totals.debit_usd, credit_usd: data.totals.credit_usd, balance_usd: data.totals.balance_usd,
              debit_iqd: data.totals.debit_iqd, credit_iqd: data.totals.credit_iqd, balance_iqd: data.totals.balance_iqd,
              profit_usd: data.totals.profit_usd, profit_iqd: data.totals.profit_iqd, trans_count: data.totals.trans_count,
            }}
          />
        )}
      </PageHeader>

      <div className="p-5 space-y-4">
        {/* Filters */}
        <div className="surface-card flex gap-3 flex-wrap items-end no-print">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">من تاريخ</label>
            <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الى تاريخ</label>
            <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">المنفذ</label>
            <select value={filters.port} onChange={e => setFilters(f => ({ ...f, port: e.target.value }))} className="input-field">
              <option value="">الكل</option>
              {ports.map(p => <option key={p.PortID} value={p.PortID}>{p.PortName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">نوع الحساب</label>
            <select value={filters.accountType} onChange={e => setFilters(f => ({ ...f, accountType: e.target.value }))} className="input-field">
              <option value="">الكل</option>
              {accountTypes.map(t => <option key={t.AccountTypeID} value={t.AccountTypeID}>{t.TypeName}</option>)}
            </select>
          </div>
          <button onClick={loadData} className="btn-primary">عرض</button>
        </div>

        {/* Summary Cards */}
        {data && data.totals && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="stat-card-modern text-center py-3 px-2">
              <div className="text-xs text-gray-500">عدد الحسابات</div>
              <div className="text-xl font-bold text-primary-900 mt-1">{data.totals.account_count}</div>
            </div>
            <div className="stat-card-modern text-center py-3 px-2">
              <div className="text-xs text-gray-500">عدد الشحنات</div>
              <div className="text-xl font-bold text-accent-600 mt-1">{data.totals.shipment_count}</div>
            </div>
            <div className="stat-card-modern text-center py-3 px-2">
              <div className="text-xs text-gray-500">إجمالي المدين ($)</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">${formatNum(Math.round(data.totals.debit_usd || 0))}</div>
            </div>
            <div className="stat-card-modern text-center py-3 px-2">
              <div className="text-xs text-gray-500">إجمالي الدائن ($)</div>
              <div className="text-xl font-bold text-red-600 mt-1">${formatNum(Math.round(data.totals.credit_usd || 0))}</div>
            </div>
            <div className="stat-card-modern text-center py-3 px-2">
              <div className="text-xs text-gray-500">صافي الرصيد ($)</div>
              <div className={`text-xl font-bold mt-1 ${(data.totals.balance_usd || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ${formatNum(Math.round(data.totals.balance_usd || 0))}
              </div>
            </div>
            <div className="stat-card-modern text-center py-3 px-2">
              <div className="text-xs text-gray-500">إجمالي الربح ($)</div>
              <div className={`text-xl font-bold mt-1 ${(data.totals.profit_usd || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ${formatNum(Math.round(data.totals.profit_usd || 0))}
              </div>
            </div>
            <div className="stat-card-modern text-center py-3 px-2">
              <div className="text-xs text-gray-500">صافي الرصيد (د.ع)</div>
              <div className={`text-xl font-bold mt-1 ${(data.totals.balance_iqd || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatNum(Math.round(data.totals.balance_iqd || 0))}
              </div>
            </div>
          </div>
        )}

        {/* Period info badge */}
        {hasPeriodFilter && data && (
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 bg-accent-50 text-accent-700 px-3 py-1.5 rounded-lg font-medium ring-1 ring-accent-100">
              <Calendar size={14} />
              الفترة: {filters.from || 'البداية'} → {filters.to || 'الآن'}
            </span>
            {(data.totals?.opening_usd || 0) !== 0 && (
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg font-medium ring-1 ring-amber-100">
                <Scale size={14} />
                رصيد افتتاحي: ${formatNum(Math.round(data.totals.opening_usd || 0))}
              </span>
            )}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">جارٍ التحميل...</p>
          </div>
        ) : data && (
          <div className="surface-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                    {cols.map(col => (
                      <th key={col.key} className="px-3 py-3 whitespace-nowrap font-semibold">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedRows).map(([typeName, rows]) => (
                    <Fragment key={`group-${typeName}`}>
                      <tr className="bg-primary-50/60">
                        <td colSpan={colCount} className="px-4 py-2.5 font-bold text-primary-800 text-sm">{typeName}</td>
                      </tr>
                      {rows.map(r => (
                        <tr key={r.AccountID} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                          ((r.balance_usd || 0) < 0 || (r.balance_iqd || 0) < 0) ? 'bg-red-50/20' : ''
                        }`}>
                          {cols.map(col => (
                            <td key={col.key} className={`px-3 py-2.5 ${col.isBold ? 'font-bold' : ''} ${col.isMedium ? 'font-semibold' : ''} ${col.isSmall ? 'text-xs text-gray-400' : ''} ${col.isCenter ? 'text-center' : ''} ${col.colorFn ? col.colorFn(r[col.dataKey]) : (col.colorClass || '')}`}>
                              {col.render(r[col.dataKey])}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {/* Sub-totals */}
                      <tr className="bg-gray-50/80 font-semibold text-sm border-b border-gray-100">
                        {cols.map((col, idx) => {
                          if (summableKeys.includes(col.key)) {
                            const sum = rows.reduce((s, r) => s + (r[col.dataKey] || 0), 0);
                            return (
                              <td key={col.key} className={`px-3 py-2 ${col.isCenter ? 'text-center' : ''} ${col.colorFn ? col.colorFn(sum) : (col.colorClass || '')}`}>
                                {col.key === 'shipment_count' || col.key === 'transaction_count' ? sum : formatNum(sum)}
                              </td>
                            );
                          }
                          if (idx === 0) return <td key={col.key} className="px-3 py-2 text-primary-700">مجموع {typeName}</td>;
                          return <td key={col.key} className="px-3 py-2"></td>;
                        })}
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-200">
                    {cols.map((col, idx) => {
                      if (summableKeys.includes(col.key) && data.totals[col.dataKey] !== undefined) {
                        const val = data.totals[col.dataKey] || 0;
                        return (
                          <td key={col.key} className={`px-3 py-3 ${col.isCenter ? 'text-center' : ''} ${col.colorFn ? col.colorFn(val) : (col.colorClass || '')}`}>
                            {col.key === 'shipment_count' || col.key === 'transaction_count' ? val : formatNum(val)}
                          </td>
                        );
                      }
                      if (idx === 0) return <td key={col.key} className="px-3 py-3 text-primary-900">الإجمالي الكلي</td>;
                      return <td key={col.key} className="px-3 py-3"></td>;
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

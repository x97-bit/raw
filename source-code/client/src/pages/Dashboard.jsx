import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, FileText, Building2, Clock } from 'lucide-react';

const COLORS = ['#1d4ed8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function formatNum(n) {
  if (!n) return '0';
  return Number(n).toLocaleString('en-US');
}

export default function Dashboard() {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/reports/dashboard').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="text-lg text-gray-500">جارٍ التحميل...</div></div>;
  if (!data) return <div className="p-8 text-red-500">خطأ في تحميل البيانات</div>;

  const totalBalanceUSD = (data.portStats || []).reduce((s, p) => s + ((p.invoicesUSD || 0) + (p.paymentsUSD || 0)), 0);
  const totalBalanceIQD = (data.portStats || []).reduce((s, p) => s + ((p.invoicesIQD || 0) + (p.paymentsIQD || 0)), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
          <p className="text-gray-500 text-sm mt-1">نظرة عامة على النظام</p>
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Clock size={16} />
          {new Date().toLocaleDateString('ar-IQ')}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card-modern">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">إجمالي الحسابات</span>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Users size={20} className="text-blue-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{data.totalAccounts}</p>
        </div>

        <div className="stat-card-modern">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">إجمالي المعاملات</span>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><FileText size={20} className="text-green-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatNum(data.totalTransactions)}</p>
        </div>

        <div className="stat-card-modern">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">الرصيد الكلي ($)</span>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><DollarSign size={20} className="text-yellow-600" /></div>
          </div>
          <p className={`text-2xl font-bold ${totalBalanceUSD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${formatNum(Math.abs(totalBalanceUSD))}
          </p>
        </div>

        <div className="stat-card-modern">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">الديون الكلية</span>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><TrendingDown size={20} className="text-red-600" /></div>
          </div>
          <p className="text-xl font-bold text-gray-800">
            ${formatNum(data.totalDebts?.totalUSD || 0)}
          </p>
          <p className="text-sm text-gray-500">{formatNum(data.totalDebts?.totalIQD || 0)} د.ع</p>
        </div>
      </div>

      {/* Port Stats + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Port Cards */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-bold text-gray-700">المنافذ الحدودية</h2>
          {data.portStats.filter(p => p.transCount > 0).map((port, i) => (
            <div key={port.PortID} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${COLORS[i]}20` }}>
                  <Building2 size={20} style={{ color: COLORS[i] }} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{port.PortName}</h3>
                  <p className="text-xs text-gray-500">{port.transCount} معاملة</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-green-700 font-bold">${formatNum(port.invoicesUSD)}</p>
                  <p className="text-green-600 text-xs">فواتير</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <p className="text-red-700 font-bold">${formatNum(Math.abs(port.paymentsUSD))}</p>
                  <p className="text-red-600 text-xs">تسديدات</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 card">
          <h2 className="font-bold text-gray-700 mb-4">الحركة الشهرية ($)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[...data.monthlyTrend].reverse()}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `$${formatNum(v)}`} />
              <Bar dataKey="invoicesUSD" name="فواتير" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="paymentsUSD" name="تسديدات" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions + Top Traders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent */}
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-4">آخر المعاملات</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-gray-500 border-b">
                  <th className="pb-2 font-medium">التاريخ</th>
                  <th className="pb-2 font-medium">المرجع</th>
                  <th className="pb-2 font-medium">التاجر</th>
                  <th className="pb-2 font-medium">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.slice(0, 10).map(t => (
                  <tr key={t.TransID} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 text-gray-600">{t.TransDate?.split(' ')[0]}</td>
                    <td className="py-2"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{t.RefNo}</span></td>
                    <td className="py-2 font-medium">{t.AccountName}</td>
                    <td className={`py-2 font-bold ${t.TransTypeName === 'عليه' ? 'text-red-600' : 'text-green-600'}`}>
                      {t.AmountUSD ? `$${formatNum(t.AmountUSD)}` : `${formatNum(t.AmountIQD)} د.ع`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Traders */}
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-4">أكبر الحسابات (بالرصيد)</h2>
          <div className="space-y-3">
            {data.topTraders.map((t, i) => (
              <div key={t.AccountID} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{t.AccountName}</p>
                  <p className="text-xs text-gray-500">{t.transCount} معاملة</p>
                </div>
                <div className="text-left">
                  <p className={`font-bold ${t.balanceUSD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${formatNum(Math.abs(t.balanceUSD))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

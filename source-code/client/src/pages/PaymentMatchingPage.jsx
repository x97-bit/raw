import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { CheckCircle, AlertCircle, Clock, Zap, ChevronLeft, X } from 'lucide-react';

const formatNum = n => n ? Number(n).toLocaleString('en-US') : '0';

const statusConfig = {
  paid: { label: 'مسدد', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', icon: CheckCircle },
  partial: { label: 'جزئي', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', icon: Clock },
  unpaid: { label: 'غير مسدد', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', icon: AlertCircle },
};

function Badge({ status }) {
  const s = statusConfig[status] || statusConfig.unpaid;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${s.bg} ${s.text} ${s.ring}`}>
      <Icon size={12} /> {s.label}
    </span>
  );
}

function StatCard({ label, value, sub, variant = 'default' }) {
  const variants = {
    default: 'border-gray-100',
    success: 'border-emerald-100 bg-emerald-50/30',
    warning: 'border-amber-100 bg-amber-50/30',
    danger: 'border-red-100 bg-red-50/30',
    info: 'border-orange-100 bg-orange-50/30',
  };
  const textColors = {
    default: 'text-primary-900',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-red-700',
    info: 'text-orange-700',
  };
  return (
    <div className={`stat-card-modern text-center border ${variants[variant]}`}>
      <div className="text-xs text-gray-500 mb-2">{label}</div>
      <div className={`text-2xl font-bold ${textColors[variant]}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1.5">{sub}</div>}
    </div>
  );
}

export default function PaymentMatchingPage({ onBack }) {
  const { api, can } = useAuth();
  const [view, setView] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountShipments, setAccountShipments] = useState({ rows: [], total: 0 });
  const [accountDetail, setAccountDetail] = useState(null);
  const [shipmentDetail, setShipmentDetail] = useState(null);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const d = await api('/payment-matching/dashboard');
      setDashboard(d);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const runAutoMatch = async () => {
    if (!confirm('سيتم ربط كل التسديدات غير المربوطة بالشحنات تلقائياً. متأكد؟')) return;
    setMatching(true);
    try {
      const result = await api('/payment-matching/auto-match-all', { method: 'POST' });
      alert(result.message);
      loadDashboard();
    } catch (e) { alert(e.message); }
    setMatching(false);
  };

  const openAccount = async (account) => {
    setSelectedAccount(account);
    try {
      const [shipments, summary] = await Promise.all([
        api(`/payment-matching/shipments?account=${account.account_id}&limit=200`),
        api(`/payment-matching/summary/${account.account_id}`),
      ]);
      setAccountShipments(shipments);
      setAccountDetail(summary);
    } catch (e) { console.error(e); }
    setView('account-detail');
  };

  const openShipment = async (shipmentId) => {
    try {
      const d = await api(`/payment-matching/shipments/${shipmentId}`);
      setShipmentDetail(d);
    } catch (e) { console.error(e); }
  };

  const deleteAllocation = async (allocId) => {
    if (!confirm('حذف هذا الربط؟')) return;
    try {
      await api(`/payment-matching/allocate/${allocId}`, { method: 'DELETE' });
      if (shipmentDetail) openShipment(shipmentDetail.shipment.shipment_id);
      if (selectedAccount) openAccount(selectedAccount);
    } catch (e) { alert(e.message); }
  };

  const stats = dashboard ? (() => {
    const ss = dashboard.shipmentStats;
    if (Array.isArray(ss)) {
      return {
        paid: ss.find(s => s.payment_status === 'paid') || { count: 0, total_usd: 0, total_iqd: 0 },
        partial: ss.find(s => s.payment_status === 'partial') || { count: 0, remaining_usd: 0, remaining_iqd: 0 },
        unpaid: ss.find(s => s.payment_status === 'unpaid') || { count: 0, remaining_usd: 0, remaining_iqd: 0 },
        payments: dashboard.paymentStats || { unallocated_usd: 0, unallocated_iqd: 0 },
      };
    }
    return {
      paid: { count: ss.matched || 0, total_usd: 0, total_iqd: 0 },
      partial: { count: ss.partial || 0, remaining_usd: 0, remaining_iqd: 0 },
      unpaid: { count: ss.unmatched || 0, remaining_usd: 0, remaining_iqd: 0 },
      payments: dashboard.paymentStats || { unallocated_usd: 0, unallocated_iqd: 0 },
    };
  })() : null;

  // ─── Dashboard View ───
  if (view === 'dashboard') return (
    <div className="page-shell">
      <PageHeader title="ربط التسديد بالشحنات" subtitle="السيطرة على الأرقام" onBack={onBack}>
        {(can.isAdmin || can.editTransaction) && (
          <button onClick={runAutoMatch} disabled={matching}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:bg-white/5 px-3 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50">
            <Zap size={16} /> {matching ? 'جاري الربط...' : 'ربط تلقائي'}
          </button>
        )}
      </PageHeader>

      <div className="p-5 space-y-5">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">جارٍ التحميل...</p>
          </div>
        ) : stats && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="شحنات مسددة" value={stats.paid.count} variant="success"
                sub={stats.paid.total_usd ? `$${formatNum(stats.paid.total_usd)}` : ''} />
              <StatCard label="جزئي" value={stats.partial.count} variant="warning"
                sub={stats.partial.remaining_usd ? `متبقي $${formatNum(stats.partial.remaining_usd)}` : ''} />
              <StatCard label="غير مسدد" value={stats.unpaid.count} variant="danger"
                sub={stats.unpaid.remaining_usd ? `$${formatNum(stats.unpaid.remaining_usd)}` : (stats.unpaid.remaining_iqd ? `${formatNum(stats.unpaid.remaining_iqd)} د.ع` : '')} />
              <StatCard label="تسديدات غير مربوطة" variant="info"
                value={stats.payments.unallocated_usd > 0 || stats.payments.unallocated_iqd > 0
                  ? `$${formatNum(stats.payments.unallocated_usd)}`
                  : '0'}
                sub={stats.payments.unallocated_iqd > 0 ? `${formatNum(stats.payments.unallocated_iqd)} د.ع` : ''} />
            </div>

            {/* Progress bar */}
            {(() => {
              const total = stats.paid.count + stats.partial.count + stats.unpaid.count;
              const paidPct = total ? Math.round(stats.paid.count / total * 100) : 0;
              const partialPct = total ? Math.round(stats.partial.count / total * 100) : 0;
              return (
                <div className="surface-card p-5">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="font-semibold text-primary-900">نسبة التسديد</span>
                    <span className="text-gray-500">{paidPct}% مسدد بالكامل</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full transition-all duration-500 rounded-r-full" style={{ width: `${paidPct}%` }} />
                    <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${partialPct}%` }} />
                  </div>
                  <div className="flex gap-5 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> مسدد ({stats.paid.count})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> جزئي ({stats.partial.count})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" /> غير مسدد ({stats.unpaid.count})</span>
                  </div>
                </div>
              );
            })()}

            {/* Top accounts with remaining */}
            <div className="surface-card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-1 h-5 bg-red-500 rounded-full" />
                <div>
                  <h3 className="font-bold text-primary-900">حسابات عليها مبالغ متبقية</h3>
                  <p className="text-xs text-gray-500 mt-0.5">اضغط على الحساب لعرض التفاصيل</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                      <th className="px-4 py-3 font-semibold">الحساب</th>
                      <th className="px-4 py-3 font-semibold text-center">شحنات غير مسددة</th>
                      <th className="px-4 py-3 font-semibold">متبقي ($)</th>
                      <th className="px-4 py-3 font-semibold">متبقي (د.ع)</th>
                      <th className="px-4 py-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.topRemaining.map(a => (
                      <tr key={a.account_id} onClick={() => openAccount(a)}
                        className="border-b border-gray-50 hover:bg-red-50/40 cursor-pointer transition-colors">
                        <td className="px-4 py-3 font-semibold text-primary-900">{a.AccountName}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center bg-red-50 text-red-700 ring-1 ring-red-200 px-2.5 py-0.5 rounded-full text-xs font-bold min-w-[2rem]">{a.unpaid_count}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-red-600">{a.remaining_usd ? `$${formatNum(a.remaining_usd)}` : '-'}</td>
                        <td className="px-4 py-3 font-bold text-red-600">{a.remaining_iqd ? formatNum(a.remaining_iqd) : '-'}</td>
                        <td className="px-4 py-3"><ChevronLeft size={16} className="text-gray-300" /></td>
                      </tr>
                    ))}
                    {(!dashboard.topRemaining || dashboard.topRemaining.length === 0) && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">لا توجد حسابات عليها مبالغ متبقية</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ─── Account Detail View ───
  if (view === 'account-detail' && selectedAccount) return (
    <div className="page-shell">
      <PageHeader title={selectedAccount.AccountName} subtitle="تفاصيل التسديد" onBack={() => { setView('dashboard'); setShipmentDetail(null); loadDashboard(); }} />

      <div className="p-5 space-y-5">
        {/* Account summary cards */}
        {accountDetail && (
          <div className="grid grid-cols-3 gap-3">
            {accountDetail.shipments.map(s => {
              const variantMap = { paid: 'success', partial: 'warning', unpaid: 'danger' };
              return (
                <StatCard key={s.payment_status}
                  label={statusConfig[s.payment_status]?.label || s.payment_status}
                  value={s.count}
                  variant={variantMap[s.payment_status] || 'default'}
                  sub={s.remaining_usd ? `متبقي $${formatNum(s.remaining_usd)}` : (s.remaining_iqd ? `متبقي ${formatNum(s.remaining_iqd)} د.ع` : '')}
                />
              );
            })}
          </div>
        )}

        {/* Shipments list */}
        <div className="surface-card p-0 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-1 h-5 bg-accent-500 rounded-full" />
            <span className="font-bold text-primary-900">الشحنات ({accountShipments.total})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                  <th className="px-3 py-3 font-semibold">التاريخ</th>
                  <th className="px-3 py-3 font-semibold">المرجع</th>
                  <th className="px-3 py-3 font-semibold">المبلغ ($)</th>
                  <th className="px-3 py-3 font-semibold">المبلغ (د.ع)</th>
                  <th className="px-3 py-3 font-semibold">المسدد</th>
                  <th className="px-3 py-3 font-semibold">المتبقي</th>
                  <th className="px-3 py-3 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {accountShipments.rows.map(r => (
                  <tr key={r.shipment_id} onClick={() => openShipment(r.shipment_id)}
                    className={`border-b border-gray-50 hover:bg-primary-50/50 cursor-pointer transition-colors ${
                      r.payment_status === 'paid' ? 'opacity-50' : ''
                    }`}>
                    <td className="px-3 py-2.5">{r.trans_date?.split(' ')[0]}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{r.ref_no}</td>
                    <td className="px-3 py-2.5">{r.amount_usd ? `$${formatNum(r.amount_usd)}` : '-'}</td>
                    <td className="px-3 py-2.5">{r.amount_iqd ? formatNum(r.amount_iqd) : '-'}</td>
                    <td className="px-3 py-2.5 text-emerald-600 font-medium">{r.paid_usd ? `$${formatNum(r.paid_usd)}` : (r.paid_iqd ? `${formatNum(r.paid_iqd)} د.ع` : '-')}</td>
                    <td className="px-3 py-2.5 text-red-600 font-bold">
                      {r.remaining_usd > 0 ? `$${formatNum(r.remaining_usd)}` : ''}
                      {r.remaining_usd > 0 && r.remaining_iqd > 0 ? ' + ' : ''}
                      {r.remaining_iqd > 0 ? `${formatNum(r.remaining_iqd)} د.ع` : ''}
                      {r.remaining_usd <= 0 && r.remaining_iqd <= 0 ? '-' : ''}
                    </td>
                    <td className="px-3 py-2.5"><Badge status={r.payment_status} /></td>
                  </tr>
                ))}
                {accountShipments.rows.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">لا توجد شحنات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shipment detail modal */}
        {shipmentDetail && (
          <div className="fixed inset-0 bg-black/40 modal-backdrop z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShipmentDetail(null)}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-modal-in shadow-[0_8px_40px_rgba(0,0,0,0.15)]" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-5 py-4 flex justify-between items-center z-10">
                <button onClick={() => setShipmentDetail(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
                <h3 className="font-bold text-primary-900">تفاصيل الشحنة</h3>
              </div>

              <div className="p-5 space-y-5">
                {/* Shipment info */}
                <div className="flex justify-between items-center">
                  <Badge status={shipmentDetail.shipment.payment_status} />
                  <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{shipmentDetail.shipment.ref_no}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <span className="text-xs text-gray-500 block mb-1">المبلغ ($)</span>
                    <span className="font-bold text-primary-900">${formatNum(shipmentDetail.shipment.amount_usd)}</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <span className="text-xs text-gray-500 block mb-1">المبلغ (د.ع)</span>
                    <span className="font-bold text-primary-900">{formatNum(shipmentDetail.shipment.amount_iqd)}</span>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <span className="text-xs text-gray-500 block mb-1">المسدد ($)</span>
                    <span className="font-bold text-emerald-700">${formatNum(shipmentDetail.shipment.paid_usd)}</span>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3">
                    <span className="text-xs text-gray-500 block mb-1">المتبقي ($)</span>
                    <span className="font-bold text-red-700">${formatNum(shipmentDetail.shipment.remaining_usd)}</span>
                  </div>
                </div>

                {/* Linked payments */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                    <h4 className="font-bold text-sm text-primary-900">التسديدات المرتبطة ({shipmentDetail.allocations.length})</h4>
                  </div>
                  {shipmentDetail.allocations.length > 0 ? (
                    <div className="space-y-2">
                      {shipmentDetail.allocations.map(a => (
                        <div key={a.id} className="flex items-center justify-between bg-emerald-50/60 ring-1 ring-emerald-100 rounded-xl p-3.5">
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">{a.payment_date?.split(' ')[0]} - <span className="font-mono">{a.payment_ref}</span></div>
                            <div className="font-bold text-emerald-700">
                              {a.allocated_usd > 0 ? `$${formatNum(a.allocated_usd)}` : ''}
                              {a.allocated_usd > 0 && a.allocated_iqd > 0 ? ' + ' : ''}
                              {a.allocated_iqd > 0 ? `${formatNum(a.allocated_iqd)} د.ع` : ''}
                            </div>
                          </div>
                          {(can.isAdmin || can.deleteTransaction) && (
                            <button onClick={() => deleteAllocation(a.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-xl">لا توجد تسديدات مرتبطة</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return null;
}

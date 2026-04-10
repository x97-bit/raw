import { ChevronLeft, Zap } from 'lucide-react';
import EmptyTableRow from '../../../components/EmptyTableRow';
import LoadingSpinner from '../../../components/LoadingSpinner';
import PageHeader from '../../../components/PageHeader';
import { buildPaymentProgress, formatPaymentMatchingNumber } from '../paymentMatchingPageHelpers';
import PaymentStatCard from './PaymentStatCard';

export default function PaymentMatchingDashboardView({
  onBack,
  canAutoMatch,
  matching,
  onAutoMatch,
  loading,
  stats,
  topRemaining,
  onOpenAccount,
}) {
  const progress = buildPaymentProgress(stats);

  return (
    <div className="page-shell">
      <PageHeader title="ربط التسديد بالشحنات" subtitle="السيطرة على الأرقام" onBack={onBack}>
        {canAutoMatch && (
          <button
            onClick={onAutoMatch}
            disabled={matching}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition-all hover:bg-white/20 active:bg-white/5 disabled:opacity-50"
          >
            <Zap size={16} /> {matching ? 'جارٍ الربط...' : 'ربط تلقائي'}
          </button>
        )}
      </PageHeader>

      <div className="space-y-5 p-5">
        {loading ? <LoadingSpinner /> : stats && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <PaymentStatCard label="شحنات مسددة" value={stats.paid.count} variant="success" sub={stats.paid.total_usd ? `$${formatPaymentMatchingNumber(stats.paid.total_usd)}` : ''} />
              <PaymentStatCard label="جزئي" value={stats.partial.count} variant="warning" sub={stats.partial.remaining_usd ? `متبقي $${formatPaymentMatchingNumber(stats.partial.remaining_usd)}` : ''} />
              <PaymentStatCard
                label="غير مسدد"
                value={stats.unpaid.count}
                variant="danger"
                sub={stats.unpaid.remaining_usd ? `$${formatPaymentMatchingNumber(stats.unpaid.remaining_usd)}` : (stats.unpaid.remaining_iqd ? `${formatPaymentMatchingNumber(stats.unpaid.remaining_iqd)} د.ع` : '')}
              />
              <PaymentStatCard
                label="تسديدات غير مربوطة"
                variant="info"
                value={stats.payments.unallocated_usd > 0 || stats.payments.unallocated_iqd > 0 ? `$${formatPaymentMatchingNumber(stats.payments.unallocated_usd)}` : '0'}
                sub={stats.payments.unallocated_iqd > 0 ? `${formatPaymentMatchingNumber(stats.payments.unallocated_iqd)} د.ع` : ''}
              />
            </div>

            <div className="surface-card p-5">
              <div className="mb-3 flex justify-between text-sm">
                <span className="font-semibold text-primary-900">نسبة التسديد</span>
                <span className="text-gray-500">{progress.paidPct}% مسدد بالكامل</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-r-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress.paidPct}%` }} />
                <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${progress.partialPct}%` }} />
              </div>
              <div className="mt-3 flex gap-5 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> مسدد ({stats.paid.count})</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" /> جزئي ({stats.partial.count})</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-200" /> غير مسدد ({stats.unpaid.count})</span>
              </div>
            </div>

            <div className="surface-card overflow-hidden p-0">
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                <div className="h-5 w-1 rounded-full bg-red-500" />
                <div>
                  <h3 className="font-bold text-primary-900">حسابات عليها مبالغ متبقية</h3>
                  <p className="mt-0.5 text-xs text-gray-500">اضغط على الحساب لعرض التفاصيل</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                      <th className="px-4 py-3 font-semibold">الحساب</th>
                      <th className="px-4 py-3 text-center font-semibold">شحنات غير مسددة</th>
                      <th className="px-4 py-3 font-semibold">متبقي ($)</th>
                      <th className="px-4 py-3 font-semibold">متبقي (د.ع)</th>
                      <th className="w-8 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {topRemaining?.map((account) => (
                      <tr key={account.account_id} onClick={() => onOpenAccount(account)} className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-red-50/40">
                        <td className="px-4 py-3 font-semibold text-primary-900">{account.AccountName}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 ring-1 ring-red-200">{account.unpaid_count}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-red-600">{account.remaining_usd ? `$${formatPaymentMatchingNumber(account.remaining_usd)}` : '-'}</td>
                        <td className="px-4 py-3 font-bold text-red-600">{account.remaining_iqd ? formatPaymentMatchingNumber(account.remaining_iqd) : '-'}</td>
                        <td className="px-4 py-3"><ChevronLeft size={16} className="text-gray-300" /></td>
                      </tr>
                    ))}
                    {(!topRemaining || topRemaining.length === 0) && (
                      <EmptyTableRow colSpan={5} message="لا توجد حسابات عليها مبالغ متبقية" className="px-4 py-8 text-center text-gray-400" />
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
}

import { ChevronLeft, Zap, AlertTriangle, Eye, CheckCircle, X, Loader2 } from "lucide-react";
import EmptyTableRow from "../../../components/EmptyTableRow";
import LoadingSpinner from "../../../components/LoadingSpinner";
import PageHeader from "../../../components/PageHeader";
import {
  buildPaymentProgress,
  formatPaymentMatchingNumber,
} from "../paymentMatchingPageHelpers";
import PaymentStatCard from "./PaymentStatCard";

function AutoMatchPreviewModal({ show, loading, data, onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] px-6 py-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <Eye size={20} /> معاينة الربط التلقائي
          </h3>
          <button onClick={onCancel} className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <p className="text-sm text-gray-500">جارٍ تحليل البيانات...</p>
            </div>
          ) : data ? (
            <>
              {data.totalAllocations === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <CheckCircle size={48} className="text-emerald-400" />
                  <p className="text-lg font-semibold text-gray-700">لا توجد مطابقات جديدة</p>
                  <p className="text-sm text-gray-500">كل التسديدات مربوطة بالفعل</p>
                </div>
              ) : (
                <>
                  <div className="mb-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-center">
                      <div className="text-2xl font-bold text-blue-700">{data.totalAllocations}</div>
                      <div className="mt-1 text-xs text-gray-500">مطابقة جديدة</div>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-700">{data.accountsAffected}</div>
                      <div className="mt-1 text-xs text-gray-500">حساب متأثر</div>
                    </div>
                  </div>

                  {data.accounts && data.accounts.length > 0 && (
                    <div className="mb-5 max-h-48 overflow-y-auto rounded-xl border border-gray-100">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50">
                          <tr className="text-right">
                            <th className="px-3 py-2 font-semibold text-gray-600">الحساب</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">عدد</th>
                            <th className="px-3 py-2 font-semibold text-gray-600">المبلغ ($)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.accounts.map(acc => (
                            <tr key={acc.account_id} className="border-t border-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-800">{acc.AccountName}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                                  {acc.matchCount}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-700">
                                {acc.totalUsd > 0 ? `$${formatPaymentMatchingNumber(acc.totalUsd)}` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>سيتم ربط التسديدات بالفواتير تلقائياً حسب الحساب والتاريخ. هل تريد المتابعة؟</span>
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            إلغاء
          </button>
          {data && data.totalAllocations > 0 && (
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg"
            >
              <Zap size={16} /> تنفيذ الربط ({data.totalAllocations})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UnmatchedPaymentsSection({ data, loading }) {
  if (loading) {
    return (
      <div className="surface-card p-8 text-center">
        <Loader2 size={24} className="mx-auto animate-spin text-gray-400" />
        <p className="mt-2 text-sm text-gray-400">جارٍ تحميل المدفوعات...</p>
      </div>
    );
  }

  if (!data || data.total === 0) return null;

  return (
    <div className="surface-card overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-orange-500" />
          <div>
            <h3 className="font-bold text-primary-900">
              مدفوعات غير مطابقة
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              تسديدات لها رصيد غير مخصص لفواتير
            </p>
          </div>
        </div>
        <div className="flex gap-3 text-xs">
          {data.totalRemainingUsd > 0 && (
            <span className="rounded-full bg-orange-50 px-3 py-1.5 font-bold text-orange-700 ring-1 ring-orange-200">
              ${formatPaymentMatchingNumber(data.totalRemainingUsd)}
            </span>
          )}
          {data.totalRemainingIqd > 0 && (
            <span className="rounded-full bg-orange-50 px-3 py-1.5 font-bold text-orange-700 ring-1 ring-orange-200">
              {formatPaymentMatchingNumber(data.totalRemainingIqd)} د.ع
            </span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
              <th className="px-4 py-3 font-semibold">الحساب</th>
              <th className="px-4 py-3 font-semibold">التاريخ</th>
              <th className="px-4 py-3 font-semibold">المرجع</th>
              <th className="px-4 py-3 font-semibold">إجمالي ($)</th>
              <th className="px-4 py-3 font-semibold">مخصص ($)</th>
              <th className="px-4 py-3 font-semibold">متبقي ($)</th>
              <th className="px-4 py-3 font-semibold">متبقي (د.ع)</th>
            </tr>
          </thead>
          <tbody>
            {data.payments.map(payment => (
              <tr
                key={payment.payment_id}
                className="border-b border-gray-50 transition-colors hover:bg-orange-50/30"
              >
                <td className="px-4 py-3 font-semibold text-primary-900">
                  {payment.AccountName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  {payment.trans_date?.split(" ")[0]}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {payment.ref_no}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {payment.total_usd > 0 ? `$${formatPaymentMatchingNumber(payment.total_usd)}` : "-"}
                </td>
                <td className="px-4 py-3 text-emerald-600">
                  {payment.used_usd > 0 ? `$${formatPaymentMatchingNumber(payment.used_usd)}` : "-"}
                </td>
                <td className="px-4 py-3 font-bold text-orange-600">
                  {payment.remaining_usd > 0 ? `$${formatPaymentMatchingNumber(payment.remaining_usd)}` : "-"}
                </td>
                <td className="px-4 py-3 font-bold text-orange-600">
                  {payment.remaining_iqd > 0 ? formatPaymentMatchingNumber(payment.remaining_iqd) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PaymentMatchingDashboardView({
  onBack,
  canAutoMatch,
  matching,
  onAutoMatch,
  loading,
  stats,
  topRemaining,
  onOpenAccount,
  unmatchedPayments,
  loadingUnmatched,
  showPreview,
  previewData,
  loadingPreview,
  onConfirmAutoMatch,
  onCancelPreview,
}) {
  const progress = buildPaymentProgress(stats);

  return (
    <div className="page-shell">
      <PageHeader
        title="ربط التسديد بالشحنات"
        subtitle="السيطرة على الأرقام"
        onBack={onBack}
      >
        {canAutoMatch && (
          <button
            onClick={onAutoMatch}
            disabled={matching}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition-all hover:bg-white/20 active:bg-white/5 disabled:opacity-50"
          >
            <Zap size={16} /> {matching ? "جارٍ الربط..." : "ربط تلقائي"}
          </button>
        )}
      </PageHeader>

      <div className="space-y-5 p-5">
        {loading ? (
          <LoadingSpinner />
        ) : (
          stats && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <PaymentStatCard
                  label="شحنات مسددة"
                  value={stats.paid.count}
                  variant="success"
                  sub={
                    stats.paid.total_usd
                      ? `$${formatPaymentMatchingNumber(stats.paid.total_usd)}`
                      : ""
                  }
                />
                <PaymentStatCard
                  label="جزئي"
                  value={stats.partial.count}
                  variant="warning"
                  sub={
                    stats.partial.remaining_usd
                      ? `متبقي $${formatPaymentMatchingNumber(stats.partial.remaining_usd)}`
                      : ""
                  }
                />
                <PaymentStatCard
                  label="غير مسدد"
                  value={stats.unpaid.count}
                  variant="danger"
                  sub={
                    stats.unpaid.remaining_usd
                      ? `$${formatPaymentMatchingNumber(stats.unpaid.remaining_usd)}`
                      : stats.unpaid.remaining_iqd
                        ? `${formatPaymentMatchingNumber(stats.unpaid.remaining_iqd)} د.ع`
                        : ""
                  }
                />
                <PaymentStatCard
                  label="تسديدات غير مربوطة"
                  variant="info"
                  value={
                    stats.payments.unallocated_usd > 0 ||
                    stats.payments.unallocated_iqd > 0
                      ? `$${formatPaymentMatchingNumber(stats.payments.unallocated_usd)}`
                      : "0"
                  }
                  sub={
                    stats.payments.unallocated_iqd > 0
                      ? `${formatPaymentMatchingNumber(stats.payments.unallocated_iqd)} د.ع`
                      : ""
                  }
                />
              </div>

              <div className="surface-card p-5">
                <div className="mb-3 flex justify-between text-sm">
                  <span className="font-semibold text-primary-900">
                    نسبة التسديد
                  </span>
                  <span className="text-gray-500">
                    {progress.paidPct}% مسدد بالكامل
                  </span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-r-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${progress.paidPct}%` }}
                  />
                  <div
                    className="h-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${progress.partialPct}%` }}
                  />
                </div>
                <div className="mt-3 flex gap-5 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />{" "}
                    مسدد ({stats.paid.count})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />{" "}
                    جزئي ({stats.partial.count})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-200" />{" "}
                    غير مسدد ({stats.unpaid.count})
                  </span>
                </div>
              </div>

              {/* Unmatched Payments Section */}
              <UnmatchedPaymentsSection
                data={unmatchedPayments}
                loading={loadingUnmatched}
              />

              <div className="surface-card overflow-hidden p-0">
                <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                  <div className="h-5 w-1 rounded-full bg-red-500" />
                  <div>
                    <h3 className="font-bold text-primary-900">
                      حسابات عليها مبالغ متبقية
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      اضغط على الحساب لعرض التفاصيل
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                        <th className="px-4 py-3 font-semibold">الحساب</th>
                        <th className="px-4 py-3 text-center font-semibold">
                          شحنات غير مسددة
                        </th>
                        <th className="px-4 py-3 font-semibold">متبقي ($)</th>
                        <th className="px-4 py-3 font-semibold">متبقي (د.ع)</th>
                        <th className="w-8 px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {topRemaining?.map(account => (
                        <tr
                          key={account.account_id}
                          onClick={() => onOpenAccount(account)}
                          className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-red-50/40"
                        >
                          <td className="px-4 py-3 font-semibold text-primary-900">
                            {account.AccountName}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 ring-1 ring-red-200">
                              {account.unpaid_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-red-600">
                            {account.remaining_usd
                              ? `$${formatPaymentMatchingNumber(account.remaining_usd)}`
                              : "-"}
                          </td>
                          <td className="px-4 py-3 font-bold text-red-600">
                            {account.remaining_iqd
                              ? formatPaymentMatchingNumber(
                                  account.remaining_iqd
                                )
                              : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <ChevronLeft size={16} className="text-gray-300" />
                          </td>
                        </tr>
                      ))}
                      {(!topRemaining || topRemaining.length === 0) && (
                        <EmptyTableRow
                          colSpan={5}
                          message="لا توجد حسابات عليها مبالغ متبقية"
                          className="px-4 py-8 text-center text-gray-400"
                        />
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )
        )}
      </div>

      {/* Auto-match Preview Modal */}
      <AutoMatchPreviewModal
        show={showPreview}
        loading={loadingPreview}
        data={previewData}
        onConfirm={onConfirmAutoMatch}
        onCancel={onCancelPreview}
      />
    </div>
  );
}

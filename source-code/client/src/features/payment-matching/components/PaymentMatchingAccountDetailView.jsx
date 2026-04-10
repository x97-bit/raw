import EmptyTableRow from '../../../components/EmptyTableRow';
import PageHeader from '../../../components/PageHeader';
import {
  PAYMENT_STATUS_CONFIG,
  PAYMENT_SUMMARY_VARIANTS,
} from '../../../utils/paymentMatchingConfig';
import {
  formatOutstandingAmount,
  formatPaidAmount,
  formatPaymentMatchingNumber,
} from '../paymentMatchingPageHelpers';
import PaymentStatCard from './PaymentStatCard';
import PaymentStatusBadge from './PaymentStatusBadge';
import PaymentMatchingShipmentDetailModal from './PaymentMatchingShipmentDetailModal';

export default function PaymentMatchingAccountDetailView({
  selectedAccount,
  accountDetail,
  accountShipments,
  shipmentDetail,
  canDeleteAllocation,
  onBack,
  onOpenShipment,
  onDeleteAllocation,
  onCloseShipment,
}) {
  return (
    <div className="page-shell">
      <PageHeader title={selectedAccount.AccountName} subtitle="تفاصيل التسديد" onBack={onBack} />

      <div className="space-y-5 p-5">
        {accountDetail && (
          <div className="grid grid-cols-3 gap-3">
            {accountDetail.shipments.map((shipment) => (
              <PaymentStatCard
                key={shipment.payment_status}
                label={PAYMENT_STATUS_CONFIG[shipment.payment_status]?.label || shipment.payment_status}
                value={shipment.count}
                variant={PAYMENT_SUMMARY_VARIANTS[shipment.payment_status] || 'default'}
                sub={shipment.remaining_usd ? `متبقي $${formatPaymentMatchingNumber(shipment.remaining_usd)}` : (shipment.remaining_iqd ? `متبقي ${formatPaymentMatchingNumber(shipment.remaining_iqd)} د.ع` : '')}
              />
            ))}
          </div>
        )}

        <div className="surface-card overflow-hidden p-0">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3.5">
            <div className="h-5 w-1 rounded-full bg-accent-500" />
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
                {accountShipments.rows.map((row) => (
                  <tr
                    key={row.shipment_id}
                    onClick={() => onOpenShipment(row.shipment_id)}
                    className={`cursor-pointer border-b border-gray-50 transition-colors hover:bg-primary-50/50 ${row.payment_status === 'paid' ? 'opacity-50' : ''}`}
                  >
                    <td className="px-3 py-2.5">{row.trans_date?.split(' ')[0]}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{row.ref_no}</td>
                    <td className="px-3 py-2.5">{row.amount_usd ? `$${formatPaymentMatchingNumber(row.amount_usd)}` : '-'}</td>
                    <td className="px-3 py-2.5">{row.amount_iqd ? formatPaymentMatchingNumber(row.amount_iqd) : '-'}</td>
                    <td className="px-3 py-2.5 font-medium text-emerald-600">{formatPaidAmount(row.paid_usd, row.paid_iqd)}</td>
                    <td className="px-3 py-2.5 font-bold text-red-600">{formatOutstandingAmount(row.remaining_usd, row.remaining_iqd)}</td>
                    <td className="px-3 py-2.5"><PaymentStatusBadge status={row.payment_status} /></td>
                  </tr>
                ))}
                {accountShipments.rows.length === 0 && (
                  <EmptyTableRow colSpan={7} message="لا توجد شحنات" className="px-4 py-8 text-center text-gray-400" />
                )}
              </tbody>
            </table>
          </div>
        </div>

        <PaymentMatchingShipmentDetailModal
          shipmentDetail={shipmentDetail}
          canDeleteAllocation={canDeleteAllocation}
          onDeleteAllocation={onDeleteAllocation}
          onClose={onCloseShipment}
        />
      </div>
    </div>
  );
}

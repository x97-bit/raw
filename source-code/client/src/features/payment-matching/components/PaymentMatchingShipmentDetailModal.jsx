import { X } from 'lucide-react';
import {
  formatAllocationAmount,
  formatPaymentMatchingNumber,
} from '../paymentMatchingPageHelpers';
import PaymentStatusBadge from './PaymentStatusBadge';

export default function PaymentMatchingShipmentDetailModal({
  shipmentDetail,
  canDeleteAllocation,
  onDeleteAllocation,
  onClose,
}) {
  if (!shipmentDetail) {
    return null;
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="animate-modal-in max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.15)] sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur-sm">
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
          <h3 className="font-bold text-primary-900">تفاصيل الشحنة</h3>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-center justify-between">
            <PaymentStatusBadge status={shipmentDetail.shipment.payment_status} />
            <span className="rounded-md bg-gray-50 px-2 py-1 font-mono text-xs text-gray-400">{shipmentDetail.shipment.ref_no}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <span className="mb-1 block text-xs text-gray-500">المبلغ ($)</span>
              <span className="font-bold text-primary-900">${formatPaymentMatchingNumber(shipmentDetail.shipment.amount_usd)}</span>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <span className="mb-1 block text-xs text-gray-500">المبلغ (د.ع)</span>
              <span className="font-bold text-primary-900">{formatPaymentMatchingNumber(shipmentDetail.shipment.amount_iqd)}</span>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <span className="mb-1 block text-xs text-gray-500">المسدد ($)</span>
              <span className="font-bold text-emerald-700">${formatPaymentMatchingNumber(shipmentDetail.shipment.paid_usd)}</span>
            </div>
            <div className="rounded-xl bg-red-50 p-3">
              <span className="mb-1 block text-xs text-gray-500">المتبقي ($)</span>
              <span className="font-bold text-red-700">${formatPaymentMatchingNumber(shipmentDetail.shipment.remaining_usd)}</span>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-4 w-1 rounded-full bg-emerald-500" />
              <h4 className="text-sm font-bold text-primary-900">التسديدات المرتبطة ({shipmentDetail.allocations.length})</h4>
            </div>
            {shipmentDetail.allocations.length > 0 ? (
              <div className="space-y-2">
                {shipmentDetail.allocations.map((allocation) => (
                  <div key={allocation.id} className="flex items-center justify-between rounded-xl bg-emerald-50/60 p-3.5 ring-1 ring-emerald-100">
                    <div>
                      <div className="mb-0.5 text-xs text-gray-500">
                        {allocation.payment_date?.split(' ')[0]} - <span className="font-mono">{allocation.payment_ref}</span>
                      </div>
                      <div className="font-bold text-emerald-700">{formatAllocationAmount(allocation)}</div>
                    </div>
                    {canDeleteAllocation && (
                      <button onClick={() => onDeleteAllocation(allocation.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-300 transition-colors hover:bg-red-50 hover:text-red-600">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 py-6 text-center text-sm text-gray-400">لا توجد تسديدات مرتبطة</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { DetailTile, SectionCard } from './TransactionModalPrimitives';

export default function TransactionPreviewPanel({
  transaction,
  detailItems,
  amountUsd,
  amountIqd,
  costUsd,
  sectionKey,
}) {
  const isTransport = sectionKey === 'transport-1';
  const amountTone = (transaction.AmountUSD || 0) < 0
    ? 'text-red-600'
    : (isTransport ? 'text-rose-600' : 'text-emerald-600');
  const amountIqdTone = (transaction.AmountIQD || 0) < 0
    ? 'text-red-600'
    : (isTransport ? 'text-rose-600' : 'text-slate-900');

  return (
    <div className="p-5 md:p-6">
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200/85 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <span className="text-xs font-semibold text-slate-500">المبلغ دولار</span>
          <p className={`mt-2 text-2xl font-black ${amountTone}`}>{amountUsd}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200/85 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <span className="text-xs font-semibold text-slate-500">المبلغ دينار</span>
          <p className={`mt-2 text-2xl font-black ${amountIqdTone}`}>{amountIqd}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200/85 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <span className="text-xs font-semibold text-slate-500">الكلفة دولار</span>
          <p className="mt-2 text-2xl font-black text-slate-900">{costUsd}</p>
        </div>
      </div>

      <SectionCard title="تفاصيل المعاملة" subtitle="عرض القيم الأساسية والمخصصة المرتبطة بهذه الحركة">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {detailItems.map((item, index) => (
            <DetailTile key={index} {...item} />
          ))}
        </div>
      </SectionCard>

      {(transaction.Notes || transaction.TraderNote || transaction.CustomsNote) && (
        <div className="mt-5 rounded-[1.5rem] border border-amber-200/85 bg-amber-50/85 p-4 md:p-5 shadow-[0_10px_24px_rgba(217,119,6,0.06)]">
          <span className="mb-2 block text-xs font-black tracking-wide text-amber-700">الملاحظات</span>
          {transaction.Notes && <p className="text-sm text-slate-700">{transaction.Notes}</p>}
          {transaction.TraderNote && <p className="mt-2 text-sm text-slate-600">ملاحظات التاجر: {transaction.TraderNote}</p>}
          {transaction.CustomsNote && <p className="mt-2 text-sm text-slate-600">ملاحظات الكمرك: {transaction.CustomsNote}</p>}
        </div>
      )}
    </div>
  );
}

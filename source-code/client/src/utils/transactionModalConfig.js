import { getTransactionReferenceLabel } from './transactionTypeLabels';

export const formatTransactionModalNumber = (value) => (
  value ? Number(value).toLocaleString('en-US') : '0'
);

export const TRANSACTION_MODAL_BUILT_IN_FIELD_FALLBACKS = {
  trans_date: 'التاريخ',
  account_name: 'اسم التاجر',
  currency: 'العملة',
  amount_usd: 'المبلغ ($)',
  amount_iqd: 'المبلغ (د.ع)',
  cost_usd: 'الكلفة ($)',
  cost_iqd: 'الكلفة دينار',
  weight: 'الوزن',
  qty: 'العدد',
  meters: 'الأمتار',
  driver_name: 'اسم السائق',
  vehicle_plate: 'رقم السيارة',
  good_type: 'نوع البضاعة',
  gov_name: 'المحافظة',
  company_name: 'الشركة',
  carrier_name: 'اسم الناقل',
  fee_usd: 'النقل السعودي ($)',
  syr_cus: 'الكمرك السوري',
  car_qty: 'عدد السيارات',
  trans_price: 'سعر النقل',
  trader_note: 'ملاحظات التاجر',
  notes: 'الملاحظات',
};

export const TRANSACTION_MODAL_BUILT_IN_FIELD_PLACEHOLDERS = {
  account_name: 'ابدأ بكتابة اسم التاجر...',
  driver_name: 'اكتب اسم السائق...',
  vehicle_plate: 'اكتب رقم السيارة...',
  good_type: 'اكتب نوع البضاعة...',
  gov_name: 'اكتب المحافظة أو الجهة الحكومية...',
  company_name: 'اكتب اسم الشركة...',
  carrier_name: 'اكتب اسم الناقل...',
};

export const buildTransactionDetailItems = ({
  transaction,
  transactionLabel,
  customDetailItems = [],
  sectionKey,
}) => {
  if (!transaction) return [];

  const isTransport = sectionKey === 'transport-1';
  const amountUsd = transaction.AmountUSD ? `$${formatTransactionModalNumber(transaction.AmountUSD)}` : '-';
  const amountIqd = transaction.AmountIQD ? formatTransactionModalNumber(transaction.AmountIQD) : '-';
  const costUsd = transaction.CostUSD ? `$${formatTransactionModalNumber(transaction.CostUSD)}` : '-';
  const positiveBalanceColor = isTransport ? 'text-rose-600' : 'text-emerald-600';

  return [
    { label: 'التاريخ', value: transaction.TransDate?.split(' ')[0] || '-' },
    { label: 'نوع الحركة', value: transactionLabel, badge: true, type: transaction.TransTypeID },
    { label: 'اسم التاجر', value: transaction.AccountName || transaction.TraderName || '-', bold: true },
    {
      label: getTransactionReferenceLabel(transaction.TransTypeID, { sectionKey, recordType: transaction.RecordType }),
      value: transaction.RefNo || '-',
    },
    {
      label: 'المبلغ ($)',
      value: amountUsd,
      color: (transaction.AmountUSD || 0) < 0 ? 'text-red-600' : positiveBalanceColor,
      bold: true,
    },
    { label: 'المبلغ (د.ع)', value: amountIqd },
    { label: 'الكلفة ($)', value: costUsd },
    { label: 'الكلفة دينار', value: transaction.CostIQD ? formatTransactionModalNumber(transaction.CostIQD) : '-' },
    { label: 'نوع البضاعة', value: transaction.GoodTypeName || transaction.GoodType || '-' },
    { label: 'الوزن', value: transaction.Weight ? formatTransactionModalNumber(transaction.Weight) : '-' },
    { label: 'العدد', value: transaction.Qty || '-' },
    { label: 'الأمتار', value: transaction.Meters || '-' },
    { label: 'اسم السائق', value: transaction.DriverName || '-' },
    { label: 'رقم السيارة', value: transaction.PlateNumber || transaction.VehiclePlate || '-' },
    { label: 'المحافظة', value: transaction.GovName || '-' },
    { label: 'المنفذ', value: transaction.PortName || '-' },
    ...(transaction.ProfitUSD && transaction.TransTypeID === 1
      ? [{
          label: 'الربح ($)',
          value: `${formatTransactionModalNumber(transaction.ProfitUSD)}`,
          color: (transaction.ProfitUSD || 0) >= 0 ? 'text-emerald-600' : 'text-red-600',
          bold: true,
        }]
      : []),
    ...(!isTransport && transaction.runningUSD !== undefined
      ? [{
          label: 'الرصيد التراكمي ($)',
          value: `${formatTransactionModalNumber(transaction.runningUSD)}`,
          color: (transaction.runningUSD || 0) >= 0 ? positiveBalanceColor : 'text-red-600',
          bold: true,
        }]
      : []),
    ...(transaction.runningIQD !== undefined
      ? [{
          label: isTransport ? 'المتبقي علينا (د.ع)' : 'الرصيد التراكمي (د.ع)',
          value: formatTransactionModalNumber(transaction.runningIQD),
          color: (transaction.runningIQD || 0) >= 0 ? positiveBalanceColor : 'text-red-600',
          bold: true,
        }]
      : []),
    ...(transaction.SyrCus ? [{ label: 'الكمرك السوري', value: `${formatTransactionModalNumber(transaction.SyrCus)}` }] : []),
    ...(transaction.CarQty ? [{ label: 'عدد السيارات', value: transaction.CarQty }] : []),
    ...(transaction.TransPrice ? [{ label: 'سعر النقل', value: formatTransactionModalNumber(transaction.TransPrice) }] : []),
    ...(transaction.CarrierName ? [{ label: 'اسم الناقل', value: transaction.CarrierName }] : []),
    ...(transaction.CompanyName ? [{ label: 'الشركة', value: transaction.CompanyName }] : []),
    ...customDetailItems,
  ];
};

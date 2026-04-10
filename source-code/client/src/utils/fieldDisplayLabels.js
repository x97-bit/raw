const STANDARD_FIELD_LABELS = {
  ref_no: 'رقم الفاتورة',
  direction: 'نوع الحركة',
  trans_date: 'التاريخ',
  currency: 'العملة',
  driver_name: 'اسم السائق',
  vehicle_plate: 'رقم السيارة',
  good_type: 'نوع البضاعة',
  weight: 'الوزن',
  meters: 'الأمتار',
  qty: 'العدد',
  cost_usd: 'الكلفة دولار',
  amount_usd: 'المبلغ دولار',
  cost_iqd: 'الكلفة دينار',
  amount_iqd: 'المبلغ دينار',
  fee_usd: 'النقل السعودي $',
  syr_cus: 'الكمرك السوري',
  car_qty: 'عدد السيارات',
  trans_price: 'نقل عراقي (دينار)',
  carrier_name: 'اسم الناقل',
  gov_name: 'المحافظة',
  company_name: 'الشركة',
  profit_usd: 'الربح ($)',
  profit_iqd: 'الربح (د.ع)',
  running_usd: 'الرصيد التراكمي ($)',
  running_iqd: 'الرصيد التراكمي (د.ع)',
};

const COMPACT_EXPORT_OVERRIDES = {
  cost_usd: 'الكلفة $',
  amount_usd: 'المبلغ $',
};

const FIELD_KEY_ALIASES = {
  RefNo: 'ref_no',
  TransTypeName: 'direction',
  TransDate: 'trans_date',
  Currency: 'currency',
  DriverName: 'driver_name',
  VehiclePlate: 'vehicle_plate',
  GoodTypeName: 'good_type',
  Weight: 'weight',
  Meters: 'meters',
  Qty: 'qty',
  CostUSD: 'cost_usd',
  AmountUSD: 'amount_usd',
  CostIQD: 'cost_iqd',
  AmountIQD: 'amount_iqd',
  FeeUSD: 'fee_usd',
  SyrCus: 'syr_cus',
  CarQty: 'car_qty',
  TransPrice: 'trans_price',
  CarrierName: 'carrier_name',
  Governorate: 'gov_name',
  CompanyName: 'company_name',
  ProfitUSD: 'profit_usd',
  ProfitIQD: 'profit_iqd',
  runningUSD: 'running_usd',
  runningIQD: 'running_iqd',
};

function normalizeFieldKey(fieldKey) {
  return FIELD_KEY_ALIASES[fieldKey] || fieldKey;
}

export function getFieldDisplayLabel(fieldKey, options = {}) {
  const {
    variant = 'screen',
    fallback,
  } = options;
  const normalizedFieldKey = normalizeFieldKey(fieldKey);

  if (variant === 'payment-ref' && normalizedFieldKey === 'ref_no') {
    return 'رقم سند القبض';
  }

  if (variant === 'compact-export' && COMPACT_EXPORT_OVERRIDES[normalizedFieldKey]) {
    return COMPACT_EXPORT_OVERRIDES[normalizedFieldKey];
  }

  return STANDARD_FIELD_LABELS[normalizedFieldKey] || fallback || fieldKey;
}

export function isStandardFieldLabel(fieldKey) {
  return Object.prototype.hasOwnProperty.call(STANDARD_FIELD_LABELS, normalizeFieldKey(fieldKey));
}

export function createAuditFilters(overrides = {}) {
  return {
    entityType: '',
    action: '',
    username: '',
    from: '',
    to: '',
    limit: 100,
    ...overrides,
  };
}

export function buildAuditLogsQuery(filters = {}) {
  const params = new URLSearchParams();

  if (filters.entityType) params.set('entityType', filters.entityType);
  if (filters.action) params.set('action', filters.action);
  if (filters.username) params.set('username', filters.username);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  params.set('limit', String(filters.limit || 100));

  return params.toString();
}

export function parseAuditField(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function formatAuditDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString('ar-IQ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const AUDIT_FIELD_LABELS = {
  id: 'المعرف',
  RefNo: 'رقم الفاتورة',
  TransDate: 'التاريخ',
  AccountName: 'اسم التاجر',
  AccountID: 'معرف الحساب',
  Currency: 'العملة',
  DriverName: 'اسم السائق',
  VehiclePlate: 'رقم السيارة',
  GoodTypeName: 'نوع البضاعة',
  Weight: 'الوزن',
  Meters: 'الأمتار',
  Qty: 'العدد',
  CostUSD: 'الكلفة دولار',
  AmountUSD: 'المبلغ دولار',
  CostIQD: 'الكلفة دينار',
  AmountIQD: 'المبلغ دينار',
  FeeUSD: 'النقل السعودي $',
  SyrCus: 'الكمرك السوري',
  TransPrice: 'نقل عراقي (دينار)',
  CarrierName: 'اسم الناقل',
  CarQty: 'عدد السيارات',
  Governorate: 'المحافظة',
  CompanyName: 'الشركة',
  TransTypeName: 'نوع الحركة',
  TransTypeID: 'معرف نوع الحركة',
  TraderNote: 'ملاحظات التاجر',
  Notes: 'ملاحظات المالك',
  PortID: 'معرف المنفذ',
  SectionKey: 'القسم',
  RecordType: 'نوع السجل',
  ProfitUSD: 'الربح ($)',
  ProfitIQD: 'الربح (د.ع)',
  CreatedAt: 'تاريخ الإنشاء',
  UpdatedAt: 'تاريخ التعديل',
  createdAt: 'تاريخ الإنشاء',
  updatedAt: 'تاريخ التعديل',
  refNo: 'رقم الفاتورة',
  portId: 'معرف المنفذ',
  accountId: 'معرف الحساب',
  changedKeys: 'الحقول المعدلة',
  accountType: 'نوع الحساب',
  name: 'الاسم',
  balance: 'الرصيد',
  description: 'الوصف',
  amount: 'المبلغ',
  type: 'النوع',
  date: 'التاريخ',
  note: 'الملاحظة',
  status: 'الحالة',
  title: 'العنوان',
  label: 'التسمية',
  fieldKey: 'مفتاح الحقل',
  fieldType: 'نوع الحقل',
  sectionKey: 'القسم',
  visible: 'مرئي',
  required: 'مطلوب',
  defaultValue: 'القيمة الافتراضية',
  ShipID: 'معرف الشحنة',
  shipId: 'معرف الشحنة',
  TransID: 'معرف الحركة',
  transId: 'معرف الحركة',
  ArriveDate: 'تاريخ الوصول',
  arriveDate: 'تاريخ الوصول',
  PlateNo: 'رقم السيارة',
  plateNo: 'رقم السيارة',
  Company: 'الشركة',
  company: 'الشركة',
  CostDollar: 'التكلفة (دولار)',
  costDollar: 'التكلفة (دولار)',
  FeeDollar: 'أجور التخليص ($)',
  feeDollar: 'أجور التخليص ($)',
  syrCus: 'الكمرك السوري',
  SyrCusReceipt: 'فاتورة الكمرك السوري',
  syrCusReceipt: 'فاتورة الكمرك السوري',
  SyrCusOffice: 'مكتب الكمرك السوري',
  syrCusOffice: 'مكتب الكمرك السوري',
  PortCharges: 'أجور المنفذ',
  portCharges: 'أجور المنفذ',
  Taxes: 'الضرائب',
  taxes: 'الضرائب',
  Clearance: 'التخليص',
  clearance: 'التخليص',
  Borders: 'الحدود',
  borders: 'الحدود',
  SyrBorders: 'الحدود السورية',
  syrBorders: 'الحدود السورية',
  Receipt: 'الوصل',
  receipt: 'الوصل',
  TotalSyr: 'الإجمالي السوري',
  totalSyr: 'الإجمالي السوري',
  SyrLira: 'الليرة السورية',
  syrLira: 'الليرة السورية',
  SyrBordersLira: 'الحدود السورية بالليرة',
  syrBordersLira: 'الحدود السورية بالليرة',
  CostIraqi: 'التكلفة (عراقي)',
  costIraqi: 'التكلفة (عراقي)',
  TransSyrLira: 'نقل سوري ليرة',
  transSyrLira: 'نقل سوري ليرة',
  TotalCostDollar: 'إجمالي التكلفة (دولار)',
  totalCostDollar: 'إجمالي التكلفة (دولار)',
  TotalCostIraqi: 'إجمالي التكلفة (عراقي)',
  totalCostIraqi: 'إجمالي التكلفة (عراقي)',
  notes: 'ملاحظات المالك',
  PaidDollar: 'المدفوع (دولار)',
  paidDollar: 'المدفوع (دولار)',
  PaidIraqi: 'المدفوع (عراقي)',
  paidIraqi: 'المدفوع (عراقي)',
  RemainDollar: 'المتبقي (دولار)',
  remainDollar: 'المتبقي (دولار)',
  RemainIraqi: 'المتبقي (عراقي)',
  remainIraqi: 'المتبقي (عراقي)',
  StatementID: 'معرف الكشف',
  statementId: 'معرف الكشف',
  Phone: 'رقم الهاتف',
  phone: 'رقم الهاتف',
  Address: 'العنوان',
  address: 'العنوان',
  Username: 'اسم المستخدم',
  username: 'اسم المستخدم',
  Password: 'كلمة المرور',
  password: 'كلمة المرور',
  Role: 'الصلاحية',
  role: 'الصلاحية',
  PortName: 'اسم المنفذ',
  portName: 'اسم المنفذ',
  Direction: 'الاتجاه',
  direction: 'الاتجاه',
  amountIQD: 'المبلغ دينار',
  amountUSD: 'المبلغ دولار',
  balanceIQD: 'الرصيد دينار',
  balanceUSD: 'الرصيد دولار',
  DriverPhone: 'رقم السائق',
  driverPhone: 'رقم السائق',
  amount1: 'المبلغ 1',
  amount2: 'المبلغ 2',
  amount3: 'المبلغ 3',
  transTypeName: 'نوع الحركة',
  goodTypeName: 'نوع البضاعة',
  profitUSD: 'الربح ($)',
  profitIQD: 'الربح (د.ع)',
  traderNote: 'ملاحظات التاجر',
  carQty: 'عدد السيارات',
  meters: 'الأمتار',
  weight: 'الوزن',
  driverName: 'اسم السائق',
  carrierName: 'اسم الناقل',
  transTypeId: 'معرف نوع الحركة',
  recordType: 'نوع السجل',
  transDate: 'التاريخ',
  accountName: 'اسم الحساب',
  currency: 'العملة',
  vehiclePlate: 'رقم السيارة',
  qty: 'العدد',
  costUSD: 'التكلفة دولار',
  costIQD: 'التكلفة دينار',
  feeUSD: 'رسوم دولار',
  transPrice: 'سعر النقل',
  governorate: 'المحافظة',
  companyName: 'الشركة',
};

export function getAuditFieldLabel(key) {
  return AUDIT_FIELD_LABELS[key] || key;
}

export function formatAuditValue(value) {
  if (value === null || value === undefined) return '-';
  if (value === true) return 'نعم';
  if (value === false) return 'لا';
  if (Array.isArray(value)) return value.map(formatAuditValue).join('، ');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([k, v]) => `${getAuditFieldLabel(k)}: ${v === null || v === undefined ? '-' : typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
      .join(' | ');
  }
  return String(value);
}

export function buildAuditStats(rows = []) {
  return {
    total: rows.length,
    creates: rows.filter((row) => row.action === 'create').length,
    updates: rows.filter((row) => row.action === 'update').length,
    deletes: rows.filter((row) => row.action === 'delete').length,
  };
}

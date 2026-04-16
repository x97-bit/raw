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
};

export function getAuditFieldLabel(key) {
  return AUDIT_FIELD_LABELS[key] || key;
}

export function formatAuditValue(value) {
  if (value === null || value === undefined) return '-';
  if (value === true) return 'نعم';
  if (value === false) return 'لا';
  if (Array.isArray(value)) return value.join('، ');
  if (typeof value === 'object') return JSON.stringify(value);
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

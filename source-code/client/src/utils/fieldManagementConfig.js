import { ClipboardList, Columns3, CreditCard, FileText } from 'lucide-react';

export const DEBT_FIELDS = [
  { key: 'trans_date', label: 'التاريخ', type: 'date' },
  { key: 'account_name', label: 'الشخص', type: 'text' },
  { key: 'amount_usd', label: 'المبلغ ($)', type: 'money' },
  { key: 'fee_usd', label: 'الرسوم ($)', type: 'money' },
  { key: 'amount_iqd', label: 'المبلغ (د.ع)', type: 'number' },
  { key: 'fee_iqd', label: 'الرسوم (د.ع)', type: 'number' },
  { key: 'trans_type', label: 'النوع', type: 'text' },
  { key: 'state', label: 'الحالة', type: 'text' },
  { key: 'notes', label: 'ملاحظات', type: 'text' },
];

export const SPECIAL_HAIDER_FIELDS = [
  { key: 'trans_date', label: 'التاريخ', type: 'date' },
  { key: 'driver_name', label: 'السائق', type: 'text' },
  { key: 'vehicle_plate', label: 'السيارة', type: 'text' },
  { key: 'good_type', label: 'البضاعة', type: 'text' },
  { key: 'weight', label: 'الوزن', type: 'number' },
  { key: 'amount_usd', label: 'المبلغ دولار', type: 'money' },
  { key: 'amount_iqd', label: 'المبلغ دينار', type: 'number' },
  { key: 'difference_iqd', label: 'الفرق دينار', type: 'number' },
  { key: 'notes', label: 'ملاحظات', type: 'text' },
];

export const SPECIAL_PARTNER_FIELDS = [
  { key: 'trans_date', label: 'التاريخ', type: 'date' },
  { key: 'port_name', label: 'المنفذ', type: 'text' },
  { key: 'trader_name', label: 'التاجر', type: 'text' },
  { key: 'driver_name', label: 'السائق', type: 'text' },
  { key: 'vehicle_plate', label: 'السيارة', type: 'text' },
  { key: 'good_type', label: 'البضاعة', type: 'text' },
  { key: 'gov_name', label: 'الجهة الحكومية', type: 'text' },
  { key: 'company_name', label: 'الشركة', type: 'text' },
  { key: 'qty', label: 'العدد', type: 'number' },
  { key: 'amount_usd', label: 'المبلغ عليه ($)', type: 'money' },
  { key: 'amount_usd_partner', label: 'المبلغ له ($)', type: 'money' },
  { key: 'difference_iqd', label: 'الفرق', type: 'number' },
  { key: 'clr', label: 'التخليص', type: 'number' },
  { key: 'tx', label: 'المأمور', type: 'number' },
  { key: 'taxi_water', label: 'التكسي', type: 'number' },
  { key: 'notes', label: 'ملاحظات', type: 'text' },
];

export const FX_FIELDS = [
  { key: 'ref_no', label: 'رقم الوصل', type: 'text' },
  { key: 'trans_date', label: 'التاريخ', type: 'date' },
  { key: 'account_name', label: 'اسم التاجر', type: 'text' },
  { key: 'currency', label: 'العملة', type: 'text' },
  { key: 'amount_usd', label: 'المبلغ دولار', type: 'money' },
  { key: 'amount_iqd', label: 'المبلغ دينار', type: 'money' },
  { key: 'cost_usd', label: 'التكلفة بالدولار', type: 'money' },
  { key: 'cost_iqd', label: 'التكلفة بالدينار', type: 'money' },
  { key: 'notes', label: 'ملاحظات', type: 'text' },
];

export const TRIAL_BALANCE_FIELDS = [
  { key: 'account_name', label: 'الحساب', type: 'text' },
  { key: 'account_type', label: 'النوع', type: 'text' },
  { key: 'shipment_count', label: 'عدد الشحنات', type: 'number' },
  { key: 'debit_usd', label: 'مدين ($)', type: 'money' },
  { key: 'credit_usd', label: 'دائن ($)', type: 'money' },
  { key: 'balance_usd', label: 'الرصيد ($)', type: 'money' },
  { key: 'debit_iqd', label: 'مدين (د.ع)', type: 'money' },
  { key: 'credit_iqd', label: 'دائن (د.ع)', type: 'money' },
  { key: 'balance_iqd', label: 'الرصيد (د.ع)', type: 'money' },
  { key: 'transaction_count', label: 'المعاملات', type: 'number' },
];

export const REPORTS_FIELDS = [
  { key: 'trans_date', label: 'التاريخ', type: 'date' },
  { key: 'ref_no', label: 'المرجع', type: 'text' },
  { key: 'account_name', label: 'التاجر', type: 'text' },
  { key: 'good_type', label: 'البضاعة', type: 'text' },
  { key: 'weight', label: 'الوزن', type: 'number' },
  { key: 'cost_usd', label: 'التكلفة ($)', type: 'money' },
  { key: 'amount_usd', label: 'المبلغ ($)', type: 'money' },
  { key: 'profit_usd', label: 'الربح ($)', type: 'money' },
  { key: 'notes', label: 'ملاحظات', type: 'text' },
];

export const PAYMENT_MATCHING_FIELDS = [
  { key: 'account_name', label: 'الحساب', type: 'text' },
  { key: 'unpaid_count', label: 'غير مسدد', type: 'number' },
  { key: 'remaining_usd', label: 'المتبقي ($)', type: 'money' },
  { key: 'remaining_iqd', label: 'المتبقي (د.ع)', type: 'money' },
  { key: 'trans_date', label: 'التاريخ', type: 'date' },
  { key: 'ref_no', label: 'المرجع', type: 'text' },
  { key: 'amount_usd', label: 'المبلغ ($)', type: 'money' },
  { key: 'amount_iqd', label: 'المبلغ (د.ع)', type: 'money' },
  { key: 'paid_usd', label: 'المسدد ($)', type: 'money' },
  { key: 'payment_status', label: 'حالة التسديد', type: 'text' },
];

export const SECTION_FIELDS_MAP = {
  debts: DEBT_FIELDS,
  'special-haider': SPECIAL_HAIDER_FIELDS,
  'special-partner': SPECIAL_PARTNER_FIELDS,
  'fx-1': FX_FIELDS,
  reports: REPORTS_FIELDS,
  'trial-balance': TRIAL_BALANCE_FIELDS,
  'payment-matching': PAYMENT_MATCHING_FIELDS,
};

export const FIELD_MANAGEMENT_SECTIONS = [
  { key: 'port-1', label: 'السعودية', group: 'المنافذ' },
  { key: 'port-2', label: 'المنذرية', group: 'المنافذ' },
  { key: 'port-3', label: 'القائم', group: 'المنافذ' },
  { key: 'transport-1', label: 'النقل', group: 'النقل والشراكة' },
  { key: 'partnership-1', label: 'الشراكة', group: 'النقل والشراكة' },
  { key: 'debts', label: 'الديون', group: 'الإدارة' },
  { key: 'special-haider', label: 'حيدر شركة الأنوار', group: 'حسابات خاصة' },
  { key: 'special-partner', label: 'ياسر عادل', group: 'حسابات خاصة' },
  { key: 'fx-1', label: 'الصيرفة', group: 'الإدارة' },
  { key: 'reports', label: 'التقارير', group: 'الإدارة' },
  { key: 'trial-balance', label: 'ميزان المراجعة', group: 'الإدارة' },
  { key: 'payment-matching', label: 'ربط التسديد', group: 'الإدارة' },
];

export const TARGET_SCREEN_META = {
  list: { icon: ClipboardList, description: 'إعدادات القائمة وكشف الحركة' },
  statement: { icon: ClipboardList, description: 'إعدادات شاشة كشف الحساب والجداول' },
  invoice: { icon: FileText, description: 'إعدادات نموذج إضافة الفاتورة' },
  payment: { icon: CreditCard, description: 'إعدادات نموذج سند القبض' },
  default: { icon: Columns3, description: 'إعدادات الشاشة العامة لهذا القسم' },
};

export const FIELD_TYPES = [
  { value: 'text', label: 'نص' },
  { value: 'number', label: 'رقم' },
  { value: 'money', label: 'مبلغ مالي' },
  { value: 'date', label: 'تاريخ' },
  { value: 'select', label: 'قائمة اختيار' },
  { value: 'formula', label: 'عملية حسابية' },
];

export const OPERATORS = [
  { value: '+', label: '+', title: 'جمع' },
  { value: '-', label: '−', title: 'طرح' },
  { value: '*', label: '×', title: 'ضرب' },
  { value: '/', label: '÷', title: 'قسمة' },
];

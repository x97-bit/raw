export const ENTITY_OPTIONS = [
  { value: '', label: 'كل الكيانات' },
  { value: 'transaction', label: 'المعاملات' },
  { value: 'debt', label: 'الديون' },
  { value: 'expense', label: 'المصاريف' },
  { value: 'special_account', label: 'الحسابات الخاصة' },
  { value: 'field_config', label: 'إعدادات الحقول' },
  { value: 'custom_field', label: 'الحقول المخصصة' },
  { value: 'custom_field_values', label: 'قيم الحقول المخصصة' },
];

export const ACTION_OPTIONS = [
  { value: '', label: 'كل العمليات' },
  { value: 'create', label: 'إضافة' },
  { value: 'update', label: 'تعديل' },
  { value: 'delete', label: 'حذف' },
];

export function getAuditActionLabel(value) {
  return ACTION_OPTIONS.find((entry) => entry.value === value)?.label || value || '-';
}

export function getAuditEntityLabel(value) {
  return ENTITY_OPTIONS.find((entry) => entry.value === value)?.label || value || '-';
}

export function getAuditActionBadgeClass(value) {
  if (value === 'create') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (value === 'delete') {
    return 'bg-red-50 text-red-700';
  }

  return 'bg-amber-50 text-amber-700';
}

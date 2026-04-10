import { Shield, ShieldAlert } from 'lucide-react';

export const USER_ROLE_CONFIG = {
  admin: {
    label: 'مدير النظام',
    color: 'bg-red-50 text-red-700',
    icon: ShieldAlert,
    description: 'صلاحيات كاملة - جميع الأقسام والعمليات',
  },
  user: {
    label: 'مستخدم',
    color: 'bg-emerald-50 text-emerald-700',
    icon: Shield,
    description: 'صلاحيات محددة حسب الاختيار',
  },
};

export const USER_SECTION_PERMISSIONS = [
  { key: 'port-1', label: 'السعودية' },
  { key: 'port-2', label: 'المنذرية' },
  { key: 'port-3', label: 'القائم' },
  { key: 'transport', label: 'النقل' },
  { key: 'partnership', label: 'شراكة' },
  { key: 'fx', label: 'الصيرفة' },
  { key: 'debts', label: 'ديون' },
  { key: 'special', label: 'حسابات خاصة' },
  { key: 'reports', label: 'التقارير' },
];

export const USER_ACTION_PERMISSIONS = [
  { key: 'add_invoice', label: 'إضافة فاتورة' },
  { key: 'add_payment', label: 'إضافة سند قبض' },
  { key: 'edit_transaction', label: 'تعديل المعاملات' },
  { key: 'delete_transaction', label: 'حذف المعاملات' },
  { key: 'export', label: 'تصدير PDF / Excel' },
  { key: 'add_trader', label: 'إضافة تاجر جديد' },
  { key: 'manage_debts', label: 'إدارة الديون' },
];

export const ALL_USER_PERMISSION_KEYS = [
  ...USER_SECTION_PERMISSIONS,
  ...USER_ACTION_PERMISSIONS,
].map(({ key }) => key);

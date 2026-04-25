import {
  ArchiveRestore,
  BarChart3,
  Building2,
  ClipboardList,
  CreditCard,
  Database,
  FileClock,
  FileText,
  Globe,
  Handshake,
  Landmark,
  Link2,
  MapPin,
  Receipt,
  Scale,
  Settings2,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

export const sectionConfig = {
  "port-1": {
    title: "منفذ السعودية",
    portId: "port-1",
    type: "port",
    accent: "#648ea9",
    actions: ["invoice", "debit", "payment", "statement"],
  },
  "port-2": {
    title: "منفذ المنذرية",
    portId: "port-2",
    type: "port",
    accent: "#5f8d95",
    actions: ["invoice", "debit", "payment", "statement"],
  },
  "port-3": {
    title: "منفذ القائم",
    portId: "port-3",
    type: "port",
    accent: "#7087a6",
    actions: ["invoice", "debit", "payment", "statement"],
  },
  transport: {
    title: "النقل",
    portId: "transport-1",
    accountType: 2,
    type: "transport",
    accent: "#7c6f63",
    actions: ["payment", "invoice", "statement", "traders"],
    actionOverrides: {
      payment: {
        label: "سند دفع",
        desc: "تسجيل سند دفع مسدد للناقل",
      },
      invoice: {
        label: "استحقاق نقل",
        desc: "تسجيل مبلغ مستحق لصالح الناقل",
      },
      statement: {
        label: "كشف ذمة النقل",
        desc: "عرض المبالغ المترتبة علينا للناقلين",
      },
    },
  },
  partnership: {
    title: "الشراكة",
    portId: "partnership-1",
    accountType: 5,
    type: "partnership",
    accent: "#4f7d74",
    actions: ["invoice", "payment", "statement", "traders"],
  },
  fx: {
    title: "الصيرفة",
    portId: "fx-1",
    accountType: 3,
    type: "fx",
    accent: "#6679a6",
    actions: ["invoice", "traders", "statement"],
  },
};

export const sectionActionConfig = {
  invoice: {
    label: "فاتورة",
    desc: "تسجيل فاتورة جديدة",
    icon: FileText,
    accent: "#648ea9",
    bg: "rgba(100,142,169,0.16)",
  },
  debit: {
    label: "سند إضافة",
    desc: "تحميل مبلغ جديد على ذمة التاجر",
    icon: Receipt,
    accent: "#d6b36b",
    bg: "rgba(214,179,107,0.16)",
  },
  payment: {
    label: "سند قبض",
    desc: "تسجيل سند قبض جديد",
    icon: CreditCard,
    accent: "#4f7d74",
    bg: "rgba(79,125,116,0.16)",
  },
  statement: {
    label: "كشف حساب",
    desc: "عرض كشف الحساب",
    icon: ClipboardList,
    accent: "#7c6f63",
    bg: "rgba(124,111,99,0.16)",
  },
  traders: {
    label: "التجار",
    desc: "إدارة قائمة التجار",
    icon: Users,
    accent: "#7087a6",
    bg: "rgba(112,135,166,0.16)",
  },
};

const mainSectionGroups = [
  {
    title: "المنافذ",
    subtitle: "الوصول السريع إلى المنافذ الرئيسية",
    accent: "#648ea9",
    items: [
      {
        id: "port-1",
        perm: "port-1",
        label: "السعودية",
        icon: Globe,
        iconLines: ["السعودية"],
        accent: "#648ea9",
        bg: "rgba(100,142,169,0.16)",
      },
      {
        id: "port-2",
        perm: "port-2",
        label: "المنذرية",
        icon: MapPin,
        iconLines: ["المنذرية"],
        accent: "#5f8d95",
        bg: "rgba(95,141,149,0.16)",
      },
      {
        id: "port-3",
        perm: "port-3",
        label: "القائم",
        icon: Building2,
        iconLines: ["القائم"],
        accent: "#7087a6",
        bg: "rgba(112,135,166,0.16)",
      },
    ],
  },
  {
    title: "النقل والشراكة",
    subtitle: "العمليات اللوجستية والشراكات",
    accent: "#7c6f63",
    items: [
      {
        id: "transport",
        perm: "transport",
        label: "النقل",
        icon: Truck,
        accent: "#7c6f63",
        bg: "rgba(124,111,99,0.16)",
      },
      {
        id: "partnership",
        perm: "partnership",
        label: "الشراكة",
        icon: Handshake,
        accent: "#4f7d74",
        bg: "rgba(79,125,116,0.16)",
      },
    ],
  },
  {
    title: "الحسابات",
    subtitle: "الديون والمصاريف والحسابات الخاصة",
    accent: "#7b8796",
    items: [
      {
        id: "debts",
        perm: "debts",
        label: "الديون",
        icon: CreditCard,
        accent: "#8a6e79",
        bg: "rgba(138,110,121,0.16)",
      },
      {
        id: "expenses",
        perm: "debts",
        label: "المصاريف",
        icon: Receipt,
        accent: "#8b735d",
        bg: "rgba(139,115,93,0.16)",
      },
      {
        id: "special",
        perm: "special",
        label: "حسابات خاصة",
        icon: Wallet,
        accent: "#4f7d74",
        bg: "rgba(79,125,116,0.16)",
      },
      {
        id: "fx",
        perm: "fx",
        label: "الصيرفة",
        icon: Landmark,
        accent: "#6679a6",
        bg: "rgba(102,121,166,0.16)",
      },
      {
        id: "payment-matching",
        perm: "reports",
        label: "ربط التسديد",
        icon: Link2,
        accent: "#6f7a96",
        bg: "rgba(111,122,150,0.16)",
      },
    ],
  },
  {
    title: "التقارير والمراجعة",
    subtitle: "التقارير ولوحات المطابقة والمراجعة",
    accent: "#7087a6",
    items: [
      {
        id: "reports",
        perm: "reports",
        label: "التقارير",
        icon: BarChart3,
        accent: "#7087a6",
        bg: "rgba(112,135,166,0.16)",
      },
      {
        id: "trial-balance",
        perm: "reports",
        label: "ميزان المراجعة",
        icon: Scale,
        accent: "#648ea9",
        bg: "rgba(100,142,169,0.16)",
      },
    ],
  },
];

const adminSectionGroup = {
  title: "إدارة النظام",
  subtitle: "المستخدمون والحقول والافتراضيات",
  accent: "#5b7288",
  items: [
    {
      id: "users",
      label: "المستخدمون",
      icon: Users,
      accent: "#667789",
      bg: "rgba(102,119,137,0.16)",
    },
    {
      id: "field-management",
      label: "إدارة الحقول",
      icon: Settings2,
      accent: "#4f7d74",
      bg: "rgba(79,125,116,0.16)",
    },
    {
      id: "defaults-management",
      label: "إدارة الافتراضيات",
      icon: Database,
      accent: "#648ea9",
      bg: "rgba(100,142,169,0.16)",
    },
    {
      id: "backups",
      label: "النسخ الاحتياطي",
      icon: ArchiveRestore,
      accent: "#7c6f63",
      bg: "rgba(124,111,99,0.16)",
    },
    {
      id: "audit-logs",
      label: "سجل العمليات",
      icon: FileClock,
      accent: "#7b8397",
      bg: "rgba(123,131,151,0.16)",
    },
  ],
};

export function getVisibleMainSectionGroups(hasPerm, canManageUsers) {
  const visibleGroups = mainSectionGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => hasPerm(item.perm)),
    }))
    .filter(group => group.items.length > 0);

  if (canManageUsers) {
    visibleGroups.push(adminSectionGroup);
  }

  return visibleGroups;
}

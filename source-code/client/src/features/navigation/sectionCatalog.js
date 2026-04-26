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
    accent: "#38bdf8",
    actions: ["invoice", "debit", "payment", "statement"],
  },
  "port-2": {
    title: "منفذ المنذرية",
    portId: "port-2",
    type: "port",
    accent: "#f472b6",
    actions: ["invoice", "debit", "payment", "statement"],
  },
  "port-3": {
    title: "منفذ القائم",
    portId: "port-3",
    type: "port",
    accent: "#a78bfa",
    actions: ["invoice", "debit", "payment", "statement"],
  },
  transport: {
    title: "النقل",
    portId: "transport-1",
    accountType: 2,
    type: "transport",
    accent: "#fbbf24",
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
    accent: "#c084fc",
    actions: ["invoice", "payment", "statement", "traders"],
  },
  fx: {
    title: "الصيرفة",
    portId: "fx-1",
    accountType: 3,
    type: "fx",
    accent: "#2dd4bf",
    actions: ["invoice", "traders", "statement"],
  },
};

export const sectionActionConfig = {
  invoice: {
    label: "فاتورة",
    desc: "تسجيل فاتورة جديدة",
    icon: FileText,
    accent: "#38bdf8",
    bg: "rgba(56,189,248,0.16)",
  },
  debit: {
    label: "سند إضافة",
    desc: "تحميل مبلغ جديد على ذمة التاجر",
    icon: Receipt,
    accent: "#fbbf24",
    bg: "rgba(251,191,36,0.16)",
  },
  payment: {
    label: "سند قبض",
    desc: "تسجيل سند قبض جديد",
    icon: CreditCard,
    accent: "#34d399",
    bg: "rgba(52,211,153,0.16)",
  },
  statement: {
    label: "كشف حساب",
    desc: "عرض كشف الحساب",
    icon: ClipboardList,
    accent: "#a78bfa",
    bg: "rgba(167,139,250,0.16)",
  },
  traders: {
    label: "التجار",
    desc: "إدارة قائمة التجار",
    icon: Users,
    accent: "#f472b6",
    bg: "rgba(244,114,182,0.16)",
  },
};

const mainSectionGroups = [
  {
    title: "المنافذ",
    subtitle: "الوصول السريع إلى المنافذ الرئيسية",
    accent: "#38bdf8",
    items: [
      {
        id: "port-1",
        perm: "port-1",
        label: "السعودية",
        icon: Globe,
        iconLines: ["السعودية"],
        accent: "#38bdf8",
        bg: "rgba(56,189,248,0.16)",
      },
      {
        id: "port-2",
        perm: "port-2",
        label: "المنذرية",
        icon: MapPin,
        iconLines: ["المنذرية"],
        accent: "#f472b6",
        bg: "rgba(244,114,182,0.16)",
      },
      {
        id: "port-3",
        perm: "port-3",
        label: "القائم",
        icon: Building2,
        iconLines: ["القائم"],
        accent: "#a78bfa",
        bg: "rgba(167,139,250,0.16)",
      },
    ],
  },
  {
    title: "النقل والحسابات الخاصة",
    subtitle: "العمليات اللوجستية والحسابات المرتبطة",
    accent: "#fbbf24",
    items: [
      {
        id: "transport",
        perm: "transport",
        label: "النقل",
        icon: Truck,
        accent: "#fbbf24",
        bg: "rgba(251,191,36,0.16)",
      },
      {
        id: "special",
        perm: "special",
        label: "حسابات خاصة",
        icon: Wallet,
        accent: "#34d399",
        bg: "rgba(52,211,153,0.16)",
      },
    ],
  },
  {
    title: "الحسابات",
    subtitle: "الديون والمصاريف والشراكة والصيرفة",
    accent: "#fb7185",
    items: [
      {
        id: "debts",
        perm: "debts",
        label: "الديون",
        icon: CreditCard,
        accent: "#fb7185",
        bg: "rgba(251,113,133,0.16)",
      },
      {
        id: "expenses",
        perm: "debts",
        label: "المصاريف",
        icon: Receipt,
        accent: "#f97316",
        bg: "rgba(249,115,22,0.16)",
      },
      {
        id: "partnership",
        perm: "partnership",
        label: "الشراكة",
        icon: Handshake,
        accent: "#c084fc",
        bg: "rgba(192,132,252,0.16)",
      },
      {
        id: "fx",
        perm: "fx",
        label: "الصيرفة",
        icon: Landmark,
        accent: "#2dd4bf",
        bg: "rgba(45,212,191,0.16)",
      },
      {
        id: "payment-matching",
        perm: "reports",
        label: "ربط التسديد",
        icon: Link2,
        accent: "#818cf8",
        bg: "rgba(129,140,248,0.16)",
      },
    ],
  },
  {
    title: "التقارير والمراجعة",
    subtitle: "التقارير ولوحات المطابقة والمراجعة",
    accent: "#a78bfa",
    items: [
      {
        id: "reports",
        perm: "reports",
        label: "التقارير",
        icon: BarChart3,
        accent: "#38bdf8",
        bg: "rgba(56,189,248,0.16)",
      },
      {
        id: "trial-balance",
        perm: "reports",
        label: "ميزان المراجعة",
        icon: Scale,
        accent: "#fcd34d",
        bg: "rgba(252,211,77,0.16)",
      },
    ],
  },
];

const adminSectionGroup = {
  title: "إدارة النظام",
  subtitle: "المستخدمون والحقول والافتراضيات",
  accent: "#60a5fa",
  items: [
    {
      id: "users",
      label: "المستخدمون",
      icon: Users,
      accent: "#60a5fa",
      bg: "rgba(96,165,250,0.16)",
    },
    {
      id: "field-management",
      label: "إدارة الحقول",
      icon: Settings2,
      accent: "#a3e635",
      bg: "rgba(163,230,53,0.16)",
    },
    {
      id: "defaults-management",
      label: "إدارة الافتراضيات",
      icon: Database,
      accent: "#f472b6",
      bg: "rgba(244,114,182,0.16)",
    },
    {
      id: "backups",
      label: "النسخ الاحتياطي",
      icon: ArchiveRestore,
      accent: "#94a3b8",
      bg: "rgba(148,163,184,0.16)",
    },
    {
      id: "audit-logs",
      label: "سجل العمليات",
      icon: FileClock,
      accent: "#fbbf24",
      bg: "rgba(251,191,36,0.16)",
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

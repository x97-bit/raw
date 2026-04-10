import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'database', 'import-templates');
const WORKBOOK_PATH = path.join(OUTPUT_DIR, 'alrawi-system-import-templates.xlsx');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'template-manifest.json');

const TEMPLATE_DEFS = [
  {
    key: 'transactions_unified',
    sheetName: 'الحركات الموحدة',
    target: 'transactions',
    purpose: 'القالب الرسمي الموحد لكل الحركات التشغيلية في النظام.',
    required: ['القسم', 'التاريخ', 'نوع الحركة', 'اسم الحساب'],
    columns: [
      'القسم',
      'التاريخ',
      'رقم الوثيقة',
      'نوع الحركة',
      'العملة',
      'اسم الحساب',
      'اسم السائق',
      'رقم السيارة',
      'نوع البضاعة',
      'الوزن',
      'الأمتار',
      'العدد',
      'عدد السيارات',
      'التكلفة دولار',
      'المبلغ دولار',
      'التكلفة دينار',
      'المبلغ دينار',
      'النقل السعودي دولار',
      'نقل عراقي (دينار)',
      'الكمرك السوري',
      'المحافظة',
      'الناقل',
      'اسم الشركة',
      'ملاحظة التاجر',
      'ملاحظات',
    ],
    widths: [16, 14, 18, 14, 12, 26, 24, 22, 24, 14, 14, 12, 14, 16, 16, 16, 16, 18, 20, 16, 18, 24, 22, 24, 24],
  },
  {
    key: 'port_1',
    sheetName: 'السعودية - حركات',
    target: 'transactions:port-1',
    purpose: 'فواتير وتسديدات منفذ السعودية.',
    required: ['التاريخ', 'نوع الحركة', 'اسم التاجر'],
    columns: [
      'التاريخ',
      'رقم الوثيقة',
      'نوع الحركة',
      'العملة',
      'اسم التاجر',
      'اسم السائق',
      'رقم السيارة',
      'نوع البضاعة',
      'الوزن',
      'الأمتار',
      'التكلفة دولار',
      'المبلغ دولار',
      'التكلفة دينار',
      'المبلغ دينار',
      'النقل السعودي دولار',
      'نقل عراقي (دينار)',
      'المحافظة',
      'التخليص',
      'ملاحظة التاجر',
      'ملاحظات',
    ],
    widths: [14, 18, 14, 12, 24, 24, 22, 24, 14, 14, 16, 16, 16, 16, 18, 20, 18, 16, 22, 24],
  },
  {
    key: 'port_2',
    sheetName: 'المنذرية - حركات',
    target: 'transactions:port-2',
    purpose: 'فواتير وتسديدات منفذ المنذرية.',
    required: ['التاريخ', 'نوع الحركة', 'اسم التاجر'],
    columns: [
      'التاريخ',
      'رقم الوثيقة',
      'نوع الحركة',
      'العملة',
      'اسم التاجر',
      'اسم السائق',
      'رقم السيارة',
      'نوع البضاعة',
      'الوزن',
      'التكلفة دولار',
      'المبلغ دولار',
      'التكلفة دينار',
      'المبلغ دينار',
      'الكمرك السوري',
      'ملاحظة التاجر',
      'ملاحظات',
    ],
    widths: [14, 18, 14, 12, 24, 24, 22, 24, 14, 16, 16, 16, 16, 18, 22, 24],
  },
  {
    key: 'port_3',
    sheetName: 'القائم - حركات',
    target: 'transactions:port-3',
    purpose: 'فواتير وتسديدات منفذ القائم.',
    required: ['التاريخ', 'نوع الحركة', 'اسم التاجر'],
    columns: [
      'التاريخ',
      'رقم الوثيقة',
      'نوع الحركة',
      'العملة',
      'اسم التاجر',
      'اسم السائق',
      'رقم السيارة',
      'نوع البضاعة',
      'الوزن',
      'العدد',
      'التكلفة دولار',
      'المبلغ دولار',
      'التكلفة دينار',
      'المبلغ دينار',
      'اسم الشركة',
      'ملاحظة التاجر',
      'ملاحظات',
    ],
    widths: [14, 18, 14, 12, 24, 24, 22, 24, 14, 12, 16, 16, 16, 16, 22, 22, 24],
  },
  {
    key: 'transport_1',
    sheetName: 'النقل الداخلي',
    target: 'transactions:transport-1',
    purpose: 'فواتير وتسديدات النقل الداخلي.',
    required: ['التاريخ', 'نوع الحركة', 'اسم الناقل'],
    columns: [
      'التاريخ',
      'رقم الوثيقة',
      'نوع الحركة',
      'العملة',
      'اسم الناقل',
      'اسم التاجر',
      'نوع الحمل',
      'المبلغ دولار',
      'المبلغ دينار',
      'عدد السيارات',
      'المحافظة',
      'سعر النقل',
      'ملاحظات',
    ],
    widths: [14, 18, 14, 12, 24, 24, 22, 16, 16, 14, 18, 16, 24],
  },
  {
    key: 'debts_basim',
    sheetName: 'ديون - باسم الجميلي',
    target: 'debts',
    purpose: 'قالب ديون باسم الجميلي.',
    required: ['اسم المدين', 'التاريخ'],
    columns: [
      'اسم المدين',
      'التاريخ',
      'المبلغ دولار',
      'رسوم دولار',
      'المبلغ دينار',
      'رسوم دينار',
      'نوع الحركة',
      'سعر الصرف',
      'الحالة',
      'ملاحظات',
    ],
    widths: [24, 14, 16, 16, 16, 16, 16, 14, 14, 26],
  },
  {
    key: 'debts_haider',
    sheetName: 'ديون - حيدر (أنابيب)',
    target: 'debts',
    purpose: 'قالب ديون حيدر/الأنابيب.',
    required: ['اسم المدين', 'التاريخ'],
    columns: [
      'اسم المدين',
      'التاريخ',
      'اسم السائق',
      'رقم السيارة',
      'نوع البضاعة',
      'الوزن',
      'الأمتار',
      'المبلغ دولار',
      'المبلغ دينار',
      'التكلفة دولار',
      'ملاحظات',
    ],
    widths: [24, 14, 24, 22, 22, 14, 14, 16, 16, 16, 26],
  },
  {
    key: 'debts_luay',
    sheetName: 'ديون - لؤي',
    target: 'debts',
    purpose: 'قالب ديون لؤي.',
    required: ['اسم المدين', 'التاريخ'],
    columns: [
      'اسم المدين',
      'التاريخ',
      'المبلغ دولار',
      'المبلغ دينار',
      'نوع الحركة',
      'سعر الصرف',
      'ملاحظة الصيرفة',
      'ملاحظات',
    ],
    widths: [24, 14, 16, 16, 16, 14, 18, 26],
  },
  {
    key: 'debts_noman',
    sheetName: 'ديون - نومان (صيرفة)',
    target: 'debts',
    purpose: 'قالب ديون نومان/الصيرفة.',
    required: ['اسم المدين', 'التاريخ'],
    columns: [
      'اسم المدين',
      'التاريخ',
      'المبلغ دولار',
      'رسوم دولار',
      'المبلغ دينار',
      'رسوم دينار',
      'نوع الحركة',
      'سعر الصرف',
      'الحالة',
      'ملاحظات',
    ],
    widths: [24, 14, 16, 16, 16, 16, 16, 14, 14, 26],
  },
  {
    key: 'special_haider',
    sheetName: 'خاص - حيدر شركة الأنوار',
    target: 'special_accounts:haider',
    purpose: 'قالب الحسابات الخاصة لحيدر شركة الأنوار.',
    required: ['التاريخ'],
    columns: [
      'التاريخ',
      'الوجهة',
      'اسم السائق',
      'رقم السيارة',
      'نوع البضاعة',
      'الوزن',
      'الأمتار',
      'التكلفة دولار',
      'المبلغ دولار',
      'التكلفة دينار',
      'المبلغ دينار',
      'الفرق دينار',
      'الوجبة',
      'ملاحظات',
    ],
    widths: [14, 18, 24, 22, 24, 14, 14, 16, 16, 16, 16, 16, 18, 26],
  },
  {
    key: 'special_yaser',
    sheetName: 'خاص - ياسر عادل',
    target: 'special_accounts:partnership',
    purpose: 'قالب الحسابات الخاصة لياسر عادل.',
    required: ['التاريخ'],
    columns: [
      'التاريخ',
      'اسم التاجر',
      'اسم السائق',
      'رقم السيارة',
      'نوع البضاعة',
      'العدد',
      'المنفذ',
      'الشركة',
      'المبلغ عليه دولار',
      'المبلغ له دولار',
      'الفرق دينار',
      'التخليص',
      'TX',
      'تكسي + ماء',
      'ملاحظات',
    ],
    widths: [14, 24, 24, 22, 24, 12, 18, 22, 18, 18, 16, 14, 12, 14, 26],
  },
  {
    key: 'governorates',
    sheetName: 'جدول المحافظات',
    target: 'route_defaults/governorates',
    purpose: 'أجور النقل للمحافظات، تستخدم كـ route defaults.',
    required: ['المحافظة'],
    columns: [
      'المحافظة',
      'أجر النقل (دينار)',
      'ملاحظات',
    ],
    widths: [22, 18, 26],
  },
];

const README_ROWS = [
  ['نظام الراوي - قوالب الاستيراد الرسمية'],
  [''],
  ['هذه القوالب فارغة ومطابقة لبنية النظام الحالية.'],
  ['املأ البيانات داخل نفس الأعمدة فقط، ولا تغيّر أسماء الشيتات أو أسماء الأعمدة.'],
  [''],
  ['القيم القياسية الموصى بها'],
  ['العملة', 'USD أو IQD أو BOTH'],
  ['نوع الحركة', 'فاتورة أو سند'],
  ['القسم في الحركات الموحدة', 'port-1 أو port-2 أو port-3 أو transport-1'],
  ['التاريخ', 'YYYY-MM-DD'],
  [''],
  ['الشيت', 'الهدف', 'الأعمدة المطلوبة'],
  ...TEMPLATE_DEFS.map((template) => [
    template.sheetName,
    template.target,
    template.required.join('، '),
  ]),
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function makeSheet(rows, widths = []) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  if (widths.length > 0) {
    ws['!cols'] = widths.map((wch) => ({ wch }));
  }
  if (rows.length > 0 && rows[0].length > 0) {
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: 0, c: rows[0].length - 1 },
      }),
    };
  }
  return ws;
}

function writeCsvTemplate(template) {
  const csvPath = path.join(OUTPUT_DIR, `${template.key}.csv`);
  const csv = `${template.columns.join(',')}\n`;
  fs.writeFileSync(csvPath, '﻿' + csv, 'utf8');
}

function main() {
  ensureDir(OUTPUT_DIR);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, makeSheet(README_ROWS, [26, 32, 34]), 'README');

  for (const template of TEMPLATE_DEFS) {
    const sheet = makeSheet([template.columns], template.widths);
    XLSX.utils.book_append_sheet(workbook, sheet, template.sheetName);
    writeCsvTemplate(template);
  }

  XLSX.writeFile(workbook, WORKBOOK_PATH);

  const manifest = {
    generatedAt: new Date().toISOString(),
    workbookPath: WORKBOOK_PATH,
    sheets: TEMPLATE_DEFS.map((template) => ({
      key: template.key,
      sheetName: template.sheetName,
      target: template.target,
      purpose: template.purpose,
      required: template.required,
      columns: template.columns,
    })),
  };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`Templates workbook generated at: ${WORKBOOK_PATH}`);
  console.log(`Manifest generated at: ${MANIFEST_PATH}`);
  console.log(`CSV templates generated in: ${OUTPUT_DIR}`);
}

main();

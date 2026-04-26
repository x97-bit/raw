import fs from 'fs';
import path from 'path';

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const colorMap = {
  "port-1": "#38bdf8",
  "port-2": "#f472b6",
  "port-3": "#a78bfa",
  "transport": "#fbbf24",
  "special": "#34d399",
  "partnership": "#c084fc",
  "debts": "#fb7185",
  "expenses": "#f97316",
  "fx": "#2dd4bf",
  "payment-matching": "#818cf8",
  "reports": "#38bdf8",
  "trial-balance": "#fcd34d",
  "users": "#60a5fa",
  "field-management": "#a3e635",
  "defaults-management": "#f472b6",
  "backups": "#94a3b8",
  "audit-logs": "#fbbf24",
  
  // Section action configs
  "invoice": "#38bdf8",
  "debit": "#fbbf24",
  "payment": "#34d399",
  "statement": "#a78bfa",
  "traders": "#f472b6",
};

// Group colors
const groupColorMap = {
  "المنافذ": "#38bdf8",
  "النقل والحسابات الخاصة": "#fbbf24",
  "الحسابات": "#fb7185",
  "التقارير والمراجعة": "#a78bfa",
  "إدارة النظام": "#60a5fa",
};

const filePath = path.join(process.cwd(), 'client', 'src', 'features', 'navigation', 'sectionCatalog.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace item colors
for (const [key, hex] of Object.entries(colorMap)) {
  const rgba = hexToRgba(hex, 0.16);
  const regex1 = new RegExp(`(portId:\\s*"${key}"[\\s\\S]*?accent:\\s*)"#[0-9a-fA-F]{6}"`, 'g');
  content = content.replace(regex1, `$1"${hex}"`);
  
  const regex2 = new RegExp(`(type:\\s*"${key}"[\\s\\S]*?accent:\\s*)"#[0-9a-fA-F]{6}"`, 'g');
  content = content.replace(regex2, `$1"${hex}"`);
  
  const regex3 = new RegExp(`("${key}":\\s*{[\\s\\S]*?accent:\\s*)"#[0-9a-fA-F]{6}"`, 'g');
  content = content.replace(regex3, `$1"${hex}"`);
  
  const regex4 = new RegExp(`(id:\\s*"${key}"[\\s\\S]*?accent:\\s*)"#[0-9a-fA-F]{6}"`, 'g');
  content = content.replace(regex4, `$1"${hex}"`);
  
  const regex5 = new RegExp(`("${key}":\\s*{[\\s\\S]*?bg:\\s*)"rgba\\([\\d,.]+\\)"`, 'g');
  content = content.replace(regex5, `$1"${rgba}"`);
  
  const regex6 = new RegExp(`(id:\\s*"${key}"[\\s\\S]*?bg:\\s*)"rgba\\([\\d,.]+\\)"`, 'g');
  content = content.replace(regex6, `$1"${rgba}"`);
}

// Replace group colors
for (const [title, hex] of Object.entries(groupColorMap)) {
  const regex = new RegExp(`(title:\\s*"${title}"[\\s\\S]*?accent:\\s*)"#[0-9a-fA-F]{6}"`, 'g');
  content = content.replace(regex, `$1"${hex}"`);
}

fs.writeFileSync(filePath, content);
console.log("Colors updated.");

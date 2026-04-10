import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getCurrencyLabel } from './currencyLabels';

function resolveColumnValue(row, column) {
  if (typeof column?.getValue === 'function') {
    return column.getValue(row);
  }

  return row?.[column?.key];
}

function sanitizeSheetTitle(title) {
  const normalized = String(title || 'Sheet1')
    .replace(/[\\/*?:[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (normalized || 'Sheet1').slice(0, 31);
}

function computeColumnWidth(column, values = []) {
  const key = String(column?.key || '').toLowerCase();
  const maxLength = values.reduce((longest, value) => Math.max(longest, String(value ?? '').length), String(column?.label || '').length);
  const preferredWidth = Math.ceil(maxLength * 1.2) + 2;

  let minimumWidth = 14;
  if (key.includes('note')) minimumWidth = 26;
  else if (key.includes('account') || key.includes('driver') || key.includes('vehicle') || key.includes('good') || key.includes('company')) minimumWidth = 18;
  else if (key.includes('amount') || key.includes('cost') || key.includes('fee') || key.includes('price')) minimumWidth = 16;
  else if (key.includes('date')) minimumWidth = 15;

  return Math.min(40, Math.max(column?.width || 0, minimumWidth, preferredWidth));
}

export function exportToExcel(rows, columns, filename, sheetTitle) {
  const headers = columns.map((column) => column.label);
  const data = rows.map((row) =>
    columns.map((column) => {
      let value = resolveColumnValue(row, column);

      if (column.format === 'currency' && value) value = getCurrencyLabel(value);
      if (column.format === 'number' && value !== undefined && value !== null && value !== '') value = Number(value);
      if (column.format === 'date' && value) value = String(value).split(' ')[0];
      if ((column.format === 'money' || column.format === 'money_iqd') && value !== undefined && value !== null && value !== '') value = Number(value);

      return value ?? '';
    }),
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  worksheet['!cols'] = columns.map((column, index) => ({
    wch: computeColumnWidth(column, data.map((row) => row[index])),
  }));
  worksheet['!sheetViews'] = [{ rightToLeft: true }];
  worksheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: data.length, c: Math.max(columns.length - 1, 0) },
    }),
  };

  const workbook = XLSX.utils.book_new();
  workbook.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetTitle(sheetTitle));

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${filename}.xlsx`);
}

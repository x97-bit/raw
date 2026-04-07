import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Format a monetary value with the correct currency symbol
 */
function formatCellValue(val, format) {
  if (val === null || val === undefined) return '-';
  if (format === 'date') return String(val).split(' ')[0];
  if (format === 'number' && val) return Number(val).toLocaleString('en-US');
  if (format === 'money' && val) return '$' + Number(val).toLocaleString('en-US');
  if (format === 'money_iqd' && val) return Number(val).toLocaleString('en-US') + ' د.ع';
  return String(val);
}

/**
 * Export data to Excel file
 */
export function exportToExcel(rows, columns, filename, sheetTitle) {
  const headers = columns.map(c => c.label);
  const data = rows.map(row =>
    columns.map(col => {
      let val = row[col.key];
      if (col.format === 'number' && val) val = Number(val);
      if (col.format === 'date' && val) val = String(val).split(' ')[0];
      if ((col.format === 'money' || col.format === 'money_iqd') && val) val = Number(val);
      return val ?? '';
    })
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws['!cols'] = columns.map(c => ({ wch: c.width || 15 }));
  ws['!sheetViews'] = [{ rightToLeft: true }];

  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle || 'Sheet1');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${filename}.xlsx`);
}

/**
 * Export data to PDF with elegant styling
 */
export function exportToPDF({ rows, columns, title, subtitle, filename, summaryCards, totalsRow, orientation = 'landscape' }) {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const today = new Date().toISOString().split('T')[0];

  // ── Elegant Header ──
  // Dark navy gradient background
  doc.setFillColor(16, 42, 67); // #102a43
  doc.rect(0, 0, pageWidth, 26, 'F');
  
  // Subtle accent line at bottom of header
  doc.setFillColor(33, 134, 235); // accent blue
  doc.rect(0, 26, pageWidth, 0.6, 'F');

  // Title (right-aligned for RTL)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(title || '', pageWidth - 12, 11, { align: 'right' });

  // Subtitle
  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(180, 200, 220);
    doc.text(subtitle, pageWidth - 12, 18, { align: 'right' });
  }

  // Date and company on left
  doc.setFontSize(7);
  doc.setTextColor(140, 160, 180);
  doc.text(today, 12, 11);
  doc.text('TAY ALRAWI', 12, 17);

  let startY = 30;

  // ── Summary Cards ──
  if (summaryCards && summaryCards.length > 0) {
    const cardsPerRow = Math.min(summaryCards.length, 4);
    const totalRows = Math.ceil(summaryCards.length / cardsPerRow);
    const cardWidth = (pageWidth - 24) / cardsPerRow;
    const cardGap = 3;

    for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
      const rowCards = summaryCards.slice(rowIdx * cardsPerRow, (rowIdx + 1) * cardsPerRow);
      rowCards.forEach((card, i) => {
        const x = pageWidth - 12 - (i + 1) * cardWidth + (i > 0 ? cardGap * i : 0);
        
        // Card background with subtle border
        doc.setFillColor(250, 251, 252);
        doc.roundedRect(x, startY, cardWidth - cardGap, 13, 1.5, 1.5, 'F');
        doc.setDrawColor(230, 234, 240);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, startY, cardWidth - cardGap, 13, 1.5, 1.5, 'S');

        // Label
        doc.setFontSize(6.5);
        doc.setTextColor(120, 135, 155);
        doc.text(card.label, x + cardWidth - cardGap - 4, startY + 4.5, { align: 'right' });

        // Value
        doc.setFontSize(10);
        doc.setTextColor(16, 42, 67);
        doc.text(String(card.value), x + cardWidth - cardGap - 4, startY + 10.5, { align: 'right' });
      });
      startY += 16;
    }
    startY += 2;
  }

  // ── Table ──
  const tableHeaders = columns.map(c => c.label);
  const tableData = rows.map(row =>
    columns.map(col => formatCellValue(row[col.key], col.format))
  );

  // Add totals row
  if (totalsRow) {
    const totalData = columns.map(col => {
      if (totalsRow[col.key] !== undefined) {
        return formatCellValue(totalsRow[col.key], col.format);
      }
      return '';
    });
    const firstEmpty = totalData.findIndex(v => v === '');
    if (firstEmpty >= 0) totalData[firstEmpty] = 'المجموع';
    tableData.push(totalData);
  }

  doc.autoTable({
    head: [tableHeaders],
    body: tableData,
    startY,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      halign: 'center',
      valign: 'middle',
      overflow: 'linebreak',
      lineColor: [230, 234, 240],
      lineWidth: 0.15,
      textColor: [50, 60, 75],
    },
    headStyles: {
      fillColor: [16, 42, 67],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
    },
    alternateRowStyles: {
      fillColor: [250, 251, 252],
    },
    didParseCell: (data) => {
      if (totalsRow && data.row.index === tableData.length - 1 && data.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 244, 248];
        data.cell.styles.textColor = [16, 42, 67];
      }
    },
    margin: { top: 10, right: 12, bottom: 16, left: 12 },
    didDrawPage: (data) => {
      // Page footer
      doc.setFillColor(250, 251, 252);
      doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
      doc.setDrawColor(230, 234, 240);
      doc.setLineWidth(0.15);
      doc.line(12, pageHeight - 10, pageWidth - 12, pageHeight - 10);
      
      doc.setFontSize(6.5);
      doc.setTextColor(160, 170, 180);
      doc.text(`صفحة ${data.pageNumber}`, pageWidth / 2, pageHeight - 4, { align: 'center' });
      doc.text('نظام الراوي', pageWidth - 12, pageHeight - 4, { align: 'right' });
    },
  });

  doc.save(`${filename}.pdf`);
}

/**
 * Generate a single transaction/invoice PDF with elegant styling
 */
export function exportInvoicePDF({ transaction, title, companyName = 'شركة طي الراوي للنقل والتخليص الكمركي' }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toISOString().split('T')[0];

  // ── Elegant Header ──
  doc.setFillColor(16, 42, 67);
  doc.rect(0, 0, pageWidth, 32, 'F');
  
  // Accent line
  doc.setFillColor(33, 134, 235);
  doc.rect(0, 32, pageWidth, 0.6, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text(companyName, pageWidth - 15, 13, { align: 'right' });

  // Transaction type
  doc.setFontSize(11);
  doc.setTextColor(180, 200, 220);
  doc.text(title || (transaction.TransTypeID === 1 ? 'فاتورة - له' : 'فاتورة - عليه'), pageWidth - 15, 22, { align: 'right' });

  // Ref and date on left
  doc.setFontSize(9);
  doc.setTextColor(140, 160, 180);
  doc.text(transaction.RefNo || '', 15, 13);
  doc.text(transaction.TransDate?.split(' ')[0] || today, 15, 22);

  let y = 42;

  // ── Info Fields ──
  const fields = [
    { label: 'التاجر / الحساب', value: transaction.AccountName || '-' },
    { label: 'المنفذ', value: transaction.PortName || '-' },
    { label: 'نوع المعاملة', value: transaction.TransTypeName || (transaction.TransTypeID === 1 ? 'له' : 'عليه') },
    { label: 'العملة', value: transaction.CurrencyName || '-' },
    { label: 'المبلغ ($)', value: transaction.AmountUSD ? `$${Number(transaction.AmountUSD).toLocaleString('en-US')}` : '-' },
    { label: 'المبلغ (د.ع)', value: transaction.AmountIQD ? `${Number(transaction.AmountIQD).toLocaleString('en-US')} د.ع` : '-' },
    { label: 'التكلفة ($)', value: transaction.CostUSD ? `$${Number(transaction.CostUSD).toLocaleString('en-US')}` : '-' },
    { label: 'التكلفة (د.ع)', value: transaction.CostIQD ? `${Number(transaction.CostIQD).toLocaleString('en-US')} د.ع` : '-' },
    { label: 'الربح ($)', value: transaction.ProfitUSD ? `$${Number(transaction.ProfitUSD).toLocaleString('en-US')}` : '-' },
    { label: 'الربح (د.ع)', value: transaction.ProfitIQD ? `${Number(transaction.ProfitIQD).toLocaleString('en-US')} د.ع` : '-' },
    { label: 'البضاعة', value: transaction.GoodTypeName || transaction.GoodType || '-' },
    { label: 'الوزن', value: transaction.Weight ? Number(transaction.Weight).toLocaleString('en-US') : '-' },
    { label: 'الكمية', value: transaction.Qty || '-' },
    { label: 'الأمتار', value: transaction.Meters || '-' },
    { label: 'السائق', value: transaction.DriverName || '-' },
    { label: 'السيارة', value: transaction.PlateNumber || '-' },
    { label: 'الجهة الحكومية', value: transaction.GovName || '-' },
    { label: 'الشركة', value: transaction.CompanyName || '-' },
  ];

  const colWidth = (pageWidth - 30) / 2;
  const rowHeight = 13;

  fields.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = pageWidth - 15 - col * colWidth;
    const currentY = y + row * rowHeight;

    // Card background
    doc.setFillColor(250, 251, 252);
    doc.roundedRect(x - colWidth + 3, currentY - 2.5, colWidth - 6, 11, 1.5, 1.5, 'F');
    doc.setDrawColor(240, 242, 245);
    doc.setLineWidth(0.15);
    doc.roundedRect(x - colWidth + 3, currentY - 2.5, colWidth - 6, 11, 1.5, 1.5, 'S');

    // Label
    doc.setFontSize(6.5);
    doc.setTextColor(120, 135, 155);
    doc.text(f.label, x - 5, currentY + 1, { align: 'right' });

    // Value
    doc.setFontSize(9);
    doc.setTextColor(16, 42, 67);
    doc.text(String(f.value), x - 5, currentY + 6.5, { align: 'right' });
  });

  y += Math.ceil(fields.length / 2) * rowHeight + 6;

  // ── Notes Section ──
  const notes = [transaction.Notes, transaction.TraderNote, transaction.CustomsNote].filter(Boolean);
  if (notes.length > 0) {
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(15, y, pageWidth - 30, 18, 2, 2, 'F');
    doc.setDrawColor(252, 211, 77);
    doc.setLineWidth(0.2);
    doc.roundedRect(15, y, pageWidth - 30, 18, 2, 2, 'S');
    
    doc.setFontSize(7);
    doc.setTextColor(180, 83, 9);
    doc.text('ملاحظات', pageWidth - 20, y + 5.5, { align: 'right' });
    
    doc.setFontSize(8.5);
    doc.setTextColor(80, 70, 50);
    doc.text(notes.join(' | '), pageWidth - 20, y + 12.5, { align: 'right', maxWidth: pageWidth - 40 });
  }

  // ── Footer ──
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(250, 251, 252);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  doc.setDrawColor(230, 234, 240);
  doc.setLineWidth(0.15);
  doc.line(15, pageHeight - 10, pageWidth - 15, pageHeight - 10);
  
  doc.setFontSize(6.5);
  doc.setTextColor(160, 170, 180);
  doc.text('نظام الراوي', pageWidth - 15, pageHeight - 4, { align: 'right' });
  doc.text(today, 15, pageHeight - 4);

  doc.save(`${transaction.RefNo || 'invoice'}.pdf`);
}

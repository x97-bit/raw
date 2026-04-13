import { getCurrencyLabel } from './currencyLabels';
import {
  formatEnglishLongDate,
  shouldUseTayAlRawiBranding,
  TAY_ALRAWI_BRAND_ASSETS,
  TAY_ALRAWI_BRAND_COLORS,
} from './exportBranding';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function resolveColumnValue(row, column) {
  if (typeof column?.getValue === 'function') {
    return column.getValue(row);
  }

  return row?.[column?.key];
}

function formatCellValue(value, format) {
  if (value === null || value === undefined || value === '') return '-';
  if (format === 'date') return String(value).split(' ')[0];
  if (format === 'currency') return getCurrencyLabel(value);
  if (format === 'number') return Number(value).toLocaleString('en-US');
  if (format === 'money') return `$${Number(value).toLocaleString('en-US')}`;
  if (format === 'money_iqd') return `${Number(value).toLocaleString('en-US')} د.ع`;
  return String(value);
}

function resolveAssetUrl(path) {
  try {
    return new URL(path, window.location.origin).href;
  } catch {
    return path;
  }
}

function openPrintWindow(title, body, extraCss = '') {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1500,height=950');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title || 'طباعة')}</title>
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #eef2f7; }
      body {
        font-family: Tahoma, "Segoe UI", Arial, sans-serif;
        direction: rtl;
        color: #17212f;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      .print-controls {
        position: sticky;
        top: 0;
        z-index: 50;
        display: flex;
        justify-content: center;
        gap: 12px;
        padding: 16px;
        background: #f5f8f8;
        border-bottom: 1px solid #d7e1e2;
        box-shadow: 0 12px 28px rgba(53,78,89,0.08);
      }
      .print-controls button {
        border: 1px solid transparent;
        border-radius: 999px;
        padding: 10px 18px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.18s ease, background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
        box-shadow: 0 10px 20px rgba(53,78,89,0.08);
      }
      .print-controls button:hover { transform: translateY(-1px); }
      .print-btn {
        background: #2f6b63;
        border-color: #2f6b63;
        color: #fff;
      }
      .print-btn:hover { background: #295d56; border-color: #295d56; }
      .close-btn {
        background: #ffffff;
        border-color: #d7e1e2;
        color: #27343d;
      }
      .close-btn:hover { background: #eef4f3; }
      @media print {
        .print-controls { display: none !important; }
        html, body { background: #fff; }
      }
      ${extraCss}
    </style>
  </head>
  <body>
    <div class="print-controls">
      <button class="print-btn" type="button" onclick="window.focus(); window.print();">طباعة</button>
      <button class="close-btn" type="button" onclick="window.close();">إغلاق</button>
    </div>
    ${body}
  </body>
</html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.focus(), 120);
}

function getGenericRowClass(row) {
  const transTypeId = Number(row?.TransTypeID || row?.transTypeId || 0);
  const direction = String(row?.Direction || row?.direction || '').toUpperCase();

  if (transTypeId === 2 || direction === 'OUT' || direction === 'CR') return 'payment-row';
  if (transTypeId === 1 || direction === 'IN' || direction === 'DR') return 'receipt-row';
  return '';
}

function getColumnCellClass(column) {
  return column?.format === 'date' ? 'tay-date-cell' : '';
}

function buildRowsHtml(rows, columns, rowClassResolver = () => '') {
  return rows.map((row) => `
    <tr class="${rowClassResolver(row)}">
      ${columns.map((column) => `<td class="${getColumnCellClass(column)}">${escapeHtml(formatCellValue(resolveColumnValue(row, column), column.format))}</td>`).join('')}
    </tr>
  `).join('');
}

function buildEmptyRowsHtml(columnCount, message = 'لا توجد بيانات للطباعة.') {
  return `
    <tr class="tay-empty-row">
      <td colspan="${Math.max(1, columnCount)}">${escapeHtml(message)}</td>
    </tr>
  `;
}

function buildTotalsHtml(columns, totalsRow) {
  if (!totalsRow) return '';

  const totalsCells = columns.map((column, index) => {
    if (index === 0) return '<td>المجموع</td>';
    if (totalsRow[column.key] !== undefined) {
      return `<td class="${getColumnCellClass(column)}">${escapeHtml(formatCellValue(totalsRow[column.key], column.format))}</td>`;
    }
    return '<td></td>';
  }).join('');

  return `<tfoot><tr>${totalsCells}</tr></tfoot>`;
}

function buildSummaryCardsHtml(summaryCards = []) {
  if (!summaryCards.length) return '';

  return `
    <div class="tay-summary-grid">
      ${summaryCards.map((card) => `
        <div class="tay-summary-card">
          <span>${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
        </div>
      `).join('')}
    </div>
  `;
}

export function buildPrintMetaHtml(metaItems = []) {
  const visibleItems = (metaItems || []).filter((item) => {
    const value = item?.value;
    return value !== null && value !== undefined && String(value).trim() !== '';
  });

  if (!visibleItems.length) return '';

  return `
    <div class="tay-meta-stack">
      ${visibleItems.map((item) => `
        <div class="tay-meta-inline">
          <span class="tay-meta-label">${escapeHtml(item.label)}:</span>
          <span class="${item.tone === 'accent' ? 'tay-meta-value-red' : ''}">${escapeHtml(item.value)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

export function normalizeTabularPrintSections({
  rows = [],
  columns = [],
  totalsRow = null,
  sections = [],
  emptyMessage = 'لا توجد بيانات للطباعة.',
} = {}) {
  const providedSections = (sections || []).filter((section) => Array.isArray(section?.columns) && section.columns.length > 0);

  if (providedSections.length > 0) {
    return providedSections.map((section, index) => ({
      key: section.key || `section-${index + 1}`,
      title: section.title || '',
      subtitle: section.subtitle || '',
      rows: Array.isArray(section.rows) ? section.rows : [],
      columns: section.columns,
      totalsRow: section.totalsRow ?? null,
      highlightRows: Boolean(section.highlightRows),
      emptyMessage: section.emptyMessage || emptyMessage,
    }));
  }

  return [{
    key: 'main-section',
    title: '',
    subtitle: '',
    rows: Array.isArray(rows) ? rows : [],
    columns: Array.isArray(columns) ? columns : [],
    totalsRow,
    highlightRows: true,
    emptyMessage,
  }];
}

function buildTabularSectionHtml(section) {
  const rowClassResolver = section.highlightRows ? getGenericRowClass : () => '';
  const rowsHtml = section.rows.length
    ? buildRowsHtml(section.rows, section.columns, rowClassResolver)
    : buildEmptyRowsHtml(section.columns.length, section.emptyMessage);

  return `
    <section class="tay-print-section">
      ${section.title || section.subtitle ? `
        <div class="tay-section-header">
          <div>
            ${section.title ? `<h2 class="tay-section-title">${escapeHtml(section.title)}</h2>` : ''}
            ${section.subtitle ? `<div class="tay-section-subtitle">${escapeHtml(section.subtitle)}</div>` : ''}
          </div>
        </div>
      ` : ''}
      <div class="tay-table-wrap">
        <table class="tay-table">
          <thead>
            <tr>${section.columns.map((column) => `<th class="${getColumnCellClass(column)}">${escapeHtml(column.label)}</th>`).join('')}</tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
          ${buildTotalsHtml(section.columns, section.totalsRow)}
        </table>
      </div>
    </section>
  `;
}

function getShellHtml({
  title,
  subtitle,
  metaHtml = '',
  summaryCards = [],
  tableHtml,
  orientation = 'landscape',
  branded = true,
  watermark = true,
  showFooterMeta = true,
}) {
  const pageClass = orientation === 'portrait' ? 'portrait' : 'landscape';
  const today = formatEnglishLongDate(new Date());
  const headerUrl = resolveAssetUrl(TAY_ALRAWI_BRAND_ASSETS.header);
  const footerUrl = resolveAssetUrl(TAY_ALRAWI_BRAND_ASSETS.footer);
  const logoUrl = resolveAssetUrl(TAY_ALRAWI_BRAND_ASSETS.logo);

  return `
    <main class="tay-print-shell ${pageClass} ${branded ? 'is-branded' : 'is-plain'}">
      <section class="tay-print-page ${pageClass}">
        ${branded ? `<img class="tay-header-image" src="${headerUrl}" alt="TAY ALRAWI Header" />` : '<div class="tay-plain-header"></div>'}
        ${branded && watermark ? `
          <div class="tay-watermark">
            <img src="${logoUrl}" alt="" />
          </div>
        ` : ''}
        <div class="tay-content ${pageClass}">
          <header class="tay-report-header">
            <div class="tay-title-block">
              ${subtitle ? `<div class="tay-report-subtitle">${escapeHtml(subtitle)}</div>` : ''}
              ${title ? `<h1>${escapeHtml(title)}</h1>` : ''}
            </div>
            ${metaHtml}
          </header>
          ${buildSummaryCardsHtml(summaryCards)}
          ${tableHtml}
        </div>
        <div class="tay-footer ${branded ? 'is-branded' : 'is-plain'}">
          ${branded ? `<img class="tay-footer-image" src="${footerUrl}" alt="TAY ALRAWI Footer" />` : '<div class="tay-plain-footer"></div>'}
          <div class="tay-footer-overlay ${showFooterMeta ? 'show-meta' : 'hide-meta'}">
            <span class="tay-footer-slot tay-footer-slot-left">${showFooterMeta ? escapeHtml(today) : ''}</span>
            <span class="tay-footer-slot tay-footer-slot-right">${showFooterMeta ? 'Page ' : ''}<span class="tay-footer-page"></span></span>
          </div>
        </div>
      </section>
    </main>
  `;
}

function getShellCss({ orientation = 'landscape', highlightRows = true, branded = true } = {}) {
  const isPortrait = orientation === 'portrait';
  const pageSize = isPortrait ? 'A4 portrait' : 'A4 landscape';
  const pageMinHeight = isPortrait ? 'calc(297mm - 12mm)' : 'calc(210mm - 12mm)';
  const headerHeight = branded ? (isPortrait ? '35mm' : '31mm') : (isPortrait ? '18mm' : '16mm');
  const footerHeight = branded ? (isPortrait ? '24mm' : '22mm') : (isPortrait ? '14mm' : '12mm');
  const contentPaddingTop = branded ? (isPortrait ? '40mm' : '35mm') : (isPortrait ? '24mm' : '22mm');
  const contentPaddingBottom = branded ? (isPortrait ? '28mm' : '26mm') : (isPortrait ? '18mm' : '16mm');

  return `
    @page { size: ${pageSize}; margin: 6mm; }
    html, body { background: #fff; }
    .tay-print-shell { padding: 0; }
    .tay-print-page {
      position: relative;
      width: 100%;
      min-height: ${pageMinHeight};
      background: #fff;
      overflow: hidden;
    }
    .tay-header-image,
    .tay-plain-header {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: ${headerHeight};
    }
    .tay-header-image { object-fit: cover; object-position: center top; }
    .tay-plain-header { background: ${TAY_ALRAWI_BRAND_COLORS.headerNavy}; }
    .tay-watermark {
      pointer-events: none;
      position: absolute;
      inset: ${contentPaddingTop} 0 ${contentPaddingBottom} 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.06;
    }
    .tay-watermark img {
      width: ${isPortrait ? '88mm' : '96mm'};
      max-width: 42%;
      height: auto;
      object-fit: contain;
    }
    .tay-content {
      position: relative;
      padding: ${contentPaddingTop} 6mm ${contentPaddingBottom};
    }
    .tay-report-header {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6mm;
    }
    .tay-title-block h1 {
      margin: 0;
      font-size: ${isPortrait ? '19px' : '18px'};
      color: ${TAY_ALRAWI_BRAND_COLORS.text};
      letter-spacing: 0.2px;
    }
    .tay-report-subtitle {
      margin-bottom: 4px;
      font-size: 12px;
      color: ${TAY_ALRAWI_BRAND_COLORS.accentRedDark};
      font-weight: 700;
    }
    .tay-summary-grid {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-bottom: 6mm;
    }
    .tay-summary-card {
      border: 1px solid #d8dce7;
      border-radius: 12px;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.96);
    }
    .tay-summary-card span {
      display: block;
      margin-bottom: 4px;
      color: #5c6482;
      font-size: 12px;
      font-weight: 700;
    }
    .tay-summary-card strong {
      color: ${TAY_ALRAWI_BRAND_COLORS.headerNavy};
      font-size: 18px;
    }
    .tay-sections {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 5mm;
    }
    .tay-print-section {
      position: relative;
      z-index: 1;
      break-inside: avoid;
    }
    .tay-section-header {
      margin-bottom: 2.5mm;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }
    .tay-section-title {
      margin: 0;
      color: ${TAY_ALRAWI_BRAND_COLORS.headerNavy};
      font-size: 15px;
      font-weight: 800;
    }
    .tay-section-subtitle {
      margin-top: 3px;
      color: ${TAY_ALRAWI_BRAND_COLORS.accentRedDark};
      font-size: 11px;
      font-weight: 700;
    }
    .tay-table-wrap {
      position: relative;
      z-index: 1;
      overflow: hidden;
      border: 1px solid #bfc6d3;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.98);
    }
    .tay-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .tay-table th,
    .tay-table td {
      border: 1px solid #d7dbe4;
      padding: ${isPortrait ? '8px 9px' : '7px 8px'};
      text-align: center;
      vertical-align: middle;
      color: #1f2937;
      font-size: ${isPortrait ? '12px' : '11px'};
      line-height: 1.45;
      word-break: break-word;
    }
    .tay-table .tay-date-cell {
      white-space: nowrap;
      word-break: normal;
    }
    .tay-table th {
      background: ${TAY_ALRAWI_BRAND_COLORS.tableNavy};
      color: #fff;
      font-weight: 700;
    }
    .tay-table tbody tr:nth-child(even) td {
      background: ${TAY_ALRAWI_BRAND_COLORS.rowTint};
    }
    ${highlightRows ? `
      .tay-table tr.receipt-row td {
        color: #0f7a3c;
        font-weight: 700;
      }
      .tay-table tr.payment-row td {
        color: #b91c1c;
        font-weight: 700;
      }
    ` : ''}
    .tay-table tfoot td {
      background: #eef1f7;
      color: ${TAY_ALRAWI_BRAND_COLORS.headerNavy};
      font-weight: 700;
    }
    .tay-empty-row td {
      padding: 14px 12px;
      color: #64748b;
      font-weight: 700;
      background: #f8fafc !important;
    }
    .tay-footer {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: ${footerHeight};
    }
    .tay-footer-image,
    .tay-plain-footer {
      width: 100%;
      height: 100%;
      display: block;
    }
    .tay-footer-image { object-fit: cover; object-position: center bottom; }
    .tay-plain-footer { background: ${TAY_ALRAWI_BRAND_COLORS.footerNavy}; }
    .tay-footer-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .tay-footer-slot {
      position: absolute;
      bottom: 12%;
      height: 28%;
      display: flex;
      align-items: center;
      color: #fff;
      font-size: 10px;
      font-weight: 500;
      direction: ltr;
      text-shadow: 0 1px 1px rgba(0, 0, 0, 0.18);
    }
    .tay-footer-slot-left {
      left: 4.1%;
      width: 22%;
      justify-content: flex-start;
      padding-left: 1.5%;
    }
    .tay-footer-slot-right {
      right: 8.6%;
      width: 12%;
      justify-content: flex-end;
      padding-right: 1.2%;
    }
    .tay-footer-overlay.hide-meta .tay-footer-slot {
      color: transparent;
    }
    .tay-footer-page::before {
      content: counter(page);
    }
    .tay-meta-inline,
    .tay-meta-stack {
      display: flex;
      align-items: flex-start;
      gap: 8px 18px;
      flex-wrap: wrap;
      color: #1f2937;
      font-size: 12px;
      font-weight: 600;
    }
    .tay-meta-stack {
      flex-direction: column;
      align-items: stretch;
      gap: 4px;
    }
    .tay-meta-label {
      color: ${TAY_ALRAWI_BRAND_COLORS.headerNavy};
      font-weight: 700;
    }
    .tay-meta-value-red {
      color: ${TAY_ALRAWI_BRAND_COLORS.accentRed};
      font-weight: 700;
    }
    @media print {
      .tay-print-page { min-height: auto; }
      .tay-table-wrap { break-inside: avoid; }
    }
  `;
}

export function printTabularReport({
  rows,
  columns,
  title,
  subtitle,
  summaryCards = [],
  totalsRow,
  sectionKey,
  sections = [],
  metaItems = [],
  orientation = 'landscape',
  emptyMessage,
}) {
  const branded = shouldUseTayAlRawiBranding({ sectionKey });
  const normalizedSections = normalizeTabularPrintSections({
    rows,
    columns,
    totalsRow,
    sections,
    emptyMessage,
  });
  const metaHtml = buildPrintMetaHtml(metaItems);

  const tableHtml = `<div class="tay-sections">${normalizedSections.map((section) => buildTabularSectionHtml(section)).join('')}</div>`;

  const html = getShellHtml({
    title,
    subtitle,
    metaHtml,
    summaryCards,
    tableHtml,
    orientation,
    branded,
    watermark: branded,
    showFooterMeta: true,
  });

  openPrintWindow(
    title,
    html,
    getShellCss({
      orientation,
      highlightRows: normalizedSections.some((section) => section.highlightRows),
      branded,
    }),
  );
}

export function printSaudiStatementTemplate({
  rows,
  columns,
  title,
  accountName,
  fromDate,
  toDate,
  templateVariant,
  totals,
  sectionKey,
}) {
  const branded = shouldUseTayAlRawiBranding({ sectionKey });

  const totalUsd = `$${Number(totals?.totalInvoicesUSD || 0).toLocaleString('en-US')}`;
  const totalIqd = `${Number(totals?.totalInvoicesIQD || 0).toLocaleString('en-US')} د.ع`;
  const balanceUsd = `$${Number(totals?.balanceUSD || 0).toLocaleString('en-US')}`;
  const balanceIqd = `${Number(totals?.balanceIQD || 0).toLocaleString('en-US')} د.ع`;

  const totalsLines = [];
  if (templateVariant === 'usd') {
    totalsLines.push({ label: 'الطلب الكلي', value: totalUsd });
    totalsLines.push({ label: 'مبلغ المحدد', value: balanceUsd });
  } else if (templateVariant === 'iqd') {
    totalsLines.push({ label: 'الطلب الكلي', value: totalIqd });
    totalsLines.push({ label: 'مبلغ المحدد', value: balanceIqd });
  } else {
    totalsLines.push({ label: 'الطلب الكلي دولار', value: totalUsd });
    totalsLines.push({ label: 'الطلب الكلي دينار', value: totalIqd });
    totalsLines.push({ label: 'مبلغ المحدد دولار', value: balanceUsd });
    totalsLines.push({ label: 'مبلغ المحدد دينار', value: balanceIqd });
  }

  const metaHtml = `
    <div class="tay-meta-stack">
      <div class="tay-meta-inline">
        <span class="tay-meta-label">اسم التاجر:</span>
        <span>${escapeHtml(accountName || '---')}</span>
      </div>
      <div class="tay-meta-inline">
        <span class="tay-meta-label">من تاريخ:</span>
        <span>${escapeHtml(fromDate || '---')}</span>
        <span class="tay-meta-label">إلى تاريخ:</span>
        <span>${escapeHtml(toDate || '---')}</span>
      </div>
      <div class="tay-meta-inline">
        ${totalsLines.map((line) => `
          <span class="tay-meta-label">${escapeHtml(line.label)}:</span>
          <span class="tay-meta-value-red">${escapeHtml(line.value)}</span>
        `).join('')}
      </div>
    </div>
  `;

  const tableHtml = `
    <div class="tay-table-wrap">
      <table class="tay-table">
        <thead>
          <tr>${columns.map((column) => `<th class="${getColumnCellClass(column)}">${escapeHtml(column.label)}</th>`).join('')}</tr>
        </thead>
        <tbody>${buildRowsHtml(rows, columns, getGenericRowClass)}</tbody>
      </table>
    </div>
  `;

  const html = getShellHtml({
    title,
    subtitle: 'كشف حساب',
    metaHtml,
    tableHtml,
    orientation: 'landscape',
    branded,
    watermark: branded,
    showFooterMeta: true,
  });

  openPrintWindow(title, html, getShellCss({ orientation: 'landscape', highlightRows: true, branded }));
}

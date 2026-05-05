import { fmtNum, fmtUSD, fmtIQD, fmtUSDLabel, fmtIQDLabel } from "./formatNumber";
import { getCurrencyLabel } from "./currencyLabels";
import {
  formatEnglishLongDate,
  shouldUseTayAlRawiBranding,
  TAY_ALRAWI_BRAND_ASSETS,
  resolveBrandAssets,
  TAY_ALRAWI_BRAND_COLORS,
} from "./exportBranding";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resolveColumnValue(row, column) {
  if (typeof column?.getValue === "function") {
    return column.getValue(row);
  }

  return row?.[column?.key];
}

function formatCellValue(value, format) {
  if (value === null || value === undefined || value === "") return "-";
  if (format === "date") return String(value).split("T")[0].split(" ")[0];
  if (format === "currency") return getCurrencyLabel(value);
  if (format === "number") return fmtNum(value);
  if (format === "money") return `$${fmtUSD(value)}`;
  if (format === "money_iqd")
    return `${fmtIQD(value)} د.ع`;
  return String(value);
}

function resolveAssetUrl(path) {
  try {
    return new URL(path, window.location.origin).href;
  } catch {
    return path;
  }
}

function openPrintWindow(title, body, extraCss = "") {
  const printWindow = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=1500,height=950"
  );
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title || "طباعة")}</title>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&amp;family=Tajawal:wght@400;500;700;800&amp;family=Cairo:wght@400;600;700&amp;display=swap" rel="stylesheet">
    <style>
      @page { margin: 0 !important; }
      * { box-sizing: border-box; font-family: "IBM Plex Sans Arabic", "Tajawal", "Cairo", Arial, Tahoma, sans-serif !important; }
      html, body { margin: 0 !important; padding: 0 !important; background: #eef2f7; }
      body {
        font-family: "IBM Plex Sans Arabic", "Tajawal", "Cairo", Arial, Tahoma, sans-serif;
        direction: rtl;
        color: #000000;
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
        font-size: 16px;
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
        @page { margin: 0 !important; }
        .print-controls { display: none !important; }
        html, body { margin: 0 !important; padding: 0 !important; background: #fff; }
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
  const direction = String(
    row?.Direction || row?.direction || ""
  ).toUpperCase();

  const rt = String(row?.RecordType || row?.recordType || "").toLowerCase();
  const tn = String(
    row?.TransTypeName || row?.transTypeName || ""
  ).toLowerCase();

  if (
    transTypeId === 1 ||
    direction === "IN" ||
    direction === "DR" ||
    rt === "invoice" ||
    tn.includes("فاتورة") ||
    tn.includes("استحقاق") ||
    row?.ShipID ||
    row?.shipment_id
  )
    return "tay-row-invoice";
  if (
    transTypeId === 2 ||
    direction === "OUT" ||
    direction === "CR" ||
    rt === "payment" ||
    tn.includes("قبض") ||
    tn.includes("دفع")
  )
    return "tay-row-payment";
  if (
    transTypeId === 3 ||
    rt === "debit-note" ||
    tn.includes("إضافة") ||
    tn.includes("اضافة")
  )
    return "tay-row-debit";

  return "";
}

function getColumnCellClass(column) {
  return column?.format === "date" ? "tay-date-cell" : "";
}

function buildRowsHtml(rows, columns, rowClassResolver = () => "") {
  return rows
    .map(
      row => `
    <tr class="${rowClassResolver(row)}">
      ${columns.map(column => `<td class="${getColumnCellClass(column)}">${escapeHtml(formatCellValue(resolveColumnValue(row, column), column.format))}</td>`).join("")}
    </tr>
  `
    )
    .join("");
}

function buildEmptyRowsHtml(columnCount, message = "لا توجد بيانات للطباعة.") {
  return `
    <tr class="tay-empty-row">
      <td colspan="${Math.max(1, columnCount)}">${escapeHtml(message)}</td>
    </tr>
  `;
}

function buildTotalsHtml(columns, totalsRow) {
  if (!totalsRow) return "";

  const totalsCells = columns
    .map((column, index) => {
      if (index === 0) return "<td>المجموع</td>";
      if (totalsRow[column.key] !== undefined) {
        return `<td class="${getColumnCellClass(column)}">${escapeHtml(formatCellValue(totalsRow[column.key], column.format))}</td>`;
      }
      return "<td></td>";
    })
    .join("");

  return `<tfoot><tr>${totalsCells}</tr></tfoot>`;
}

function buildSummaryCardsHtml(summaryCards = []) {
  if (!summaryCards.length) return "";

  return `
    <div class="tay-summary-grid">
      ${summaryCards
        .map(
          card => `
        <div class="tay-summary-card">
          <span>${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

export function buildPrintMetaHtml(metaItems = []) {
  const visibleItems = (metaItems || []).filter(item => {
    const value = item?.value;
    return value !== null && value !== undefined && String(value).trim() !== "";
  });

  if (!visibleItems.length) return "";

  return `
    <div class="tay-meta-stack">
      ${visibleItems
        .map(
          item => `
        <div class="tay-meta-inline">
          <span class="tay-meta-label">${escapeHtml(item.label)}:</span>
          <span class="${item.tone === "accent" ? "tay-meta-value-red" : ""}">${escapeHtml(item.value)}</span>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

export function normalizeTabularPrintSections({
  rows = [],
  columns = [],
  totalsRow = null,
  sections = [],
  emptyMessage = "لا توجد بيانات للطباعة.",
} = {}) {
  const providedSections = (sections || []).filter(
    section => Array.isArray(section?.columns) && section.columns.length > 0
  );

  if (providedSections.length > 0) {
    return providedSections.map((section, index) => ({
      key: section.key || `section-${index + 1}`,
      title: section.title || "",
      subtitle: section.subtitle || "",
      rows: Array.isArray(section.rows) ? section.rows : [],
      columns: section.columns,
      totalsRow: section.totalsRow ?? null,
      highlightRows: Boolean(section.highlightRows),
      emptyMessage: section.emptyMessage || emptyMessage,
    }));
  }

  return [
    {
      key: "main-section",
      title: "",
      subtitle: "",
      rows: Array.isArray(rows) ? rows : [],
      columns: Array.isArray(columns) ? columns : [],
      totalsRow,
      highlightRows: true,
      emptyMessage,
    },
  ];
}

function buildTabularSectionHtml(section) {
  const rowClassResolver = section.highlightRows
    ? getGenericRowClass
    : () => "";
  const rowsHtml = section.rows.length
    ? buildRowsHtml(section.rows, section.columns, rowClassResolver)
    : buildEmptyRowsHtml(section.columns.length, section.emptyMessage);

  return `
    <section class="tay-print-section">
      ${
        section.title || section.subtitle
          ? `
        <div class="tay-section-header">
          <div>
            ${section.title ? `<h2 class="tay-section-title">${escapeHtml(section.title)}</h2>` : ""}
            ${section.subtitle ? `<div class="tay-section-subtitle">${escapeHtml(section.subtitle)}</div>` : ""}
          </div>
        </div>
      `
          : ""
      }
      <div class="tay-table-wrap">
        <table class="tay-table">
          <thead>
            <tr>${section.columns.map(column => `<th class="${getColumnCellClass(column)}">${escapeHtml(column.label)}</th>`).join("")}</tr>
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
  metaHtml = "",
  summaryCards = [],
  tableHtml,
  orientation = "landscape",
  branded = true,
  watermark = true,
  showFooterMeta = true,
  sectionKey,
}) {
  const pageClass = orientation === "portrait" ? "portrait" : "landscape";
  const today = formatEnglishLongDate(new Date());
  const brand = resolveBrandAssets({ sectionKey });
  const headerUrl = resolveAssetUrl(brand.header);
  const footerUrl = resolveAssetUrl(brand.footer);
  const logoUrl = resolveAssetUrl(brand.logo);

  return `
    <main class="tay-print-shell ${pageClass} ${branded ? "is-branded" : "is-plain"}">
      <section class="tay-print-page ${pageClass}">
        ${branded ? `<img class="tay-header-image" src="${headerUrl}" alt="TAY ALRAWI Header" />` : '<div class="tay-plain-header"></div>'}
        ${
          branded && watermark
            ? `
          <div class="tay-watermark">
            <img src="${logoUrl}" alt="" />
          </div>
        `
            : ""
        }
        <div class="tay-content ${pageClass}">
          <header class="tay-report-header">
            <div class="tay-title-block">
              ${subtitle ? `<div class="tay-report-subtitle">${escapeHtml(subtitle)}</div>` : ""}
              ${title ? `<h1>${escapeHtml(title)}</h1>` : ""}
            </div>
            ${metaHtml}
          </header>
          ${buildSummaryCardsHtml(summaryCards)}
          ${tableHtml}
        </div>
        <div class="tay-footer ${branded ? "is-branded" : "is-plain"}">
          ${branded ? `<img class="tay-footer-image" src="${footerUrl}" alt="TAY ALRAWI Footer" />` : '<div class="tay-plain-footer"></div>'}
          <div class="tay-footer-overlay ${showFooterMeta ? "show-meta" : "hide-meta"}">
            <span class="tay-footer-slot tay-footer-slot-left">${showFooterMeta ? escapeHtml(today) : ""}</span>
            <span class="tay-footer-slot tay-footer-slot-right">${showFooterMeta ? "Page " : ""}<span class="tay-footer-page"></span></span>
          </div>
        </div>
      </section>
    </main>
  `;
}

function getShellCss({
  orientation = "landscape",
  highlightRows = true,
  branded = true,
} = {}) {
  const isPortrait = orientation === "portrait";
  const pageSize = isPortrait ? "A4 portrait" : "A4 landscape";
  const pageMinHeight = isPortrait
    ? "297mm"
    : "210mm";
  const headerHeight = branded
    ? isPortrait
      ? "35mm"
      : "31mm"
    : isPortrait
      ? "18mm"
      : "16mm";
  const footerHeight = branded
    ? isPortrait
      ? "24mm"
      : "22mm"
    : isPortrait
      ? "14mm"
      : "12mm";
  const contentPaddingTop = branded
    ? isPortrait
      ? "56mm"
      : "52mm"
    : isPortrait
      ? "24mm"
      : "22mm";
  const contentPaddingBottom = branded
    ? isPortrait
      ? "28mm"
      : "26mm"
    : isPortrait
      ? "18mm"
      : "16mm";

  return `
    @page { size: ${pageSize}; margin: 0; }
    html, body { background: #fff; margin: 0; padding: 0; }
    .tay-print-shell { padding: 0; margin: 0; }
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
    .tay-header-image { object-fit: cover; object-position: center top; display: block; }
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
      width: ${isPortrait ? "88mm" : "96mm"};
      max-width: 42%;
      height: auto;
      object-fit: contain;
    }
    .tay-content {
      position: relative;
      padding: ${contentPaddingTop} 8mm ${contentPaddingBottom};
    }
    .tay-report-header {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-top: 12mm;
      margin-bottom: 8mm;
    }
    .tay-title-block h1 {
      margin: 0;
      font-size: ${isPortrait ? "68px" : "62px"};
      color: ${TAY_ALRAWI_BRAND_COLORS.text};
      letter-spacing: 0.2px;
      line-height: 1.5;
      padding-bottom: 6px;
    }
    .tay-report-subtitle {
      margin-bottom: 4px;
      font-size: 52px;
      color: ${TAY_ALRAWI_BRAND_COLORS.accentRedDark};
      font-weight: 700;
    }
    .tay-summary-grid {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 6mm;
    }
    .tay-summary-card {
      border: 1px solid #d8dce7;
      border-radius: 12px;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.96);
    }
    .tay-summary-card span {
      display: block;
      margin-bottom: 6px;
      color: #5c6482;
      font-size: 45px;
      font-weight: 700;
    }
    .tay-summary-card strong {
      color: ${TAY_ALRAWI_BRAND_COLORS.headerNavy};
      font-size: 52px;
      font-weight: 800;
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
      font-size: 52px;
      font-weight: 800;
    }
    .tay-section-subtitle {
      margin-top: 3px;
      color: ${TAY_ALRAWI_BRAND_COLORS.accentRedDark};
      font-size: 45px;
      font-weight: 700;
    }
    .tay-table-wrap {
      position: relative;
      z-index: 1;
      overflow: hidden;
      border: 1px solid #bfc6d3;
      border-radius: 10px;
      background: transparent;
    }
    .tay-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
    }
    .tay-table th,
    .tay-table td {
      border: 1px solid #d7dbe4;
      padding: 4px 6px;
      text-align: center;
      vertical-align: middle;
      color: #1f2937;
      line-height: 1.25;
      word-break: break-word;
    }
    .tay-table td {
      font-size: 13pt;
      font-weight: 500;
      color: #000000;
    }
    .tay-table .tay-date-cell {
      white-space: nowrap;
      word-break: normal;
    }
    .tay-table th {
      background: ${TAY_ALRAWI_BRAND_COLORS.tableNavy};
      color: #fff;
      font-weight: 700;
      white-space: nowrap;
      word-break: normal;
      padding: 6px 4px;
      font-size: 13pt;
    }
    .tay-table tbody tr:nth-child(even) td {
      background: #f9f9f9;
    }
    .tay-table tbody tr:nth-child(odd) td {
      background: #ffffff;
    }
    ${
      highlightRows
        ? `
      .tay-table tr.tay-row-invoice td {
        border-right: 4px solid rgba(55, 65, 81, 0.8) !important;
      }
      .tay-table tr.tay-row-payment td {
        background-color: rgba(220, 38, 38, 0.05) !important;
        border-right: 4px solid rgba(220, 38, 38, 0.8) !important;
      }
      .tay-table tr.tay-row-debit td {
        border-right: 4px solid rgba(22, 163, 74, 0.8) !important;
      }
    `
        : ""
    }
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
      font-size: 41px;
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
      gap: 12px 22px;
      flex-wrap: wrap;
      color: #1f2937;
      font-size: 14pt;
      font-weight: 700;
    }
    .tay-meta-stack {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
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
      @page {
        size: ${pageSize};
        margin: 0;
      }
      html, body { margin: 0; padding: 0; }
      .tay-print-shell { padding: 0; margin: 0; }
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
  orientation = "landscape",
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

  const tableHtml = `<div class="tay-sections">${normalizedSections.map(section => buildTabularSectionHtml(section)).join("")}</div>`;

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
    sectionKey,
  });

  openPrintWindow(
    title,
    html,
    getShellCss({
      orientation,
      highlightRows: normalizedSections.some(section => section.highlightRows),
      branded,
    })
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
  globalTotals,
  totals
}) {
  const activeGlobalTotals = globalTotals || totals || {};
  const totalUsd = `$${fmtUSD(activeGlobalTotals?.totalInvoicesUSD || 0)}`;
  const totalIqd = `${fmtIQD(activeGlobalTotals?.totalInvoicesIQD || 0)} د.ع`;
  const filteredUsd = `$${fmtUSD(totals?.totalInvoicesUSD || 0)}`;
  const filteredIqd = `$${fmtNum(totals?.totalInvoicesIQD || 0)} د.ع`;
  const balanceUsd = `$${fmtUSD(activeGlobalTotals?.balanceUSD || 0)}`;
  const balanceIqd = `$${fmtNum(activeGlobalTotals?.balanceIQD || 0)} د.ع`;

  const totalsLines = [];
  if (templateVariant === "usd") {
    totalsLines.push({ label: "المبلغ الكلي", value: totalUsd });
    totalsLines.push({ label: "المبلغ المحدد", value: filteredUsd });
    totalsLines.push({ label: "الرصيد المتبقي", value: balanceUsd });
  } else if (templateVariant === "iqd") {
    totalsLines.push({ label: "المبلغ الكلي", value: totalIqd });
    totalsLines.push({ label: "المبلغ المحدد", value: filteredIqd });
    totalsLines.push({ label: "الرصيد المتبقي", value: balanceIqd });
  } else {
    totalsLines.push({ label: "المبلغ الكلي دولار", value: totalUsd });
    totalsLines.push({ label: "المبلغ الكلي دينار", value: totalIqd });
    totalsLines.push({ label: "المبلغ المحدد دولار", value: filteredUsd });
    totalsLines.push({ label: "المبلغ المحدد دينار", value: filteredIqd });
    totalsLines.push({ label: "الرصيد المتبقي دولار", value: balanceUsd });
    totalsLines.push({ label: "الرصيد المتبقي دينار", value: balanceIqd });
  }

  const rightLines = totalsLines.filter(
    line => !line.label.includes("محدد") && !line.label.includes("متبقي")
  );
  const isValidDate = d => d && d !== "---" && String(d).trim() !== "";
  const hasDateFilter = isValidDate(fromDate) || isValidDate(toDate);
  const centerLines = hasDateFilter ? totalsLines.filter(
    line => line.label.includes("محدد")
  ) : [];
  const leftLines = totalsLines.filter(
    line => line.label.includes("متبقي")
  );

  const metaHtml = `
    <hr style="border: none; border-top: 1px solid #1C2B59; margin: 0 0 15px 0;" />
    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; gap: 20px;">
      <!-- Right Side: Trader Name, Total Amount -->
      <div style="display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0;">
        <div class="tay-meta-inline">
          <span class="tay-meta-label">اسم التاجر:</span>
          <span>${escapeHtml(accountName || "---")}</span>
        </div>
        ${rightLines
          .map(
            line => `
          <div class="tay-meta-inline">
            <span class="tay-meta-label">${escapeHtml(line.label)}:</span>
            <span class="tay-meta-value-red">${escapeHtml(line.value)}</span>
          </div>
        `
          )
          .join("")}
      </div>

      <!-- Center Side: Limit Amount -->
      <div style="display: flex; flex-direction: column; gap: 8px; flex: 1; align-items: center; text-align: center; min-width: 0;">
        ${centerLines
          .map(
            line => `
          <div class="tay-meta-inline" style="justify-content: center;">
            <span class="tay-meta-label">${escapeHtml(line.label)}:</span>
            <span class="tay-meta-value-red">${escapeHtml(line.value)}</span>
          </div>
        `
          )
          .join("")}
      </div>

      <!-- Left Side: Dates & Balance -->
      <div style="display: flex; flex-direction: column; gap: 8px; flex: 1; align-items: flex-end; text-align: left; min-width: 0;">
        <div class="tay-meta-inline" style="justify-content: flex-end;">
          <span class="tay-meta-label">من تاريخ:</span>
          <span>${escapeHtml(fromDate || "---")}</span>
        </div>
        <div class="tay-meta-inline" style="justify-content: flex-end;">
          <span class="tay-meta-label">إلى تاريخ:</span>
          <span>${escapeHtml(toDate || "---")}</span>
        </div>
        ${leftLines
          .map(
            line => `
          <div class="tay-meta-inline" style="justify-content: flex-end;">
            <span class="tay-meta-label">${escapeHtml(line.label)}:</span>
            <span class="tay-meta-value-red">${escapeHtml(line.value)}</span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  const tableHtml = `
    <div class="tay-table-wrap">
      <table class="tay-table">
        <thead>
          <tr>${columns.map(column => `<th class="${getColumnCellClass(column)}">${escapeHtml(column.label)}</th>`).join("")}</tr>
        </thead>
        <tbody>${buildRowsHtml(rows, columns, getGenericRowClass)}</tbody>
      </table>
    </div>
  `;

  const html = getShellHtml({
    title,
    subtitle: "كشف حساب",
    metaHtml,
    tableHtml,
    orientation: "portrait",
    branded,
    watermark: branded,
    showFooterMeta: true,
    sectionKey,
  });

  openPrintWindow(
    title,
    html,
    getShellCss({ orientation: "portrait", highlightRows: false, branded })
  );
}

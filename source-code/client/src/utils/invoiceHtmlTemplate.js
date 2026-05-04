/**
 * Invoice HTML Template Generator (v2)
 * 
 * Generates a professional A4 HTML invoice for server-side PDF rendering via Puppeteer.
 * Design based on user specifications:
 * - Section 1: Invoice No | Driver Name | Vehicle Plate | Goods Type
 * - Section 2 (Table): Invoice Notes | Invoice Details | Currency (smart) | Amount
 * - Weight/Meters shown only if available
 * - Export timestamp at the bottom
 * - RTL Arabic layout, English dates, professional navy/red colors
 */

import { fmtNum, fmtUSD, fmtIQD } from "./formatNumber";
import { getCurrencyLabel } from "./currencyLabels";
import {
  getTransactionTypeLabel,
  getTransactionReferenceLabel,
} from "./transactionTypeLabels";
import {
  resolveBrandAssets,
  formatEnglishLongDate,
  TAY_ALRAWI_BRAND_COLORS,
} from "./exportBranding";
import { sectionConfig } from "../features/navigation/sectionCatalog";

/** Resolve the human-readable port/section name from sectionKey */
function resolvePortDisplayName(sectionKey, transaction) {
  if (sectionKey) {
    const cfg = sectionConfig[sectionKey];
    if (cfg?.title) return cfg.title;
  }
  if (transaction.PortName && transaction.PortName !== transaction.PortID) {
    return transaction.PortName;
  }
  return transaction.PortID || "-";
}

function escapeHtml(unsafe) {
  if (unsafe == null) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateEnglish(value) {
  if (!value) return "-";
  const dateStr = String(value).split("T")[0].split(" ")[0];
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatFullTimestamp() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);
  return `${date} ${time}`;
}

function formatMoney(value, currency = "USD") {
  if (value === null || value === undefined || value === "" || Number(value) === 0) return "";
  const num = Number(value);
  if (isNaN(num)) return "";
  if (currency === "IQD") return fmtIQD(num);
  return fmtUSD(num);
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "" || Number(value) === 0) return "";
  return fmtNum(value);
}

/**
 * Determine the smart currency label based on the transaction's primary currency
 */
function getSmartCurrencyLabel(transaction) {
  const curr = (transaction.CurrencyName || transaction.Currency || "").toUpperCase();
  if (curr.includes("IQD") || curr.includes("دينار")) return "دينار";
  if (curr.includes("USD") || curr.includes("دولار")) return "دولار";
  // Fallback: check which amount is filled
  if (Number(transaction.AmountIQD) > 0 && !Number(transaction.AmountUSD)) return "دينار";
  if (Number(transaction.AmountUSD) > 0 && !Number(transaction.AmountIQD)) return "دولار";
  return "دولار";
}

/**
 * Get the primary amount based on smart currency detection
 */
function getSmartAmount(transaction) {
  const curr = getSmartCurrencyLabel(transaction);
  if (curr === "دينار") {
    return formatMoney(transaction.AmountIQD, "IQD") || formatMoney(transaction.CostIQD, "IQD") || "-";
  }
  return formatMoney(transaction.AmountUSD, "USD") || formatMoney(transaction.CostUSD, "USD") || "-";
}

/**
 * Convert a local image path to base64 data URI for embedding in HTML
 */
async function imageToBase64(url) {
  if (!url) return null;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const loaded = await new Promise((resolve) => {
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = new URL(url, window.location.origin).href;
    });
    if (!loaded) return null;
    const c = document.createElement("canvas");
    c.width = loaded.naturalWidth || loaded.width;
    c.height = loaded.naturalHeight || loaded.height;
    const cx = c.getContext("2d");
    cx.drawImage(loaded, 0, 0);
    return c.toDataURL("image/png");
  } catch {
    return null;
  }
}

/**
 * Generate the full invoice HTML string (v2 - new design)
 */
export async function generateInvoiceHtml(transaction = {}, { sectionKey, portId } = {}) {
  const brand = resolveBrandAssets({ sectionKey });
  const [headerBase64, footerBase64, logoBase64] = await Promise.all([
    imageToBase64(brand.header),
    imageToBase64(brand.invoiceFooter),
    imageToBase64(brand.logoOnWhite),
  ]);

  const typeId = Number(transaction.TransTypeID || 1);
  const transTypeLabel = getTransactionTypeLabel(
    transaction.TransTypeName,
    transaction.TransTypeID,
    { sectionKey, recordType: transaction.RecordType }
  );
  const refLabel = getTransactionReferenceLabel(
    transaction.TransTypeID,
    { sectionKey, recordType: transaction.RecordType }
  );
  const refNo = transaction.RefNo || `REF-${transaction.TransID}`;
  const transDate = formatDateEnglish(transaction.TransDate);
  const exportTimestamp = formatFullTimestamp();
  const portName = resolvePortDisplayName(sectionKey, transaction);
  const smartCurrency = getSmartCurrencyLabel(transaction);
  const smartAmount = getSmartAmount(transaction);

  const navy = TAY_ALRAWI_BRAND_COLORS.headerNavy;
  const red = TAY_ALRAWI_BRAND_COLORS.accentRed;

  // Section 1 fields
  const driverName = transaction.DriverName || "-";
  const vehiclePlate = transaction.PlateNumber || transaction.VehiclePlate || "-";
  const goodType = transaction.GoodTypeName || transaction.GoodType || "-";
  const accountName = transaction.AccountName || transaction.TraderName || "-";

  // Weight/Meters (show only if available)
  const weight = formatNumber(transaction.Weight);
  const meters = formatNumber(transaction.Meters);
  const qty = formatNumber(transaction.Qty);

  // Invoice-specific fields (new)
  const invoiceNotes = transaction.InvoiceNotes || "";
  const invoiceDetails = transaction.InvoiceDetails || "";

  // Financial details for table rows
  const tableRows = [];
  
  // Main amount row
  tableRows.push({
    notes: invoiceNotes,
    details: invoiceDetails,
    currency: smartCurrency,
    amount: smartAmount,
  });

  // Additional financial rows (if both currencies have values)
  const hasUSD = Number(transaction.AmountUSD) > 0 || Number(transaction.CostUSD) > 0;
  const hasIQD = Number(transaction.AmountIQD) > 0 || Number(transaction.CostIQD) > 0;
  
  if (hasUSD && hasIQD) {
    // Show both currencies
    tableRows.length = 0; // Clear and rebuild
    tableRows.push({
      notes: invoiceNotes,
      details: invoiceDetails,
      currency: "دولار",
      amount: formatMoney(transaction.AmountUSD || transaction.CostUSD, "USD"),
    });
    tableRows.push({
      notes: "",
      details: "",
      currency: "دينار",
      amount: formatMoney(transaction.AmountIQD || transaction.CostIQD, "IQD"),
    });
  }

  // Additional charges rows
  const syrCus = formatMoney(transaction.SyrCus, "IQD");
  const transPrice = formatMoney(transaction.TransPrice, "IQD");
  const feeUsd = formatMoney(transaction.FeeUSD, "USD");

  if (syrCus) {
    tableRows.push({ notes: "الكمرك السوري", details: "", currency: "دينار", amount: syrCus });
  }
  if (transPrice) {
    tableRows.push({ notes: "سعر النقل", details: "", currency: "دينار", amount: transPrice });
  }
  if (feeUsd) {
    tableRows.push({ notes: "الرسوم", details: "", currency: "دولار", amount: feeUsd });
  }

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  @page {
    size: A4;
    margin: 0;
  }

  body {
    font-family: 'Noto Sans Arabic', 'Noto Sans', 'DejaVu Sans', 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    color: #1f2937;
    background: #ffffff;
    font-size: 12px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 0;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  /* ─── Header ─── */
  .invoice-header {
    width: 100%;
    position: relative;
  }
  .invoice-header img {
    width: 100%;
    display: block;
  }

  /* ─── Title Bar ─── */
  .title-bar {
    background: ${navy};
    color: #ffffff;
    padding: 10px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .title-bar .doc-title {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
  .title-bar .doc-meta {
    display: flex;
    gap: 20px;
    font-size: 11px;
    font-weight: 600;
    direction: ltr;
    font-family: 'Inter', 'Segoe UI', sans-serif;
  }
  .title-bar .doc-meta span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .title-bar .meta-label {
    color: rgba(255,255,255,0.7);
    direction: rtl;
  }

  /* ─── Content ─── */
  .content {
    flex: 1;
    padding: 16px 24px;
  }

  /* ─── Section 1: Info Cards ─── */
  .info-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }
  .info-card {
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    text-align: center;
  }
  .info-card .card-label {
    font-size: 9px;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 4px;
  }
  .info-card .card-value {
    font-size: 13px;
    font-weight: 800;
    color: ${navy};
  }

  /* ─── Account Name ─── */
  .account-bar {
    background: #f1f5f9;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 18px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .account-bar .account-label {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
  }
  .account-bar .account-value {
    font-size: 15px;
    font-weight: 800;
    color: ${navy};
  }
  .account-bar .port-value {
    font-size: 11px;
    font-weight: 700;
    color: ${red};
  }

  /* ─── Weight/Meters Bar ─── */
  .measures-bar {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }
  .measure-chip {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 700;
    color: #1e40af;
  }
  .measure-chip .measure-label {
    color: #64748b;
    font-weight: 600;
    margin-left: 6px;
  }

  /* ─── Section 2: Main Table ─── */
  .invoice-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    border: 1.5px solid ${navy}33;
    border-radius: 8px;
    overflow: hidden;
  }
  .invoice-table thead {
    background: ${navy};
    color: #ffffff;
  }
  .invoice-table th {
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 700;
    text-align: right;
    border-left: 1px solid rgba(255,255,255,0.15);
  }
  .invoice-table th:last-child {
    border-left: none;
  }
  .invoice-table tbody tr {
    border-bottom: 1px solid #e2e8f0;
  }
  .invoice-table tbody tr:last-child {
    border-bottom: none;
  }
  .invoice-table tbody tr:nth-child(even) {
    background: #f8fafc;
  }
  .invoice-table td {
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 600;
    text-align: right;
    border-left: 1px solid #e2e8f0;
    vertical-align: top;
  }
  .invoice-table td:last-child {
    border-left: none;
  }
  .invoice-table td.amount-cell {
    font-weight: 800;
    color: ${navy};
    font-size: 13px;
    direction: ltr;
    text-align: center;
  }
  .invoice-table td.currency-cell {
    text-align: center;
    font-weight: 700;
    color: ${red};
  }

  /* ─── Signature Area ─── */
  .signature-area {
    margin-top: 24px;
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    gap: 40px;
  }
  .signature-box {
    flex: 1;
    text-align: center;
  }
  .signature-label {
    font-size: 11px;
    font-weight: 700;
    color: ${navy};
    margin-bottom: 36px;
  }
  .signature-line {
    border-top: 1.5px solid #cbd5e1;
    width: 80%;
    margin: 0 auto;
    padding-top: 4px;
    font-size: 9px;
    color: #94a3b8;
    font-weight: 600;
  }

  /* ─── Footer ─── */
  .invoice-footer {
    margin-top: auto;
    width: 100%;
  }
  .invoice-footer img {
    width: 100%;
    display: block;
  }
  .print-meta {
    text-align: center;
    padding: 6px 0;
    font-size: 9px;
    color: #64748b;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    direction: ltr;
    font-weight: 600;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
  }

  /* ─── Watermark ─── */
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    opacity: 0.03;
    z-index: 0;
    pointer-events: none;
  }
  .watermark img {
    width: 300px;
  }
</style>
</head>
<body>
<div class="page">
  ${logoBase64 ? `<div class="watermark"><img src="${logoBase64}" alt=""></div>` : ""}
  
  <!-- Header -->
  <div class="invoice-header">
    ${headerBase64 ? `<img src="${headerBase64}" alt="Header">` : `
      <div style="background:${navy};height:32px;"></div>
      <div style="padding:12px 24px;text-align:center;">
        <div style="font-size:20px;font-weight:800;color:${navy};">شركة طي الراوي للنقل والتخليص الكمركي</div>
        <div style="font-size:12px;font-weight:600;color:${red};font-family:'Inter',sans-serif;">TAY ALRAWI Transport & Customs Clearance</div>
      </div>
    `}
  </div>

  <!-- Title Bar -->
  <div class="title-bar">
    <span class="doc-title">${escapeHtml(transTypeLabel)}</span>
    <div class="doc-meta">
      <span><span class="meta-label">${escapeHtml(refLabel)}:</span> ${escapeHtml(refNo)}</span>
      <span><span class="meta-label">التاريخ:</span> ${escapeHtml(transDate)}</span>
    </div>
  </div>

  <!-- Content -->
  <div class="content">
    
    <!-- Account & Port -->
    <div class="account-bar">
      <div>
        <span class="account-label">اسم الحساب: </span>
        <span class="account-value">${escapeHtml(accountName)}</span>
      </div>
      <div class="port-value">${escapeHtml(portName)}</div>
    </div>

    <!-- Section 1: Info Cards -->
    <div class="info-cards">
      <div class="info-card">
        <div class="card-label">رقم الفاتورة</div>
        <div class="card-value">${escapeHtml(refNo)}</div>
      </div>
      <div class="info-card">
        <div class="card-label">اسم السائق</div>
        <div class="card-value">${escapeHtml(driverName)}</div>
      </div>
      <div class="info-card">
        <div class="card-label">رقم السيارة</div>
        <div class="card-value">${escapeHtml(vehiclePlate)}</div>
      </div>
      <div class="info-card">
        <div class="card-label">نوع البضاعة</div>
        <div class="card-value">${escapeHtml(goodType)}</div>
      </div>
    </div>

    <!-- Weight/Meters (only if available) -->
    ${(weight || meters || qty) ? `
    <div class="measures-bar">
      ${weight ? `<div class="measure-chip"><span class="measure-label">الوزن:</span> ${escapeHtml(weight)} طن</div>` : ""}
      ${meters ? `<div class="measure-chip"><span class="measure-label">الأمتار:</span> ${escapeHtml(meters)} م</div>` : ""}
      ${qty ? `<div class="measure-chip"><span class="measure-label">العدد:</span> ${escapeHtml(qty)}</div>` : ""}
    </div>
    ` : ""}

    <!-- Section 2: Main Invoice Table -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th style="width:30%">الملاحظات</th>
          <th style="width:30%">التفاصيل</th>
          <th style="width:15%">العملة</th>
          <th style="width:25%">المبلغ</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows.map(row => `
        <tr>
          <td>${escapeHtml(row.notes)}</td>
          <td>${escapeHtml(row.details)}</td>
          <td class="currency-cell">${escapeHtml(row.currency)}</td>
          <td class="amount-cell">${escapeHtml(row.amount)}</td>
        </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Signature Area -->
    <div class="signature-area">
      <div class="signature-box">
        <div class="signature-label">توقيع المسؤول</div>
        <div class="signature-line">Administrator Signature</div>
      </div>
      <div class="signature-box">
        <div class="signature-label">توقيع التاجر / المستلم</div>
        <div class="signature-line">Trader / Recipient Signature</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="invoice-footer">
    ${footerBase64 ? `<img src="${footerBase64}" alt="Footer">` : `
      <div style="background:${navy};padding:8px 24px;color:white;font-size:9px;display:flex;justify-content:space-between;">
        <span>tayalrawi22@gmail.com</span>
        <span>07733555666 | 07811333222</span>
      </div>
    `}
  </div>
  <div class="print-meta">Exported: ${escapeHtml(exportTimestamp)} | Invoice #${escapeHtml(refNo)} | ${escapeHtml(portName)}</div>
</div>
</body>
</html>`;

  return html;
}

/**
 * Export a single transaction as a professional PDF invoice via server-side Puppeteer
 */
export async function exportInvoiceViaServer(transaction = {}, { sectionKey, portId, authFetch } = {}) {
  const html = await generateInvoiceHtml(transaction, { sectionKey, portId });
  const refNo = transaction.RefNo || `REF-${transaction.TransID}`;
  const filename = `${refNo}.pdf`;

  try {
    // Use authFetch (raw fetch) instead of api() because PDF returns binary, not JSON
    const response = await authFetch("/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        filename,
        marginTop: "0mm",
        marginBottom: "0mm",
        marginRight: "0mm",
        marginLeft: "0mm",
      }),
    });

    if (!response.ok) {
      throw new Error(`Server PDF export failed: ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("[Invoice PDF Error]:", error);
    // Fallback: open HTML in new window for printing
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  }
}

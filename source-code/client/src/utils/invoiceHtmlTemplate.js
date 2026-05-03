/**
 * Invoice HTML Template Generator
 * 
 * Generates a professional A4 HTML invoice for server-side PDF rendering via Puppeteer.
 * Features:
 * - RTL Arabic layout with correct text rendering
 * - English dates and numbers
 * - Professional navy/red brand colors (no bright/informal colors)
 * - Sections: header, trader info, shipment details, financial, transport, notes, signature
 * - Works for both trader and admin copies
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

function formatMoney(value, currency = "USD") {
  if (value === null || value === undefined || value === "" || Number(value) === 0) return "-";
  const num = Number(value);
  if (isNaN(num)) return "-";
  if (currency === "IQD") return `${fmtIQD(num)} د.ع`;
  return `$${fmtUSD(num)}`;
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "" || Number(value) === 0) return "-";
  return fmtNum(value);
}

/**
 * Build all invoice field sections from a transaction object
 */
function buildInvoiceSections(transaction = {}, sectionKey) {
  const typeId = Number(transaction.TransTypeID || 1);
  const transTypeLabel = getTransactionTypeLabel(
    transaction.TransTypeName,
    transaction.TransTypeID,
    { sectionKey, recordType: transaction.RecordType }
  );

  const sections = [];

  // Section 1: Basic Info
  sections.push({
    title: "المعلومات الأساسية",
    titleEn: "Basic Information",
    icon: "info",
    fields: [
      { label: "اسم التاجر", labelEn: "Trader Name", value: transaction.AccountName || transaction.TraderName || "-" },
      { label: "نوع الحركة", labelEn: "Transaction Type", value: transTypeLabel },
      { label: "العملة", labelEn: "Currency", value: getCurrencyLabel(transaction.CurrencyName || transaction.Currency) },
      { label: "المنفذ", labelEn: "Port", value: transaction.PortName || transaction.PortID || "-" },
    ].filter(f => f.value && f.value !== "-"),
  });

  // Section 2: Shipment Details (only for invoices, not payments)
  if (typeId === 1) {
    const shipmentFields = [
      { label: "نوع البضاعة", labelEn: "Goods Type", value: transaction.GoodTypeName || transaction.GoodType || "" },
      { label: "الوزن", labelEn: "Weight", value: formatNumber(transaction.Weight), suffix: "طن" },
      { label: "الأمتار", labelEn: "Meters", value: formatNumber(transaction.Meters), suffix: "م" },
      { label: "الكمية", labelEn: "Quantity", value: formatNumber(transaction.Qty) },
      { label: "اسم السائق", labelEn: "Driver", value: transaction.DriverName || "" },
      { label: "رقم المركبة", labelEn: "Vehicle", value: transaction.PlateNumber || transaction.VehiclePlate || "" },
      { label: "المحافظة", labelEn: "Governorate", value: transaction.GovName || transaction.Governorate || "" },
      { label: "الشركة", labelEn: "Company", value: transaction.CompanyName || "" },
    ].filter(f => f.value && f.value !== "-" && f.value !== "");

    if (shipmentFields.length > 0) {
      sections.push({
        title: "تفاصيل الشحنة",
        titleEn: "Shipment Details",
        icon: "truck",
        fields: shipmentFields,
      });
    }
  }

  // Section 3: Financial Details
  const financialFields = [];
  
  if (typeId === 1) {
    // Invoice: show cost and amount
    financialFields.push(
      { label: "التكلفة بالدولار", labelEn: "Cost (USD)", value: formatMoney(transaction.CostUSD, "USD"), highlight: false },
      { label: "المبلغ بالدولار", labelEn: "Amount (USD)", value: formatMoney(transaction.AmountUSD, "USD"), highlight: true },
      { label: "التكلفة بالدينار", labelEn: "Cost (IQD)", value: formatMoney(transaction.CostIQD, "IQD"), highlight: false },
      { label: "المبلغ بالدينار", labelEn: "Amount (IQD)", value: formatMoney(transaction.AmountIQD, "IQD"), highlight: true },
    );
  } else {
    // Payment/Debit: show amounts only
    financialFields.push(
      { label: "المبلغ بالدولار", labelEn: "Amount (USD)", value: formatMoney(transaction.AmountUSD, "USD"), highlight: true },
      { label: "المبلغ بالدينار", labelEn: "Amount (IQD)", value: formatMoney(transaction.AmountIQD, "IQD"), highlight: true },
    );
  }

  const activeFinancialFields = financialFields.filter(f => f.value && f.value !== "-");
  if (activeFinancialFields.length > 0) {
    sections.push({
      title: "التفاصيل المالية",
      titleEn: "Financial Details",
      icon: "money",
      fields: activeFinancialFields,
    });
  }

  // Section 4: Additional Charges (fees, customs, transport)
  if (typeId === 1) {
    const chargeFields = [
      { label: "الرسوم بالدولار", labelEn: "Fee (USD)", value: formatMoney(transaction.FeeUSD, "USD") },
      { label: "الجمارك السورية", labelEn: "Syrian Customs", value: formatMoney(transaction.SyrCus, "IQD") },
      { label: "عدد السيارات", labelEn: "Car Qty", value: formatNumber(transaction.CarQty) },
      { label: "سعر النقل", labelEn: "Transport Price", value: formatMoney(transaction.TransPrice, "IQD") },
      { label: "الناقل", labelEn: "Carrier", value: transaction.CarrierName || "" },
    ].filter(f => f.value && f.value !== "-" && f.value !== "");

    if (chargeFields.length > 0) {
      sections.push({
        title: "الرسوم والنقل",
        titleEn: "Fees & Transport",
        icon: "fees",
        fields: chargeFields,
      });
    }
  }

  // Section 5: Profit (admin only, for invoices)
  if (typeId === 1 && (transaction.ProfitUSD || transaction.ProfitIQD)) {
    const profitFields = [
      { label: "الربح بالدولار", labelEn: "Profit (USD)", value: formatMoney(transaction.ProfitUSD, "USD"), highlight: true },
      { label: "الربح بالدينار", labelEn: "Profit (IQD)", value: formatMoney(transaction.ProfitIQD, "IQD"), highlight: true },
    ].filter(f => f.value && f.value !== "-");

    if (profitFields.length > 0) {
      sections.push({
        title: "الأرباح",
        titleEn: "Profit",
        icon: "profit",
        fields: profitFields,
      });
    }
  }

  // Section 6: Notes
  const noteFields = [
    { label: "ملاحظة التاجر", labelEn: "Trader Note", value: transaction.TraderNote || "" },
    { label: "ملاحظات عامة", labelEn: "General Notes", value: transaction.Notes || "" },
  ].filter(f => f.value && f.value !== "-" && f.value !== "");

  if (noteFields.length > 0) {
    sections.push({
      title: "الملاحظات",
      titleEn: "Notes",
      icon: "notes",
      fields: noteFields,
      isNotes: true,
    });
  }

  // Section 7: Custom Fields
  const customFieldEntries = Object.entries(transaction.CustomFieldValues || {});
  if (customFieldEntries.length > 0) {
    const customFields = customFieldEntries
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([key, value]) => ({
        label: key,
        labelEn: key,
        value: typeof value === "number" ? fmtNum(value) : String(value),
      }));

    if (customFields.length > 0) {
      sections.push({
        title: "حقول إضافية",
        titleEn: "Custom Fields",
        icon: "custom",
        fields: customFields,
      });
    }
  }

  return sections;
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
 * Generate the full invoice HTML string
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
  const printDate = formatEnglishLongDate(new Date());
  const sections = buildInvoiceSections(transaction, sectionKey);

  const navy = TAY_ALRAWI_BRAND_COLORS.headerNavy;
  const red = TAY_ALRAWI_BRAND_COLORS.accentRed;

  const renderFieldCell = (field) => {
    const val = escapeHtml(field.value);
    const suffix = field.suffix ? ` <span class="suffix">${escapeHtml(field.suffix)}</span>` : "";
    const highlightClass = field.highlight ? ' class="highlight"' : '';
    return `
      <div class="field-cell">
        <div class="field-label">${escapeHtml(field.label)}</div>
        <div class="field-value"${highlightClass}><span dir="ltr">${val}</span>${suffix}</div>
      </div>
    `;
  };

  const renderNoteField = (field) => `
    <div class="note-block">
      <div class="note-label">${escapeHtml(field.label)}</div>
      <div class="note-value">${escapeHtml(field.value)}</div>
    </div>
  `;

  const renderSection = (section) => {
    const iconClass = section.icon || "info";
    const fieldsHtml = section.isNotes
      ? section.fields.map(renderNoteField).join("")
      : `<div class="fields-grid">${section.fields.map(renderFieldCell).join("")}</div>`;

    return `
      <div class="invoice-section section-${iconClass}">
        <div class="section-header">
          <span class="section-title">${escapeHtml(section.title)}</span>
          <span class="section-title-en">${escapeHtml(section.titleEn)}</span>
        </div>
        <div class="section-body">
          ${fieldsHtml}
        </div>
      </div>
    `;
  };

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  @page {
    size: A4;
    margin: 0;
  }

  body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
    direction: rtl;
    color: #1f2937;
    background: #ffffff;
    font-size: 11px;
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
    gap: 24px;
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
    font-family: 'Cairo', sans-serif;
    direction: rtl;
  }

  /* ─── Content ─── */
  .content {
    flex: 1;
    padding: 12px 20px;
  }

  /* ─── Section ─── */
  .invoice-section {
    margin-bottom: 10px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }
  .section-header {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 7px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .section-title {
    font-size: 12px;
    font-weight: 800;
    color: ${navy};
  }
  .section-title-en {
    font-size: 9px;
    font-weight: 600;
    color: #94a3b8;
    font-family: 'Inter', sans-serif;
    direction: ltr;
  }
  .section-body {
    padding: 10px 14px;
  }

  /* Section color accents */
  .section-money .section-header { border-bottom-color: ${red}22; background: #fef7f7; }
  .section-money .section-title { color: ${red}; }
  .section-fees .section-header { border-bottom-color: #f59e0b22; background: #fffbeb; }
  .section-fees .section-title { color: #b45309; }
  .section-profit .section-header { border-bottom-color: #10b98122; background: #f0fdf4; }
  .section-profit .section-title { color: #047857; }
  .section-notes .section-header { border-bottom-color: #6366f122; background: #f5f3ff; }
  .section-notes .section-title { color: #4338ca; }

  /* ─── Fields Grid ─── */
  .fields-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .field-cell {
    background: #f8fafc;
    border: 1px solid #e8ecf1;
    border-radius: 6px;
    padding: 7px 12px;
    min-height: 44px;
  }
  .field-label {
    font-size: 9px;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 2px;
  }
  .field-value {
    font-size: 13px;
    font-weight: 700;
    color: ${navy};
    direction: ltr;
    text-align: right;
  }
  .field-value.highlight {
    color: ${red};
    font-size: 14px;
    font-weight: 800;
  }
  .field-value .suffix {
    font-size: 9px;
    color: #94a3b8;
    font-weight: 600;
  }

  /* ─── Notes ─── */
  .note-block {
    background: #f8fafc;
    border: 1px solid #e8ecf1;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 6px;
  }
  .note-block:last-child { margin-bottom: 0; }
  .note-label {
    font-size: 9px;
    font-weight: 700;
    color: #4338ca;
    margin-bottom: 3px;
  }
  .note-value {
    font-size: 11px;
    font-weight: 600;
    color: #374151;
    line-height: 1.6;
    direction: rtl;
  }

  /* ─── Signature Area ─── */
  .signature-area {
    margin-top: 16px;
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
    padding: 4px 0;
    font-size: 8px;
    color: #94a3b8;
    font-family: 'Inter', sans-serif;
    direction: ltr;
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
    ${sections.map(renderSection).join("")}

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
  <div class="print-meta">Printed on ${escapeHtml(printDate)} | Invoice #${escapeHtml(refNo)}</div>
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

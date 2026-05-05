/**
 * Invoice HTML Template Generator (v3 - Server-Side Rendering)
 * 
 * The heavy lifting (image loading, HTML generation, PDF rendering) is now done server-side.
 * The client only sends the transaction data and sectionKey.
 * 
 * Legacy generateInvoiceHtml is kept for fallback/preview purposes only.
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

function getSmartCurrencyLabel(transaction) {
  const curr = (transaction.CurrencyName || transaction.Currency || "").toUpperCase();
  if (curr.includes("IQD") || curr.includes("دينار")) return "دينار";
  if (curr.includes("USD") || curr.includes("دولار")) return "دولار";
  if (Number(transaction.AmountIQD) > 0 && !Number(transaction.AmountUSD)) return "دينار";
  if (Number(transaction.AmountUSD) > 0 && !Number(transaction.AmountIQD)) return "دولار";
  return "دولار";
}

function getSmartAmount(transaction) {
  const curr = getSmartCurrencyLabel(transaction);
  if (curr === "دينار") {
    return formatMoney(transaction.AmountIQD, "IQD") || formatMoney(transaction.CostIQD, "IQD") || "-";
  }
  return formatMoney(transaction.AmountUSD, "USD") || formatMoney(transaction.CostUSD, "USD") || "-";
}

/**
 * Export a single transaction as a professional PDF invoice via server-side rendering.
 * 
 * NEW (v3): Sends only transaction data + sectionKey to the server.
 * The server handles image loading, HTML generation, and PDF rendering.
 * This eliminates Base64 image transfer from client (~500KB+ per request saved).
 */
export async function exportInvoiceViaServer(transaction = {}, { sectionKey, portId, authFetch } = {}) {
  const refNo = transaction.RefNo || `REF-${transaction.TransID}`;
  const filename = `${refNo}.pdf`;

  // Resolve port name client-side (since server doesn't have sectionConfig)
  const portName = resolvePortDisplayName(sectionKey, transaction);
  const transTypeLabel = getTransactionTypeLabel(
    transaction.TransTypeName,
    transaction.TransTypeID,
    { sectionKey, recordType: transaction.RecordType }
  );

  // Enrich transaction with resolved display names before sending to server
  const enrichedTransaction = {
    ...transaction,
    PortName: portName,
    TransTypeName: transTypeLabel,
  };

  try {
    // Use the new server-side endpoint (no Base64 images sent!)
    const response = await authFetch("/export/invoice-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction: enrichedTransaction,
        sectionKey,
        filename,
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
    // Fallback: use legacy method with client-side HTML generation
    try {
      const html = await generateInvoiceHtmlLegacy(transaction, { sectionKey, portId });
      const fallbackResponse = await authFetch("/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, filename, marginTop: "0mm", marginBottom: "0mm", marginRight: "0mm", marginLeft: "0mm" }),
      });
      if (fallbackResponse.ok) {
        const blob = await fallbackResponse.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error("Fallback also failed");
      }
    } catch (fallbackErr) {
      console.error("[Invoice PDF Fallback Error]:", fallbackErr);
      // Last resort: open print dialog
      const html = await generateInvoiceHtmlLegacy(transaction, { sectionKey, portId });
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 500);
      }
    }
  }
}

/**
 * Legacy HTML generation (kept for fallback only)
 * Uses client-side Base64 image conversion
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

async function generateInvoiceHtmlLegacy(transaction = {}, { sectionKey, portId } = {}) {
  const brand = resolveBrandAssets({ sectionKey });
  const [headerBase64, footerBase64, logoBase64] = await Promise.all([
    imageToBase64(brand.header),
    imageToBase64(brand.invoiceFooter),
    imageToBase64(brand.logoOnWhite),
  ]);

  const transTypeLabel = getTransactionTypeLabel(
    transaction.TransTypeName,
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

  const driverName = transaction.DriverName || "-";
  const vehiclePlate = transaction.PlateNumber || transaction.VehiclePlate || "-";
  const goodType = transaction.GoodTypeName || transaction.GoodType || "-";
  const accountName = transaction.AccountName || transaction.TraderName || "-";

  const weight = formatNumber(transaction.Weight);
  const meters = formatNumber(transaction.Meters);
  const qty = formatNumber(transaction.Qty);

  const invoiceNotes = transaction.InvoiceNotes || "";
  const invoiceDetails = transaction.InvoiceDetails || "";

  const tableRows = [];
  const hasUSD = Number(transaction.AmountUSD) > 0 || Number(transaction.CostUSD) > 0;
  const hasIQD = Number(transaction.AmountIQD) > 0 || Number(transaction.CostIQD) > 0;

  if (hasUSD && hasIQD) {
    tableRows.push({ notes: invoiceNotes, details: invoiceDetails, currency: "دولار", amount: formatMoney(transaction.AmountUSD || transaction.CostUSD, "USD") });
    tableRows.push({ notes: "", details: "", currency: "دينار", amount: formatMoney(transaction.AmountIQD || transaction.CostIQD, "IQD") });
  } else {
    tableRows.push({ notes: invoiceNotes, details: invoiceDetails, currency: smartCurrency, amount: smartAmount });
  }

  if (formatMoney(transaction.SyrCus, "IQD")) {
    tableRows.push({ notes: "الكمرك السوري", details: "", currency: "دينار", amount: formatMoney(transaction.SyrCus, "IQD") });
  }
  if (formatMoney(transaction.TransPrice, "IQD")) {
    tableRows.push({ notes: "سعر النقل", details: "", currency: "دينار", amount: formatMoney(transaction.TransPrice, "IQD") });
  }
  if (formatMoney(transaction.FeeUSD, "USD")) {
    tableRows.push({ notes: "الرسوم", details: "", currency: "دولار", amount: formatMoney(transaction.FeeUSD, "USD") });
  }

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  body { font-family: 'Noto Sans Arabic', 'Noto Sans', 'DejaVu Sans', 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; color: #1f2937; background: #ffffff; font-size: 12px; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; min-height: 297mm; padding: 0; position: relative; display: flex; flex-direction: column; }
  .invoice-header { width: 100%; } .invoice-header img { width: 100%; display: block; }
  .title-bar { background: ${navy}; color: #fff; padding: 10px 24px; display: flex; justify-content: space-between; align-items: center; }
  .title-bar .doc-title { font-size: 18px; font-weight: 800; }
  .title-bar .doc-meta { display: flex; gap: 20px; font-size: 11px; font-weight: 600; direction: ltr; }
  .title-bar .meta-label { color: rgba(255,255,255,0.7); direction: rtl; }
  .content { flex: 1; padding: 16px 24px; }
  .info-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
  .info-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; text-align: center; }
  .info-card .card-label { font-size: 9px; font-weight: 700; color: #64748b; margin-bottom: 4px; }
  .info-card .card-value { font-size: 13px; font-weight: 800; color: ${navy}; }
  .account-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #f1f5f9; border-radius: 8px; margin-bottom: 12px; border-right: 4px solid ${red}; }
  .account-label { font-size: 11px; color: #64748b; font-weight: 600; }
  .account-value { font-size: 14px; font-weight: 800; color: ${navy}; margin-right: 4px; }
  .port-value { font-size: 11px; font-weight: 700; color: ${red}; background: rgba(227,30,36,0.08); padding: 4px 12px; border-radius: 6px; }
  .measures-bar { display: flex; gap: 12px; margin-bottom: 12px; }
  .measure-chip { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #4338ca; }
  .invoice-table { width: 100%; border-collapse: collapse; margin-top: 8px; border: 1.5px solid #e2e8f0; }
  .invoice-table thead { background: ${navy}; }
  .invoice-table th { color: #fff; font-size: 11px; font-weight: 700; padding: 10px 14px; text-align: center; }
  .invoice-table td { padding: 10px 14px; text-align: center; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
  .invoice-table .amount-cell { font-weight: 800; color: ${navy}; font-size: 13px; direction: ltr; }
  .invoice-table .currency-cell { font-weight: 700; color: ${red}; font-size: 11px; }
  .signature-area { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px; }
  .signature-box { text-align: center; width: 200px; }
  .signature-label { font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 30px; }
  .signature-line { border-top: 1.5px solid #cbd5e1; padding-top: 6px; font-size: 9px; color: #94a3b8; }
  .invoice-footer { margin-top: auto; } .invoice-footer img { width: 100%; display: block; }
  .print-meta { position: absolute; bottom: 4px; left: 8px; font-size: 7px; color: #94a3b8; direction: ltr; }
  .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.04; z-index: 0; pointer-events: none; }
  .watermark img { width: 300px; }
</style>
</head>
<body>
<div class="page">
  ${logoBase64 ? `<div class="watermark"><img src="${logoBase64}" alt=""></div>` : ""}
  <div class="invoice-header">
    ${headerBase64 ? `<img src="${headerBase64}" alt="Header">` : `<div style="background:${navy};height:32px;"></div><div style="padding:12px 24px;text-align:center;"><div style="font-size:20px;font-weight:800;color:${navy};">شركة طي الراوي للنقل والتخليص الكمركي</div><div style="font-size:12px;font-weight:600;color:${red};">TAY ALRAWI Transport & Customs Clearance</div></div>`}
  </div>
  <div class="title-bar">
    <span class="doc-title">${escapeHtml(transTypeLabel)}</span>
    <div class="doc-meta">
      <span><span class="meta-label">رقم الوصل:</span> ${escapeHtml(refNo)}</span>
      <span><span class="meta-label">التاريخ:</span> ${escapeHtml(transDate)}</span>
    </div>
  </div>
  <div class="content">
    <div class="account-bar"><div><span class="account-label">اسم الحساب: </span><span class="account-value">${escapeHtml(accountName)}</span></div><div class="port-value">${escapeHtml(portName)}</div></div>
    <div class="info-cards">
      <div class="info-card"><div class="card-label">رقم الفاتورة</div><div class="card-value">${escapeHtml(refNo)}</div></div>
      <div class="info-card"><div class="card-label">اسم السائق</div><div class="card-value">${escapeHtml(driverName)}</div></div>
      <div class="info-card"><div class="card-label">رقم السيارة</div><div class="card-value">${escapeHtml(vehiclePlate)}</div></div>
      <div class="info-card"><div class="card-label">نوع البضاعة</div><div class="card-value">${escapeHtml(goodType)}</div></div>
    </div>
    ${(weight || meters || qty) ? `<div class="measures-bar">${weight ? `<div class="measure-chip"><span class="measure-label">الوزن:</span> ${escapeHtml(weight)} طن</div>` : ""}${meters ? `<div class="measure-chip"><span class="measure-label">الأمتار:</span> ${escapeHtml(meters)} م</div>` : ""}${qty ? `<div class="measure-chip"><span class="measure-label">العدد:</span> ${escapeHtml(qty)}</div>` : ""}</div>` : ""}
    <table class="invoice-table">
      <thead><tr><th style="width:30%">الملاحظات</th><th style="width:30%">التفاصيل</th><th style="width:15%">العملة</th><th style="width:25%">المبلغ</th></tr></thead>
      <tbody>${tableRows.map(row => `<tr><td>${escapeHtml(row.notes)}</td><td>${escapeHtml(row.details)}</td><td class="currency-cell">${escapeHtml(row.currency)}</td><td class="amount-cell">${escapeHtml(row.amount)}</td></tr>`).join("")}</tbody>
    </table>
    <div class="signature-area"><div class="signature-box"><div class="signature-label">توقيع المسؤول</div><div class="signature-line">Administrator Signature</div></div><div class="signature-box"><div class="signature-label">توقيع التاجر / المستلم</div><div class="signature-line">Trader / Recipient Signature</div></div></div>
  </div>
  <div class="invoice-footer">${footerBase64 ? `<img src="${footerBase64}" alt="Footer">` : `<div style="background:${navy};padding:8px 24px;color:white;font-size:9px;display:flex;justify-content:space-between;"><span>tayalrawi22@gmail.com</span><span>07733555666 | 07811333222</span></div>`}</div>
  <div class="print-meta">Exported: ${escapeHtml(exportTimestamp)} | Invoice #${escapeHtml(refNo)} | ${escapeHtml(portName)}</div>
</div>
</body>
</html>`;
}

// Keep legacy export for backward compatibility
export { generateInvoiceHtmlLegacy as generateInvoiceHtml };

import { Router, Request, Response } from "express";
import puppeteer, { Browser } from "puppeteer";
import { extractBearerToken, verifyToken, loadAuthenticatedAppUser } from "../../_core/appAuth";
import { loadAuthenticatedMerchantUser } from "../merchant/merchantAuth";
import { respondRouteError } from "../../_core/routeResponses";
import * as fs from "fs";
import * as path from "path";

/* ─── Browser Pool (reuse browser instance) ─── */
let browserInstance: Browser | null = null;
let browserLastUsed = 0;
const BROWSER_IDLE_TIMEOUT = 60_000; // Close after 60s idle

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    browserLastUsed = Date.now();
    return browserInstance;
  }
  browserInstance = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  browserLastUsed = Date.now();

  // Auto-close after idle timeout
  const checkIdle = setInterval(async () => {
    if (Date.now() - browserLastUsed > BROWSER_IDLE_TIMEOUT && browserInstance) {
      try {
        await browserInstance.close();
      } catch {}
      browserInstance = null;
      clearInterval(checkIdle);
    }
  }, 15_000);

  return browserInstance;
}

/* ─── Image to Base64 (server-side, reads from local filesystem) ─── */
const TEMPLATES_DIR = path.resolve(process.cwd(), "dist/public/templates");

function imageFileToBase64(filename: string): string {
  try {
    const filePath = path.join(TEMPLATES_DIR, filename);
    if (!fs.existsSync(filePath)) return "";
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return "";
  }
}

/* ─── Brand Assets Resolution (server-side mirror of client logic) ─── */
interface BrandAssets {
  headerBase64: string;
  footerBase64: string;
  logoBase64: string;
}

function resolveServerBrandAssets(sectionKey?: string): BrandAssets {
  const isLouay = sectionKey === "special-partner" || sectionKey === "partnership-yaser" || sectionKey === "port-3";
  const prefix = isLouay ? "louayalrawi" : "tayalrawi";

  return {
    headerBase64: imageFileToBase64(`${prefix}-full-header.png`),
    footerBase64: imageFileToBase64(`${prefix}-invoice-footer.png`),
    logoBase64: imageFileToBase64(`${prefix}-logo-white-bg.png`),
  };
}

/* ─── Auth Middleware ─── */
async function multiAuthMiddleware(req: Request, res: Response, next: any) {
  try {
    const token = extractBearerToken(req.headers.authorization as string);
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = await verifyToken(token);
    if (!payload) return res.status(401).json({ error: "Session expired" });

    if (payload.role === "merchant") {
      const user = await loadAuthenticatedMerchantUser(payload.userId);
      if (!user) return res.status(401).json({ error: "Inactive user" });
    } else {
      const user = await loadAuthenticatedAppUser(payload.userId);
      if (!user) return res.status(401).json({ error: "Inactive user" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Session expired" });
  }
}

export function registerPdfExportRoutes(router: Router) {
  console.log("Registering PDF Export Route");

  /* ─── Legacy endpoint: receives full HTML from client ─── */
  router.post(
    "/export/pdf",
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { html, filename, headerTemplate, footerTemplate, marginTop, marginBottom, marginRight, marginLeft, landscape } = req.body;

        if (!html) {
          return res.status(400).json({ error: "Missing HTML content" });
        }

        const browser = await getBrowser();
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15000 });

        const useHeaderFooter = !!(headerTemplate || footerTemplate);

        const pdfBuffer = await page.pdf({
          format: "A4",
          landscape: landscape === true || landscape === "true",
          printBackground: true,
          displayHeaderFooter: useHeaderFooter,
          headerTemplate: headerTemplate || "<span></span>",
          footerTemplate: footerTemplate || "<span></span>",
          margin: {
            top: marginTop || (useHeaderFooter ? "26mm" : "10mm"),
            right: marginRight || "8mm",
            bottom: marginBottom || (useHeaderFooter ? "24mm" : "10mm"),
            left: marginLeft || "8mm",
          },
          timeout: 30000
        });

        await page.close();

        const finalBuffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
        const safeFilename = encodeURIComponent(filename || "export.pdf");
        res.set({
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename*=UTF-8''${safeFilename}`,
          "Content-Length": finalBuffer.length,
        });

        return res.end(finalBuffer);
      } catch (error) {
        console.error("[PDF Export Error]:", error);
        return respondRouteError(res, error);
      }
    }
  );

  /* ─── New endpoint: server-side invoice generation (no Base64 from client) ─── */
  router.post(
    "/export/invoice-pdf",
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const { transaction, sectionKey, filename } = req.body;

        if (!transaction) {
          return res.status(400).json({ error: "Missing transaction data" });
        }

        // Resolve brand assets from server filesystem (no client Base64!)
        const brand = resolveServerBrandAssets(sectionKey);

        // Build HTML on server
        const html = buildInvoiceHtml(transaction, sectionKey, brand);

        const browser = await getBrowser();
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15000 });

        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          displayHeaderFooter: false,
          margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
          timeout: 30000,
        });

        await page.close();

        const finalBuffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
        const safeFilename = encodeURIComponent(filename || "invoice.pdf");
        res.set({
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename*=UTF-8''${safeFilename}`,
          "Content-Length": finalBuffer.length,
        });

        return res.end(finalBuffer);
      } catch (error) {
        console.error("[Invoice PDF Error]:", error);
        return respondRouteError(res, error);
      }
    }
  );
}

/* ─── Server-side Invoice HTML Builder ─── */
function escapeHtml(unsafe: any): string {
  if (unsafe == null) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateEnglish(value: any): string {
  if (!value) return "-";
  const dateStr = String(value).split("T")[0].split(" ")[0];
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  } catch { return dateStr; }
}

function formatFullTimestamp(): string {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const time = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(now);
  return `${date} ${time}`;
}

function fmtNum(val: any): string {
  const n = Number(val);
  if (isNaN(n)) return "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatMoney(value: any, currency: string = "USD"): string {
  if (value === null || value === undefined || value === "" || Number(value) === 0) return "";
  const num = Number(value);
  if (isNaN(num)) return "";
  if (currency === "IQD") return `${fmtNum(num)} د.ع`;
  return `$${fmtNum(num)}`;
}

function getSmartCurrencyLabel(transaction: any): string {
  const curr = (transaction.CurrencyName || transaction.Currency || "").toUpperCase();
  if (curr.includes("IQD") || curr.includes("دينار")) return "دينار";
  if (curr.includes("USD") || curr.includes("دولار")) return "دولار";
  if (Number(transaction.AmountIQD) > 0 && !Number(transaction.AmountUSD)) return "دينار";
  if (Number(transaction.AmountUSD) > 0 && !Number(transaction.AmountIQD)) return "دولار";
  return "دولار";
}

function getSmartAmount(transaction: any): string {
  const curr = getSmartCurrencyLabel(transaction);
  if (curr === "دينار") {
    return formatMoney(transaction.AmountIQD, "IQD") || formatMoney(transaction.CostIQD, "IQD") || "-";
  }
  return formatMoney(transaction.AmountUSD, "USD") || formatMoney(transaction.CostUSD, "USD") || "-";
}

function buildInvoiceHtml(transaction: any, sectionKey: string | undefined, brand: BrandAssets): string {
  const navy = "#1c2b59";
  const red = "#e31e24";

  const refNo = transaction.RefNo || `REF-${transaction.TransID}`;
  const transDate = formatDateEnglish(transaction.TransDate);
  const exportTimestamp = formatFullTimestamp();
  const portName = transaction.PortName || sectionKey || "-";
  const transTypeLabel = transaction.TransTypeName || "فاتورة";
  const smartCurrency = getSmartCurrencyLabel(transaction);
  const smartAmount = getSmartAmount(transaction);

  const driverName = transaction.DriverName || "-";
  const vehiclePlate = transaction.PlateNumber || transaction.VehiclePlate || "-";
  const goodType = transaction.GoodTypeName || transaction.GoodType || "-";
  const accountName = transaction.AccountName || transaction.TraderName || "-";

  const weight = Number(transaction.Weight) > 0 ? fmtNum(transaction.Weight) : "";
  const meters = Number(transaction.Meters) > 0 ? fmtNum(transaction.Meters) : "";
  const qty = Number(transaction.Qty) > 0 ? fmtNum(transaction.Qty) : "";

  const invoiceNotes = transaction.InvoiceNotes || "";
  const invoiceDetails = transaction.InvoiceDetails || "";

  // Build table rows
  const tableRows: { notes: string; details: string; currency: string; amount: string }[] = [];
  const hasUSD = Number(transaction.AmountUSD) > 0 || Number(transaction.CostUSD) > 0;
  const hasIQD = Number(transaction.AmountIQD) > 0 || Number(transaction.CostIQD) > 0;

  if (hasUSD && hasIQD) {
    tableRows.push({ notes: invoiceNotes, details: invoiceDetails, currency: "دولار", amount: formatMoney(transaction.AmountUSD || transaction.CostUSD, "USD") });
    tableRows.push({ notes: "", details: "", currency: "دينار", amount: formatMoney(transaction.AmountIQD || transaction.CostIQD, "IQD") });
  } else {
    tableRows.push({ notes: invoiceNotes, details: invoiceDetails, currency: smartCurrency, amount: smartAmount });
  }

  // Additional charges
  if (Number(transaction.SyrCus) > 0) {
    tableRows.push({ notes: "الكمرك السوري", details: "", currency: "دينار", amount: formatMoney(transaction.SyrCus, "IQD") });
  }
  if (Number(transaction.TransPrice) > 0) {
    tableRows.push({ notes: "سعر النقل", details: "", currency: "دينار", amount: formatMoney(transaction.TransPrice, "IQD") });
  }
  if (Number(transaction.FeeUSD) > 0) {
    tableRows.push({ notes: "الرسوم", details: "", currency: "دولار", amount: formatMoney(transaction.FeeUSD, "USD") });
  }

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  body {
    font-family: 'Noto Sans Arabic', 'Noto Sans', 'DejaVu Sans', 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl; color: #1f2937; background: #ffffff;
    font-size: 12px; line-height: 1.5;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page { width: 210mm; min-height: 297mm; padding: 0; position: relative; display: flex; flex-direction: column; }
  .invoice-header { width: 100%; position: relative; }
  .invoice-header img { width: 100%; display: block; }
  .title-bar { background: ${navy}; color: #ffffff; padding: 10px 24px; display: flex; justify-content: space-between; align-items: center; }
  .title-bar .doc-title { font-size: 18px; font-weight: 800; letter-spacing: 0.5px; }
  .title-bar .doc-meta { display: flex; gap: 20px; font-size: 11px; font-weight: 600; direction: ltr; font-family: 'Inter', 'Segoe UI', sans-serif; }
  .title-bar .doc-meta span { display: flex; align-items: center; gap: 6px; }
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
  .measure-label { color: #6366f1; font-weight: 600; }
  .invoice-table { width: 100%; border-collapse: collapse; margin-top: 8px; border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .invoice-table thead { background: ${navy}; }
  .invoice-table th { color: #ffffff; font-size: 11px; font-weight: 700; padding: 10px 14px; text-align: center; }
  .invoice-table td { padding: 10px 14px; text-align: center; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
  .invoice-table tbody tr:nth-child(even) { background: #f9fafb; }
  .invoice-table .amount-cell { font-weight: 800; color: ${navy}; font-size: 13px; direction: ltr; font-family: 'Inter', 'Segoe UI', monospace; }
  .invoice-table .currency-cell { font-weight: 700; color: ${red}; font-size: 11px; }
  .signature-area { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px; }
  .signature-box { text-align: center; width: 200px; }
  .signature-label { font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 30px; }
  .signature-line { border-top: 1.5px solid #cbd5e1; padding-top: 6px; font-size: 9px; color: #94a3b8; }
  .invoice-footer { margin-top: auto; width: 100%; }
  .invoice-footer img { width: 100%; display: block; }
  .print-meta { position: absolute; bottom: 4px; left: 8px; font-size: 7px; color: #94a3b8; direction: ltr; font-family: 'Inter', monospace; }
  .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.04; z-index: 0; pointer-events: none; }
  .watermark img { width: 300px; }
</style>
</head>
<body>
<div class="page">
  ${brand.logoBase64 ? `<div class="watermark"><img src="${brand.logoBase64}" alt=""></div>` : ""}
  
  <div class="invoice-header">
    ${brand.headerBase64 ? `<img src="${brand.headerBase64}" alt="Header">` : `
      <div style="background:${navy};height:32px;"></div>
      <div style="padding:12px 24px;text-align:center;">
        <div style="font-size:20px;font-weight:800;color:${navy};">شركة طي الراوي للنقل والتخليص الكمركي</div>
        <div style="font-size:12px;font-weight:600;color:${red};font-family:'Inter',sans-serif;">TAY ALRAWI Transport & Customs Clearance</div>
      </div>
    `}
  </div>

  <div class="title-bar">
    <span class="doc-title">${escapeHtml(transTypeLabel)}</span>
    <div class="doc-meta">
      <span><span class="meta-label">رقم الوصل:</span> ${escapeHtml(refNo)}</span>
      <span><span class="meta-label">التاريخ:</span> ${escapeHtml(transDate)}</span>
    </div>
  </div>

  <div class="content">
    <div class="account-bar">
      <div>
        <span class="account-label">اسم الحساب: </span>
        <span class="account-value">${escapeHtml(accountName)}</span>
      </div>
      <div class="port-value">${escapeHtml(portName)}</div>
    </div>

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

    ${(weight || meters || qty) ? `
    <div class="measures-bar">
      ${weight ? `<div class="measure-chip"><span class="measure-label">الوزن:</span> ${escapeHtml(weight)} طن</div>` : ""}
      ${meters ? `<div class="measure-chip"><span class="measure-label">الأمتار:</span> ${escapeHtml(meters)} م</div>` : ""}
      ${qty ? `<div class="measure-chip"><span class="measure-label">العدد:</span> ${escapeHtml(qty)}</div>` : ""}
    </div>
    ` : ""}

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

  <div class="invoice-footer">
    ${brand.footerBase64 ? `<img src="${brand.footerBase64}" alt="Footer">` : `
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
}

import { fmtNum, fmtUSD, fmtIQD } from "./formatNumber";
/**
 * Escapes HTML to prevent XSS and formatting issues
 */
function escapeHtml(unsafe) {
  if (unsafe == null) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generates the HTML string required for the server-side PDF generator (Puppeteer).
 * Branding (header, footer, watermark) is extracted from the existing Canvas assets
 * as base64 data URIs — nothing is invented or added beyond what exists in Canvas.
 */
export async function exportToServerPdf(spec, rows, columns, options = {}) {
  const title = spec.title || "تقرير";
  const filename = spec.filename || options.filename;

  const theadHtml = `
      <tr>
        ${columns
          .map(
            (col) => `
            <th>${escapeHtml(col.header || col.label)}</th>
          `
          )
          .join("")}
      </tr>
  `;

  // ─── Table Body ───
  let tbodyHtml = `<tbody>`;
  
  rows.forEach((row, i) => {
    const transTypeId = Number(row?.TransTypeID || row?.transTypeId || 0);
    const direction = String(row?.Direction || row?.direction || "").toUpperCase();
    const rt = String(row?.RecordType || row?.recordType || "").toLowerCase();
    const tn = String(row?.TransTypeName || row?.transTypeName || "").toLowerCase();
    
    let isPayment = false;
    if (transTypeId === 2 || direction === "OUT" || direction === "CR" || rt === "payment" || tn.includes("قبض") || tn.includes("دفع")) {
      isPayment = true;
    }

    const bg = isPayment ? "#fef2f2" : (i % 2 === 0 ? "#FFFFFF" : "#F9FAFB");
    const textColor = isPayment ? "#b91c1c" : "#1f2937";

    tbodyHtml += `
      <tr style="background-color: ${bg};">
        ${columns
          .map(
            (col) => {
              let val = typeof col.getValue === "function" 
                ? col.getValue(row) 
                : row[col.accessorKey || col.key];
              
              let formattedVal = escapeHtml(val ?? "-");
              
              if (val !== undefined && val !== null && val !== "") {
                if (col.format === "money_usd" || col.format === "money") {
                  const num = Number(val);
                  formattedVal = num < 0 
                    ? `<span dir="ltr" style="display:inline-block; white-space:nowrap;">-$${Math.abs(num).toLocaleString("en-US")}</span>`
                    : `<span dir="ltr" style="display:inline-block; white-space:nowrap;">$${fmtNum(num)}</span>`;
                } else if (col.format === "money_iqd" || col.format === "number" || col.format === "currency") {
                  if (!isNaN(Number(val))) {
                    const num = Number(val);
                    formattedVal = num < 0
                      ? `<span dir="ltr" style="display:inline-block; white-space:nowrap;">-${Math.abs(num).toLocaleString("en-US")}</span>`
                      : `<span dir="ltr" style="display:inline-block; white-space:nowrap;">${fmtNum(num)}</span>`;
                  }
                } else if (col.format === "date") {
                  formattedVal = `<span dir="ltr" style="display:inline-block; white-space:nowrap;">${escapeHtml(String(val).split("T")[0].split(" ")[0])}</span>`;
                }
              }

              return `
              <td style="color: ${textColor};">
                ${formattedVal}
              </td>
            `;
            }
          )
          .join("")}
      </tr>
    `;
  });

  // ─── Totals Row ───
  if (options.totalsRow) {
    const row = options.totalsRow;
    tbodyHtml += `
      <tr class="totals-row">
        ${columns
          .map(
            (col) => {
              let val = typeof col.getValue === "function" 
                ? col.getValue(row) 
                : row[col.accessorKey || col.key];
              
              let formattedVal = escapeHtml(val ?? "-");
              if (val !== undefined && val !== null && val !== "") {
                if (col.format === "money_usd" || col.format === "money") {
                  const num = Number(val);
                  formattedVal = num < 0 
                    ? `<span dir="ltr" style="display:inline-block; white-space:nowrap;">-$${Math.abs(num).toLocaleString("en-US")}</span>`
                    : `<span dir="ltr" style="display:inline-block; white-space:nowrap;">$${fmtNum(num)}</span>`;
                } else if (col.format === "money_iqd" || col.format === "number" || col.format === "currency") {
                  if (!isNaN(Number(val))) {
                    const num = Number(val);
                    formattedVal = num < 0
                      ? `<span dir="ltr" style="display:inline-block; white-space:nowrap;">-${Math.abs(num).toLocaleString("en-US")}</span>`
                      : `<span dir="ltr" style="display:inline-block; white-space:nowrap;">${fmtNum(num)}</span>`;
                  }
                }
              }

              return `
              <td>${formattedVal}</td>
            `;
            }
          )
          .join("")}
      </tr>
    `;
  }
  
  tbodyHtml += `</tbody>`;

  // ─── Summary / Metadata Section ───
  // Unified structured layout for ALL templates: organized 2-column grid
  // Right side = labels+values, Left side = dates (when available)
  let metadataHtml = "";

  if (options.summaryGrid) {
    const g = options.summaryGrid;
    // Build meta items array for table display
    const metaItems = [];
    if (g.accountName) metaItems.push({ label: escapeHtml(g.accountLabel || "اسم التاجر"), value: escapeHtml(g.accountName), accent: false });
    if (g.fromDate !== undefined) metaItems.push({ label: escapeHtml(g.fromLabel || "من تاريخ"), value: escapeHtml(g.fromDate), accent: false });
    if (g.toDate !== undefined) metaItems.push({ label: escapeHtml(g.toLabel || "الى تاريخ"), value: escapeHtml(g.toDate), accent: false });
    if (g.totalLabel) metaItems.push({ label: escapeHtml(g.totalLabel), value: escapeHtml(g.totalValue || "---"), accent: true });
    if (g.amountOnValue) metaItems.push({ label: "المبلغ عليه", value: escapeHtml(g.amountOnValue), accent: true });
    if (g.amountForValue) metaItems.push({ label: "المبلغ له", value: escapeHtml(g.amountForValue), accent: true });
    if (g.netValue) metaItems.push({ label: "الصافي", value: escapeHtml(g.netValue), accent: true });
    if (g.hasDateFilter && g.filteredLabel) metaItems.push({ label: escapeHtml(g.filteredLabel), value: escapeHtml(g.filteredValue || "---"), accent: true });
    if (g.balanceLabel) metaItems.push({ label: escapeHtml(g.balanceLabel), value: escapeHtml(g.balanceValue || "---"), accent: true });

    metadataHtml = `
      <table class="tay-meta-table">
        <thead>
          <tr>${metaItems.map(item => `<th>${item.label}</th>`).join("")}</tr>
        </thead>
        <tbody>
          <tr>${metaItems.map(item => `<td class="${item.accent ? 'tay-meta-accent' : ''}">${item.value}</td>`).join("")}</tr>
        </tbody>
      </table>
    `;
  } else if (Array.isArray(options.summaryCards) && options.summaryCards.length > 0) {
    const cards = options.summaryCards;

    // Extract known fields into a structured grid
    const accountCard = cards.find(c => (c.label || "").includes("التاجر"));
    const dateCard = cards.find(c => (c.label || "").includes("الفترة"));
    const totalIqdCard = cards.find(c => (c.label || "").includes("الكلي دينار") || (c.label || "").includes("الاجمالي دينار"));
    const totalUsdCard = cards.find(c => (c.label || "").includes("الكلي دولار") || (c.label || "").includes("الاجمالي دولار"));
    const selectedIqdCard = cards.find(c => (c.label || "").includes("المحدد دينار"));
    const selectedUsdCard = cards.find(c => (c.label || "").includes("المحدد دولار"));
    const balanceIqdCard = cards.find(c => (c.label || "").includes("المتبقي دينار"));
    const balanceUsdCard = cards.find(c => (c.label || "").includes("المتبقي دولار"));
    const weightCard = cards.find(c => (c.label || "").includes("الوزن"));
    const metersCard = cards.find(c => (c.label || "").includes("الامتار"));

    // Remaining cards that don't match any known field
    const knownLabels = new Set([accountCard, dateCard, totalIqdCard, totalUsdCard, selectedIqdCard, selectedUsdCard, balanceIqdCard, balanceUsdCard, weightCard, metersCard].filter(Boolean).map(c => c.label));
    const extraCards = cards.filter(c => !knownLabels.has(c.label));

    // Parse date range
    let fromDate = "---";
    let toDate = "---";
    if (dateCard) {
      const parts = String(dateCard.value).split("→");
      fromDate = (parts[0] || "---").trim();
      toDate = (parts[1] || "---").trim();
    }

    // Build meta items array for card display (label + value side by side)
    const metaItems = [];
    if (accountCard) metaItems.push({ label: escapeHtml(accountCard.label), value: escapeHtml(accountCard.value), accent: false });
    if (dateCard && fromDate !== "---") metaItems.push({ label: "من تاريخ", value: escapeHtml(fromDate), accent: false });
    if (dateCard && toDate !== "---") metaItems.push({ label: "الى تاريخ", value: escapeHtml(toDate), accent: false });
    if (totalUsdCard) metaItems.push({ label: escapeHtml(totalUsdCard.label), value: escapeHtml(totalUsdCard.value), accent: true });
    if (totalIqdCard) metaItems.push({ label: escapeHtml(totalIqdCard.label), value: escapeHtml(totalIqdCard.value), accent: true });
    if (selectedUsdCard) metaItems.push({ label: escapeHtml(selectedUsdCard.label), value: escapeHtml(selectedUsdCard.value), accent: true });
    if (selectedIqdCard) metaItems.push({ label: escapeHtml(selectedIqdCard.label), value: escapeHtml(selectedIqdCard.value), accent: true });
    if (balanceUsdCard) metaItems.push({ label: escapeHtml(balanceUsdCard.label), value: escapeHtml(balanceUsdCard.value), accent: true });
    if (balanceIqdCard) metaItems.push({ label: escapeHtml(balanceIqdCard.label), value: escapeHtml(balanceIqdCard.value), accent: true });
    if (weightCard) metaItems.push({ label: escapeHtml(weightCard.label), value: escapeHtml(weightCard.value), accent: false });
    if (metersCard) metaItems.push({ label: escapeHtml(metersCard.label), value: escapeHtml(metersCard.value), accent: false });
    extraCards.forEach(c => metaItems.push({ label: escapeHtml(c.label), value: escapeHtml(c.value), accent: !!c.color }));

    metadataHtml = `
      <div class="tay-admin-meta-grid">
        ${metaItems.map(item => `
          <div class="tay-admin-meta-card">
            <span class="tay-admin-meta-label">${item.label}</span>
            <span class="tay-admin-meta-value ${item.accent ? 'tay-admin-meta-accent' : ''}">${item.value}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  // ─── Watermark (logo base64 from Canvas assets) ───
  const watermarkHtml = options.logoBase64 
    ? `<div class="watermark"><img src="${options.logoBase64}" /></div>` 
    : '';

  // ─── Unified Font & Spacing Structure ───
  // All templates stay portrait with auto table layout.
  const numColumns = columns.length;
  let thFontSize = "9.5pt";
  let tdFontSize = "9pt";
  let cellPadding = "5px 8px";

  if (numColumns > 10) {
    // النموذج الحالي — force landscape
    options.orientation = "landscape";
    thFontSize = "7.5pt";
    tdFontSize = "7pt";
    cellPadding = "3px 3px";
  } else if (numColumns > 8) {
    thFontSize = "8.5pt";
    tdFontSize = "8pt";
    cellPadding = "4px 5px";
  }

  // ─── Complete HTML Body ───
  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800;900&amp;family=Cairo:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @page { 
          size: A4 ${options.orientation === 'landscape' ? 'landscape' : 'portrait'};
          margin: ${options.headerBase64 ? (options.orientation === 'landscape' ? '30mm' : '22mm') : '10mm'} 0 ${options.footerBase64 ? '22mm' : '10mm'} 0; 
        }
        body {
          font-family: "IBM Plex Sans Arabic", "Tajawal", "Cairo", Arial, Tahoma, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          direction: rtl;
        }

        /* ── Watermark (same as Canvas: logo at 6% opacity, centered) ── */
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.1;
          pointer-events: none;
        }
        .watermark img { width: 280px; height: auto; }

        /* ── Admin Meta Grid: label+value side by side in each card ── */
        .tay-admin-meta-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
          direction: rtl;
        }
        .tay-admin-meta-card {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0f4f8;
          border: 1.5px solid #1C2B59;
          border-radius: 7px;
          padding: 5px 12px;
          white-space: nowrap;
        }
        .tay-admin-meta-label {
          color: #ffffff;
          background: #1C2B59;
          font-weight: 700;
          font-size: 9pt;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .tay-admin-meta-value {
          color: #1C2B59;
          font-weight: 800;
          font-size: 10pt;
        }
        .tay-admin-meta-accent {
          color: #E31E24 !important;
        }

        /* ── Meta Info Table ── */
        .tay-meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 11pt;
          font-weight: 600;
          border: 1.5px solid #1C2B59;
        }
        .tay-meta-table th {
          background-color: #1C2B59;
          color: #ffffff;
          padding: 6px 10px;
          text-align: center;
          font-weight: 700;
          font-size: 10pt;
          border: 1px solid #1C2B59;
        }
        .tay-meta-table td {
          background-color: #f8f9fc;
          padding: 7px 10px;
          text-align: center;
          font-weight: 700;
          font-size: 11pt;
          color: #1C2B59;
          border: 1px solid #ddd;
        }
        .tay-meta-table td.tay-meta-accent {
          color: #E31E24;
        }

        /* ── Table ── */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: ${tdFontSize};
        }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        
        th {
          background-color: #1C2B59;
          color: #ffffff;
          padding: ${cellPadding};
          font-size: ${thFontSize};
          font-weight: 800;
          border: 0.2px solid #d0d5dd;
          text-align: center;
          white-space: nowrap;
        }
        
        td {
          padding: ${cellPadding};
          font-size: ${tdFontSize};
          font-weight: 700;
          border: 0.2px solid #e0e4ea;
          color: #1f2937;
          text-align: center;
        }

        /* ── Totals Row (matches Canvas: #eef1f7 bg, navy text) ── */
        .totals-row td {
          background-color: #f3f4f6 !important;
          color: #111827;
          font-weight: 900;
          font-size: 12pt;
          border: 1px solid #d7dbe4;
        }

        .report-title {
          text-align: center;
          color: #1C2B59;
          font-size: 16pt;
          margin-bottom: 12px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      ${watermarkHtml}
      <div style="padding: 0 4.2mm;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>

            <tr>
              <th colspan="100" style="border: none; padding: 5mm 8px 10px; background: transparent; text-align: right; direction: rtl; font-weight: normal; color: inherit;">
                ${metadataHtml}
              </th>
            </tr>
            ${theadHtml}
          </thead>
          ${tbodyHtml}
        </table>
      </div>
    </body>
    </html>
  `;

  // ─── Header Template: exact brand header image (base64) ───
  // Puppeteer renders headerTemplate inside the margin area.
  // We must force the container to fill the ENTIRE margin height and use object-fit:cover
  // to eliminate any white gap above/below the image.
  const headerMargin = options.orientation === "landscape" ? "30mm" : "22mm";
  const headerTemplate = options.headerBase64
    ? `<style>#header, #footer { padding: 0 !important; margin: 0 !important; }</style>
       <div style="width: 100%; height: ${headerMargin}; margin: 0; padding: 0; overflow: hidden; -webkit-print-color-adjust: exact; display: flex; flex-direction: column;">
         <img src="${options.headerBase64}" style="width: 100%; flex: 1; display: block; margin: 0; padding: 0; object-fit: fill;" />
         <div style="width: 100%; height: 1px; background-color: #1c2b59; flex-shrink: 0; margin-top: 5px;"></div>
       </div>`
    : null;

  // ─── Footer Template: exact brand footer image (base64) ───
  // Same approach: force container to fill entire bottom margin with the footer image
  const footerMargin = "22mm";
  const footerTemplate = options.footerBase64
    ? `<style>#header, #footer { padding: 0 !important; margin: 0 !important; }</style>
       <div style="width: 100%; height: ${footerMargin}; margin: 0; padding: 0; overflow: hidden; -webkit-print-color-adjust: exact; font-family: 'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif; display: flex; flex-direction: column;">
         <div style="width: 100%; display: flex; justify-content: space-between; font-size: 8pt; color: #555; padding: 1px 5mm; direction: rtl; flex-shrink: 0;">
           <div>تاريخ الطباعة: <span class="date" style="direction: ltr; display: inline-block;"></span></div>
           <div>الصفحة <span class="pageNumber"></span> من <span class="totalPages"></span></div>
         </div>
         <img src="${options.footerBase64}" style="width: 100%; flex: 1; display: block; margin: 0; padding: 0; object-fit: fill;" />
       </div>`
    : `<div style="width: 100%; font-size: 9pt; font-family: Arial, sans-serif; display: flex; justify-content: space-between; padding: 0 10mm 2mm;">
         <div style="color: #666;"><span class="date"></span></div>
         <div style="color: #1C2B59; font-weight: bold;">07700000000 | info@tayalrawi.com</div>
         <div style="color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
       </div>`;

  // ─── Margin Calculation ───
  // Header image (cropped): 7017×650 → on A4 210mm width → height ≈ 19.5mm → use 20mm margin
  // Footer image (cropped): 7017×613 → on A4 210mm width → height ≈ 18.3mm → use 20mm margin
  // The headerTemplate/footerTemplate containers are set to fill 100% of the margin height
  // using object-fit:fill, so the image stretches to perfectly fill the margin area.
  const hasHeader = !!options.headerBase64;
  const hasFooter = !!options.footerBase64;
  const isLandscape = options.orientation === "landscape";
  const marginTop = hasHeader ? (isLandscape ? "30mm" : "22mm") : "10mm";
  const marginBottom = hasFooter ? "22mm" : "10mm";

  try {
    const token = window.sessionStorage.getItem("merchant_token") || window.sessionStorage.getItem("token") || "";

    const response = await fetch("/api/export/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token 
      },
      body: JSON.stringify({
        html,
        filename: filename || `${title}.pdf`,
        headerTemplate,
        footerTemplate,
        marginTop,
        marginBottom,
        marginRight: "0",
        marginLeft: "0",
        landscape: options.orientation === "landscape",
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error("Failed to generate PDF: " + errText);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `${title}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("PDF Export Error:", error);
    alert("حدث خطأ أثناء تصدير الـ PDF. الرجاء المحاولة مرة أخرى.");
  }
}

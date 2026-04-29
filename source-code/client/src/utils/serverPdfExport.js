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
                    : `<span dir="ltr" style="display:inline-block; white-space:nowrap;">$${num.toLocaleString("en-US")}</span>`;
                } else if (col.format === "money_iqd" || col.format === "number" || col.format === "currency") {
                  if (!isNaN(Number(val))) {
                    const num = Number(val);
                    formattedVal = num < 0
                      ? `<span dir="ltr" style="display:inline-block; white-space:nowrap;">-${Math.abs(num).toLocaleString("en-US")}</span>`
                      : `<span dir="ltr" style="display:inline-block; white-space:nowrap;">${num.toLocaleString("en-US")}</span>`;
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
                    : `<span dir="ltr" style="display:inline-block; white-space:nowrap;">$${num.toLocaleString("en-US")}</span>`;
                } else if (col.format === "money_iqd" || col.format === "number" || col.format === "currency") {
                  if (!isNaN(Number(val))) {
                    const num = Number(val);
                    formattedVal = num < 0
                      ? `<span dir="ltr" style="display:inline-block; white-space:nowrap;">-${Math.abs(num).toLocaleString("en-US")}</span>`
                      : `<span dir="ltr" style="display:inline-block; white-space:nowrap;">${num.toLocaleString("en-US")}</span>`;
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
    metadataHtml = `
      <div class="summary-grid">
        <div class="summary-row">
          <div class="summary-cell right navy">
            ${g.accountName ? `<span>${escapeHtml(g.accountLabel || "اسم التاجر")} : ${escapeHtml(g.accountName)}</span>` : ''}
          </div>
          <div class="summary-cell left navy" dir="rtl">
            ${g.fromDate !== undefined ? `<span>${escapeHtml(g.fromLabel || "من تاريخ")} : <span dir="ltr">${escapeHtml(g.fromDate)}</span></span>` : ''}
          </div>
        </div>
        <div class="summary-row">
          <div class="summary-cell right red">
            ${g.totalLabel ? `<span>${escapeHtml(g.totalLabel)}: <span dir="ltr">${escapeHtml(g.totalValue || "---")}</span></span>` : ''}
            ${g.amountOnValue ? `<span>المبلغ عليه: ${escapeHtml(g.amountOnValue)}</span>` : ''}
            ${g.amountForValue ? `<span style="margin-right: 12px;">المبلغ له: ${escapeHtml(g.amountForValue)}</span>` : ''}
            ${g.netValue ? `<span style="margin-right: 12px;">الصافي: ${escapeHtml(g.netValue)}</span>` : ''}
          </div>
          <div class="summary-cell left navy" dir="rtl">
            ${g.toDate !== undefined ? `<span>${escapeHtml(g.toLabel || "الى تاريخ")} : <span dir="ltr">${escapeHtml(g.toDate)}</span></span>` : ''}
          </div>
        </div>
        ${g.selectedLabel ? `
        <div class="summary-row">
          <div class="summary-cell right red">
            <span>${escapeHtml(g.selectedLabel)}: ${escapeHtml(g.selectedValue || "---")}</span>
          </div>
          <div class="summary-cell left"></div>
        </div>
        ` : ''}
      </div>
    `;
  } else if (Array.isArray(options.summaryCards) && options.summaryCards.length > 0) {
    const cards = options.summaryCards;

    // Extract known fields into a structured grid (same layout as summaryGrid)
    const accountCard = cards.find(c => (c.label || "").includes("التاجر"));
    const dateCard = cards.find(c => (c.label || "").includes("الفترة"));
    const totalIqdCard = cards.find(c => (c.label || "").includes("الاجمالي دينار"));
    const totalUsdCard = cards.find(c => (c.label || "").includes("الاجمالي دولار"));
    const selectedIqdCard = cards.find(c => (c.label || "").includes("المحدد دينار"));
    const selectedUsdCard = cards.find(c => (c.label || "").includes("المحدد دولار"));
    const weightCard = cards.find(c => (c.label || "").includes("الوزن"));
    const metersCard = cards.find(c => (c.label || "").includes("الامتار"));

    // Remaining cards that don't match any known field
    const knownLabels = new Set([accountCard, dateCard, totalIqdCard, totalUsdCard, selectedIqdCard, selectedUsdCard, weightCard, metersCard].filter(Boolean).map(c => c.label));
    const extraCards = cards.filter(c => !knownLabels.has(c.label));

    // Build totals line: combine IQD + USD on same row
    const totalsItems = [];
    if (totalUsdCard) totalsItems.push(`${escapeHtml(totalUsdCard.label)}: <span dir="ltr">${escapeHtml(totalUsdCard.value)}</span>`);
    if (totalIqdCard) totalsItems.push(`${escapeHtml(totalIqdCard.label)}: <span dir="ltr">${escapeHtml(totalIqdCard.value)}</span>`);
    if (weightCard) totalsItems.push(`${escapeHtml(weightCard.label)}: <span dir="ltr">${escapeHtml(weightCard.value)}</span>`);
    if (metersCard) totalsItems.push(`${escapeHtml(metersCard.label)}: <span dir="ltr">${escapeHtml(metersCard.value)}</span>`);

    // Build selected-amounts line
    const selectedItems = [];
    if (selectedUsdCard) selectedItems.push(`${escapeHtml(selectedUsdCard.label)}: <span dir="ltr">${escapeHtml(selectedUsdCard.value)}</span>`);
    if (selectedIqdCard) selectedItems.push(`${escapeHtml(selectedIqdCard.label)}: <span dir="ltr">${escapeHtml(selectedIqdCard.value)}</span>`);

    // Parse date range
    let fromDate = "---";
    let toDate = "---";
    if (dateCard) {
      const parts = String(dateCard.value).split("→");
      fromDate = (parts[0] || "---").trim();
      toDate = (parts[1] || "---").trim();
    }

    metadataHtml = `
      <div class="summary-grid">
        <div class="summary-row">
          <div class="summary-cell right navy">
            ${accountCard ? `<span>${escapeHtml(accountCard.label)} : ${escapeHtml(accountCard.value)}</span>` : ''}
          </div>
          <div class="summary-cell left navy" dir="rtl">
            ${dateCard ? `<span>من تاريخ : <span dir="ltr">${escapeHtml(fromDate)}</span></span>` : ''}
          </div>
        </div>
        ${totalsItems.length > 0 ? `
        <div class="summary-row">
          <div class="summary-cell right navy">
            ${totalsItems.map(item => `<span>${item}</span>`).join('<span style="margin: 0 8px;">|</span>')}
          </div>
          <div class="summary-cell left navy" dir="rtl">
            ${dateCard ? `<span>الى تاريخ : <span dir="ltr">${escapeHtml(toDate)}</span></span>` : ''}
          </div>
        </div>
        ` : ''}
        ${selectedItems.length > 0 ? `
        <div class="summary-row">
          <div class="summary-cell right red">
            ${selectedItems.map(item => `<span>${item}</span>`).join('<span style="margin: 0 8px; color: #E31E24;">|</span>')}
          </div>
          <div class="summary-cell left"></div>
        </div>
        ` : ''}
        ${extraCards.length > 0 ? `
        <div class="summary-row">
          <div class="summary-cell right navy">
            ${extraCards.map(c => `<span>${escapeHtml(c.label)}: <span dir="ltr">${escapeHtml(c.value)}</span></span>`).join('<span style="margin: 0 8px;">|</span>')}
          </div>
          <div class="summary-cell left"></div>
        </div>
        ` : ''}
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
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @page { 
          size: A4 ${options.orientation === 'landscape' ? 'landscape' : 'portrait'};
          margin: 0 0 ${options.footerBase64 ? '32mm' : '10mm'} 0; 
        }
        body {
          font-family: "Cordale Trial Bold Italic", "Cordale Trial", "Cairo", "Tajawal", "Traditional Arabic", Tahoma, "Segoe UI", Arial, sans-serif;
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

        /* ── Summary Grid: Unified info box for ALL templates ── */
        .summary-grid {
          font-size: 11pt;
          font-weight: 700;
          margin-bottom: 5px;
          width: 100%;
          line-height: 1.8;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 4px;
        }
        .summary-cell { 
          flex: 0 1 auto; 
          white-space: nowrap;
        }
        .summary-cell span + span { margin-right: 0; }
        .summary-cell.right { text-align: right; }
        .summary-cell.center { text-align: center; }
        .summary-cell.left { text-align: left; }
        .summary-cell.navy { color: #1C2B59; }
        .summary-cell.red { color: #E31E24; }

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
            ${options.headerBase64 ? `
            <tr>
              <th colspan="100" style="padding: 0; margin: 0; border: none; background: transparent;">
                <img src="${options.headerBase64}" style="width: calc(100% + 8.4mm); max-width: none; display: block; margin: 0 -4.2mm; padding: 0;" />
              </th>
            </tr>
            ` : ''}
            <tr>
              <th colspan="100" style="border: 0.2px solid #d0d5dd; border-top: 1.5px solid #1C2B59; border-bottom: none; padding: 2px 8px 10px; background: transparent; text-align: right; direction: rtl; font-weight: normal; color: inherit;">
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

  // ─── Header is now embedded directly in the repeating HTML thead ───
  const headerTemplate = null;

  // ─── Footer Template: exact brand footer image (base64) ───
  const footerTemplate = options.footerBase64
    ? `<div style="width: 100%; margin: 0; padding: 0 4.2mm; -webkit-print-color-adjust: exact; font-family: 'Segoe UI', Tahoma, Arial, sans-serif;">
         <img src="${options.footerBase64}" style="width: calc(100% + 8.4mm); max-width: none; display: block; margin: 0 -4.2mm; padding: 0;" />
         <div style="display: flex; justify-content: space-between; font-size: 8pt; color: #555; padding-top: 4px; direction: rtl;">
           <div>تاريخ الطباعة: <span class="date" style="direction: ltr; display: inline-block;"></span></div>
           <div>الصفحة <span class="pageNumber"></span> من <span class="totalPages"></span></div>
         </div>
       </div>`
    : `<div style="width: 100%; font-size: 9pt; font-family: Arial, sans-serif; display: flex; justify-content: space-between; padding: 0 10mm 2mm;">
         <div style="color: #666;"><span class="date"></span></div>
         <div style="color: #1C2B59; font-weight: bold;">07700000000 | info@tayalrawi.com</div>
         <div style="color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
       </div>`;

  // ─── Margin Calculation ───
  // Header image: 7017×843 → on A4 210mm width → height ≈ 25.2mm
  // Footer image: 7017×745 → on A4 210mm width → height ≈ 22.3mm
  const hasHeader = !!options.headerBase64;
  const hasFooter = !!options.footerBase64;
  const marginTop = "0mm";
  const marginBottom = hasFooter ? "34mm" : "10mm";

  try {
    const token = window.sessionStorage.getItem("token") || window.localStorage.getItem("token") || "";

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
        marginTop: "0",
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

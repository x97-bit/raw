export function resolvePdfExportMode(payload = {}) {
  return payload?.printRenderer === "saudi-statement"
    ? "saudi-statement"
    : "default";
}

export async function runExportToPDF(payload) {
  const { exportToPDF, exportSaudiStatementPDF } = await import("./pdfExports");

  if (resolvePdfExportMode(payload) === "saudi-statement") {
    return exportSaudiStatementPDF(payload);
  }

  return exportToPDF(payload);
}

export async function runExportToExcel(rows, columns, filename, title) {
  const { exportToExcel } = await import("./excelExports");
  return exportToExcel(rows, columns, filename, title);
}

export async function runExportInvoicePDF(payload) {
  const { exportInvoicePDF } = await import("./pdfExports");
  return exportInvoicePDF(payload);
}

/**
 * New: Export invoice via server-side Puppeteer for perfect Arabic rendering.
 * Falls back to client-side Canvas PDF if server is unavailable.
 */
export async function runExportInvoiceServerPDF(payload) {
  const { exportInvoiceViaServer } = await import("./invoiceHtmlTemplate");
  return exportInvoiceViaServer(payload.transaction, {
    sectionKey: payload.sectionKey,
    portId: payload.portId,
    authFetch: payload.authFetch,
  });
}

export async function runSaudiStatementPrint(payload) {
  const { printSaudiStatementTemplate } = await import("./printExports");
  return printSaudiStatementTemplate(payload);
}

export async function runTabularPrint(payload) {
  const { printTabularReport } = await import("./printExports");
  return printTabularReport(payload);
}

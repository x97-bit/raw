export function resolvePdfExportMode(payload = {}) {
  return payload?.printRenderer === 'saudi-statement' ? 'saudi-statement' : 'default';
}

export async function runExportToPDF(payload) {
  const { exportToPDF, exportSaudiStatementPDF } = await import('./pdfExports');

  if (resolvePdfExportMode(payload) === 'saudi-statement') {
    return exportSaudiStatementPDF(payload);
  }

  return exportToPDF(payload);
}

export async function runExportToExcel(rows, columns, filename, title) {
  const { exportToExcel } = await import('./excelExports');
  return exportToExcel(rows, columns, filename, title);
}

export async function runExportInvoicePDF(payload) {
  const { exportInvoicePDF } = await import('./pdfExports');
  return exportInvoicePDF(payload);
}

export async function runSaudiStatementPrint(payload) {
  const { printSaudiStatementTemplate } = await import('./printExports');
  return printSaudiStatementTemplate(payload);
}

export async function runTabularPrint(payload) {
  const { printTabularReport } = await import('./printExports');
  return printTabularReport(payload);
}

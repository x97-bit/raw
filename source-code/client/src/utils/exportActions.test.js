import { beforeEach, describe, expect, it, vi } from 'vitest';

const pdfMocks = vi.hoisted(() => ({
  exportToPDF: vi.fn(),
  exportSaudiStatementPDF: vi.fn(),
}));

vi.mock('./pdfExports', () => ({
  exportToPDF: pdfMocks.exportToPDF,
  exportSaudiStatementPDF: pdfMocks.exportSaudiStatementPDF,
}));

import { resolvePdfExportMode, runExportToPDF } from './exportActions';

describe('exportActions', () => {
  beforeEach(() => {
    pdfMocks.exportToPDF.mockReset().mockResolvedValue(undefined);
    pdfMocks.exportSaudiStatementPDF.mockReset().mockResolvedValue(undefined);
  });

  it('routes Saudi statement templates to the dedicated PDF exporter', async () => {
    const payload = { printRenderer: 'saudi-statement', templateVariant: 'usd' };

    await runExportToPDF(payload);

    expect(pdfMocks.exportSaudiStatementPDF).toHaveBeenCalledWith(payload);
    expect(pdfMocks.exportToPDF).not.toHaveBeenCalled();
  });

  it('routes regular templates to the generic PDF exporter', async () => {
    const payload = { title: 'كشف حساب عام' };

    await runExportToPDF(payload);

    expect(pdfMocks.exportToPDF).toHaveBeenCalledWith(payload);
    expect(pdfMocks.exportSaudiStatementPDF).not.toHaveBeenCalled();
  });

  it('detects the Saudi statement export mode from the template renderer', () => {
    expect(resolvePdfExportMode({ printRenderer: 'saudi-statement' })).toBe('saudi-statement');
    expect(resolvePdfExportMode({ printRenderer: 'table' })).toBe('default');
    expect(resolvePdfExportMode({})).toBe('default');
  });
});

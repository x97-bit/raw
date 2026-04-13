import { describe, expect, it } from 'vitest';
import {
  buildProfitsPrintSections,
  buildReportPrintMetaItems,
  buildExpensesSummaryCards,
  buildProfitSummaryCards,
  EXPENSES_EXPORT_COLUMNS,
  PROFITS_BY_TRADER_EXPORT_COLUMNS,
  PROFITS_EXPORT_COLUMNS,
  REPORT_PORTS,
} from './reportsConfig';

describe('reportsConfig', () => {
  it('exposes the supported report ports', () => {
    expect(REPORT_PORTS.map((port) => port.id)).toEqual(['port-1', 'port-2', 'port-3']);
    expect(REPORT_PORTS.every((port) => Array.isArray(port.iconLines) && port.iconLines.length > 0)).toBe(true);
  });

  it('builds export columns and summary cards for reports', () => {
    expect(EXPENSES_EXPORT_COLUMNS.some((column) => column.key === 'chargeTarget')).toBe(true);
    expect(EXPENSES_EXPORT_COLUMNS.some((column) => column.key === 'accountName')).toBe(true);
    expect(PROFITS_EXPORT_COLUMNS.some((column) => column.key === 'ProfitUSD')).toBe(true);
    expect(PROFITS_BY_TRADER_EXPORT_COLUMNS.some((column) => column.key === 'totalProfitIQD')).toBe(true);

    expect(buildExpensesSummaryCards({
      rows: [{}, {}],
      totals: {
        count: 2,
        directExpenseUSD: 40,
        directExpenseIQD: 1000,
        chargedToTraderUSD: 5,
        chargedToTraderIQD: 250,
      },
    })).toEqual([
      { label: 'عدد المصاريف', value: 2 },
      { label: 'على المنفذ ($)', value: '$40' },
      { label: 'على المنفذ (د.ع)', value: '1,000' },
      { label: 'محمل على التاجر ($)', value: '$5' },
      { label: 'محمل على التاجر (د.ع)', value: '250' },
    ]);

    expect(buildProfitSummaryCards({ shipmentCount: 3, totalCostUSD: 10, totalAmountUSD: 15, totalProfitUSD: 5 })).toEqual([
      { label: 'عدد الشحنات', value: 3 },
      { label: 'إجمالي التكلفة', value: '$10' },
      { label: 'إجمالي المبلغ', value: '$15' },
      { label: 'إجمالي الربح', value: '$5' },
    ]);
  });

  it('builds report print metadata and multi-section profit print payloads', () => {
    expect(buildReportPrintMetaItems({ name: 'السعودية' }, { from: '2026-04-01', to: '2026-04-10' })).toEqual([
      { label: 'المنفذ', value: 'السعودية' },
      { label: 'من تاريخ', value: '2026-04-01' },
      { label: 'إلى تاريخ', value: '2026-04-10' },
    ]);

    expect(buildReportPrintMetaItems(null, {})).toEqual([
      { label: 'المنفذ', value: '---' },
      { label: 'من تاريخ', value: 'كل الفترة' },
      { label: 'إلى تاريخ', value: 'كل الفترة' },
    ]);

    const sections = buildProfitsPrintSections({
      traderProfits: [{ AccountName: 'أحمد', shipmentCount: 2 }],
      profitRows: [{ RefNo: 'R-1', ProfitUSD: 10 }],
      profitTotals: { shipmentCount: 2, totalCostUSD: 4, totalAmountUSD: 8, totalProfitUSD: 4, totalProfitIQD: 5000 },
    });

    expect(sections).toHaveLength(2);
    expect(sections[0].key).toBe('profits-by-trader');
    expect(sections[0].columns).toBe(PROFITS_BY_TRADER_EXPORT_COLUMNS);
    expect(sections[0].highlightRows).toBe(false);
    expect(sections[1].key).toBe('profit-shipment-details');
    expect(sections[1].columns).toBe(PROFITS_EXPORT_COLUMNS);
    expect(sections[1].totalsRow).toEqual({
      CostUSD: 4,
      AmountUSD: 8,
      ProfitUSD: 4,
    });
  });
});

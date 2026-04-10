import { describe, expect, it } from 'vitest';
import { EMPTY_PORT_SUMMARY, formatPortSummaryValue, PORT_SECTION_SUMMARY_META } from './portSummaryConfig';

describe('portSummaryConfig', () => {
  it('keeps a stable empty summary shape for port pages', () => {
    expect(EMPTY_PORT_SUMMARY).toMatchObject({
      count: 0,
      shipmentCount: 0,
      totalWeight: 0,
      totalInvoicesUSD: 0,
      balanceUSD: 0,
      balanceIQD: 0,
    });
  });

  it('includes the total weight card for Saudi summaries and formats numeric summaries', () => {
    expect(PORT_SECTION_SUMMARY_META['port-1'].list.some((card) => card.key === 'totalWeight')).toBe(true);
    expect(PORT_SECTION_SUMMARY_META['port-1'].statement.some((card) => card.key === 'totalWeight')).toBe(true);
    expect(formatPortSummaryValue(23600, 'number')).toBe('23,600');
  });

  it('uses payable wording for transport summaries', () => {
    expect(PORT_SECTION_SUMMARY_META['transport-1'].list.map((card) => card.key)).toEqual([
      'totalInvoicesUSD',
      'totalInvoicesIQD',
      'totalPaymentsUSD',
      'totalPaymentsIQD',
    ]);
    expect(PORT_SECTION_SUMMARY_META['transport-1'].statement.map((card) => card.label)).toEqual([
      'المتبقي علينا دولار',
      'المتبقي علينا دينار',
    ]);
  });

  it('shows total order cards in Qaim statement summaries', () => {
    expect(PORT_SECTION_SUMMARY_META['port-3'].statement.map((card) => card.key)).toEqual([
      'totalInvoicesUSD',
      'totalInvoicesIQD',
    ]);
  });
});

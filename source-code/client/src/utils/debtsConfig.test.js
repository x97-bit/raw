import { describe, expect, it } from 'vitest';
import {
  buildDebtSummaryRows,
  buildDebtTotals,
  getDebtorConfig,
  mergeUniqueDebtNames,
} from './debtsConfig';

describe('debtsConfig', () => {
  it('maps debtor names to their specialized config', () => {
    const config = getDebtorConfig('باسم الجميلي');
    expect(config?.label).toBe('باسم');
    expect(config?.columns.some((column) => column.key === 'amount_usd')).toBe(true);
  });

  it('builds totals and summary rows from debt entries', () => {
    const rows = [
      { AccountName: 'باسم', AmountUSD: 100, AmountIQD: 150000, PaidAmountUSD: 20, PaidAmountIQD: 0, RemainingUSD: 80, RemainingIQD: 150000 },
      { AccountName: 'باسم', AmountUSD: 50, AmountIQD: 0, PaidAmountUSD: 10, PaidAmountIQD: 0, RemainingUSD: 40, RemainingIQD: 0 },
      { AccountName: 'نعمان', AmountUSD: 30, AmountIQD: 10000, PaidAmountUSD: 0, PaidAmountIQD: 1000, RemainingUSD: 30, RemainingIQD: 9000 },
    ];

    expect(buildDebtTotals(rows)).toEqual({
      count: 3,
      totalUSD: 180,
      totalIQD: 160000,
      paidUSD: 30,
      paidIQD: 1000,
      remainingUSD: 150,
      remainingIQD: 159000,
    });

    expect(buildDebtSummaryRows(rows)).toEqual([
      {
        AccountID: 'باسم',
        AccountName: 'باسم',
        totalUSD: 150,
        totalIQD: 150000,
        paidUSD: 30,
        paidIQD: 0,
        remainingUSD: 120,
        remainingIQD: 150000,
        count: 2,
      },
      {
        AccountID: 'نعمان',
        AccountName: 'نعمان',
        totalUSD: 30,
        totalIQD: 10000,
        paidUSD: 0,
        paidIQD: 1000,
        remainingUSD: 30,
        remainingIQD: 9000,
        count: 1,
      },
    ]);
  });

  it('merges unique names without duplicating existing labels', () => {
    const items = [{ id: 'باسم', name: 'باسم' }];
    expect(mergeUniqueDebtNames(items, 'باسم')).toEqual(items);
    expect(mergeUniqueDebtNames(items, 'نعمان')).toEqual([
      { id: 'باسم', name: 'باسم' },
      { id: 'نعمان', name: 'نعمان' },
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildVisibleSpecialColumns,
  createInitialSpecialFieldState,
  filterSpecialAccountRows,
  getInitialSpecialForm,
  SPECIAL_ACCOUNT_DEFS,
} from './specialAccountsConfig';

describe('specialAccountsConfig', () => {
  it('starts with visible defaults for both special account screens', () => {
    const initial = createInitialSpecialFieldState();

    expect(initial['special-haider'].visibleKeys.length).toBeGreaterThan(0);
    expect(initial['special-partner'].visibleKeys.length).toBeGreaterThan(0);
  });

  it('keeps Haider summary cards aligned with the totals model including total weight', () => {
    const totals = {
      totalAmountUSD: 1500,
      totalAmountIQD: 2400000,
      totalDifferenceIQD: 320000,
      totalGrandIQD: 2720000,
      totalWeight: 23600,
    };

    const cards = SPECIAL_ACCOUNT_DEFS.haider.buildSummaryCards(totals);
    expect(cards.some((card) => card.value === '23,600')).toBe(true);
  });

  it('builds visible labels from field config and preserves Haider-only defaults', () => {
    const columns = buildVisibleSpecialColumns(
      SPECIAL_ACCOUNT_DEFS.haider.columns,
      ['destination', 'meters', 'weight', 'batch_name', 'amount_usd'],
      { weight: { displayLabel: 'weight-final' } },
    );
    const form = getInitialSpecialForm('haider', 'Haider', {
      Destination: 'Baghdad',
      Meters: 14,
      Weight: 200,
      BatchName: 'Batch 1',
      AmountUSD: 10,
    });

    expect(columns.map((column) => column.key)).toEqual([
      'destination',
      'meters',
      'weight',
      'batch_name',
      'amount_usd',
    ]);
    expect(columns[2].label).toBe('weight-final');
    expect(form.destination).toBe('Baghdad');
    expect(form.meters).toBe(14);
    expect(form.weight).toBe(200);
    expect(form.batchName).toBe('Batch 1');
    expect(form.amountUSD).toBe(10);
  });

  it('filters rows using visible column data and custom search keys', () => {
    const rows = [
      { TraderNote: 'note one', DriverName: 'driver 1', BatchName: 'Batch 1' },
      { TraderNote: 'note two', DriverName: 'driver 2', BatchName: 'Batch 2' },
      { TraderNote: 'note three', DriverName: 'driver 2', BatchName: 'Batch 1' },
    ];
    const columns = [{ dataKey: 'TraderNote' }];

    const filtered = filterSpecialAccountRows(rows, 'driver 2', columns, ['DriverName']);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].DriverName).toBe('driver 2');
  });

  it('supports a dedicated Haider batch filter', () => {
    const rows = [
      { TraderNote: 'note one', DriverName: 'driver 1', BatchName: 'Batch 1' },
      { TraderNote: 'note two', DriverName: 'driver 2', BatchName: 'Batch 2' },
      { TraderNote: 'note three', DriverName: 'driver 3', BatchName: 'Batch 1' },
    ];
    const columns = [{ dataKey: 'TraderNote' }];

    const filtered = filterSpecialAccountRows(rows, '', columns, ['DriverName'], { batchName: 'Batch 1' });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((row) => row.BatchName === 'Batch 1')).toBe(true);
  });
});

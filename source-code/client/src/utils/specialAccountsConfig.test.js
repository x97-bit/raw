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
    expect(cards.some((card) => card.label === 'مجموع الوزن الكلي' && card.value === '23,600')).toBe(true);
  });

  it('builds visible labels from field config and preserves editable record defaults', () => {
    const columns = buildVisibleSpecialColumns(
      SPECIAL_ACCOUNT_DEFS.haider.columns,
      ['weight', 'amount_usd'],
      { weight: { displayLabel: 'الوزن النهائي' } },
    );
    const form = getInitialSpecialForm('haider', 'حيدر شركة الأنوار', { Weight: 200, AmountUSD: 10 });

    expect(columns.map((column) => column.label)).toEqual(['الوزن النهائي', 'المبلغ دولار']);
    expect(form.weight).toBe(200);
    expect(form.amountUSD).toBe(10);
  });

  it('filters rows using visible column data and custom search keys', () => {
    const rows = [
      { TraderNote: 'ملاحظة أولى', DriverName: 'سائق 1' },
      { TraderNote: 'ثانية', DriverName: 'سائق 2' },
    ];
    const columns = [{ dataKey: 'TraderNote' }];

    const filtered = filterSpecialAccountRows(rows, 'سائق 2', columns, ['DriverName']);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].DriverName).toBe('سائق 2');
  });
});

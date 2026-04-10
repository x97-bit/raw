import { describe, expect, it } from 'vitest';
import {
  applyLoadedSpecialFieldConfigs,
  buildSpecialAccountQuery,
  createSpecialAccountFilters,
} from './specialAccountsPageHelpers';

describe('specialAccountsPageHelpers', () => {
  it('creates stable default filters', () => {
    expect(createSpecialAccountFilters()).toEqual({
      from: '',
      to: '',
      search: '',
    });
  });

  it('builds account query strings from active date filters', () => {
    expect(buildSpecialAccountQuery({ from: '2026-04-01', to: '2026-04-09' }))
      .toBe('from=2026-04-01&to=2026-04-09');
    expect(buildSpecialAccountQuery({})).toBe('');
  });

  it('merges fetched field configs into the current special account field state', () => {
    const current = {
      'special-haider': { visibleKeys: ['a'], configMap: { a: { displayLabel: 'A' } } },
      'special-partner': { visibleKeys: ['b'], configMap: { b: { displayLabel: 'B' } } },
    };

    expect(applyLoadedSpecialFieldConfigs(
      current,
      [{ fieldKey: 'weight', visible: 1, sortOrder: 2, displayLabel: 'الوزن النهائي' }],
      [],
    )).toEqual({
      'special-haider': {
        configMap: {
          weight: {
            visible: true,
            sortOrder: 2,
            displayLabel: 'الوزن النهائي',
          },
        },
        visibleKeys: ['weight'],
      },
      'special-partner': current['special-partner'],
    });
  });
});

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
      batchName: '',
    });
  });

  it('builds account query strings from active date filters', () => {
    expect(buildSpecialAccountQuery({ from: '2026-04-01', to: '2026-04-09' }))
      .toBe('from=2026-04-01&to=2026-04-09');
    expect(buildSpecialAccountQuery({})).toBe('');
  });

  it('keeps fallback visible keys when older field configs do not know about new Haider fields', () => {
    const current = {
      'special-haider': { visibleKeys: ['weight', 'meters'], configMap: { weight: { displayLabel: 'old-weight' } } },
      'special-partner': { visibleKeys: ['b'], configMap: { b: { displayLabel: 'B' } } },
    };

    expect(applyLoadedSpecialFieldConfigs(
      current,
      [{ fieldKey: 'weight', visible: 1, sortOrder: 2, displayLabel: 'weight-final' }],
      [],
    )).toEqual({
      'special-haider': {
        configMap: {
          weight: {
            visible: true,
            sortOrder: 2,
            displayLabel: 'weight-final',
          },
        },
        visibleKeys: ['weight', 'meters'],
      },
      'special-partner': current['special-partner'],
    });
  });
});

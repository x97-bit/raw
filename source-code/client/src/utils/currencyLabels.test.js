import { describe, expect, it } from 'vitest';
import { getCurrencyLabel } from './currencyLabels';

describe('currencyLabels', () => {
  it('maps system currency codes to Arabic labels', () => {
    expect(getCurrencyLabel('USD')).toBe('دولار');
    expect(getCurrencyLabel('IQD')).toBe('دينار');
    expect(getCurrencyLabel('BOTH')).toBe('دولار ودينار');
  });

  it('preserves already formatted values and falls back safely', () => {
    expect(getCurrencyLabel('دولار')).toBe('دولار');
    expect(getCurrencyLabel('')).toBe('-');
    expect(getCurrencyLabel(null)).toBe('-');
  });
});

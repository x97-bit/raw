import { describe, expect, it } from 'vitest';
import {
  formatEnglishLongDate,
  shouldUseTayAlRawiBranding,
  TAY_ALRAWI_BRAND_ASSETS,
} from './exportBranding';

describe('shouldUseTayAlRawiBranding', () => {
  it('keeps branding enabled for unified statement sections', () => {
    expect(shouldUseTayAlRawiBranding({ sectionKey: 'port-3' })).toBe(true);
  });

  it('keeps branding enabled for transaction exports regardless of port id', () => {
    expect(shouldUseTayAlRawiBranding({ transaction: { PortID: 3 } })).toBe(true);
  });

  it('keeps branding enabled for all other sections too', () => {
    expect(shouldUseTayAlRawiBranding({ sectionKey: 'port-1' })).toBe(true);
  });
});

describe('formatEnglishLongDate', () => {
  it('returns long english date for footer usage', () => {
    expect(formatEnglishLongDate('2026-04-07')).toContain('2026');
  });
});

describe('TAY_ALRAWI_BRAND_ASSETS', () => {
  it('exposes a dedicated invoice footer asset', () => {
    expect(TAY_ALRAWI_BRAND_ASSETS.invoiceFooter).toContain('invoice-footer');
  });
});

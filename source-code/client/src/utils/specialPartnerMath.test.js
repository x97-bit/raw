import { describe, expect, it } from 'vitest';
import {
  buildSpecialPartnerTotals,
  getSpecialPartnerRowAmountFor,
  getSpecialPartnerRowAmountForIqd,
} from './specialPartnerMath';

describe('specialPartnerMath', () => {
  it('keeps partner USD separate from IQD fees', () => {
    const row = {
      AmountUSD_Partner: 13500,
      CLR: 600,
      DifferenceIQD: 100,
      TX: 535,
      TaxiWater: 0,
    };

    expect(getSpecialPartnerRowAmountFor(row)).toBe(13500);
    expect(getSpecialPartnerRowAmountForIqd(row)).toBe(1235);
  });

  it('calculates separated USD and IQD totals', () => {
    const totals = buildSpecialPartnerTotals([
      { AmountUSD: 9500, AmountUSD_Partner: 0, CLR: 600, DifferenceIQD: 100, TX: 0, TaxiWater: 0 },
      { AmountUSD: 9500, AmountUSD_Partner: 13500, CLR: 600, DifferenceIQD: 100, TX: 535, TaxiWater: 0 },
    ]);

    expect(totals.totalAmountUSD).toBe(19000);
    expect(totals.totalAmountIQD).toBe(0);
    expect(totals.totalPartnerBaseUSD).toBe(13500);
    expect(totals.totalCLR).toBe(1200);
    expect(totals.totalDifferenceIQD).toBe(200);
    expect(totals.totalTaxiAndOfficer).toBe(535);
    expect(totals.totalPartnerUSD).toBe(13500);
    expect(totals.totalPartnerIQD).toBe(1935);
    expect(totals.totalNetUSD).toBe(5500);
    expect(totals.totalNetIQD).toBe(-1935);
  });
});

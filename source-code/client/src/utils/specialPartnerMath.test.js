import { describe, expect, it } from 'vitest';
import { buildSpecialPartnerTotals, getSpecialPartnerRowAmountFor } from './specialPartnerMath';

describe('specialPartnerMath', () => {
  it('treats المبلغ له as partner amount plus clearance, difference, and taxi/officer fees', () => {
    const row = {
      AmountUSD_Partner: 13500,
      CLR: 600,
      DifferenceIQD: 100,
      TX: 535,
      TaxiWater: 0,
    };

    expect(getSpecialPartnerRowAmountFor(row)).toBe(14735);
  });

  it('calculates الصافي as عليه minus له', () => {
    const totals = buildSpecialPartnerTotals([
      { AmountUSD: 9500, AmountUSD_Partner: 0, CLR: 600, DifferenceIQD: 100, TX: 0, TaxiWater: 0 },
      { AmountUSD: 9500, AmountUSD_Partner: 13500, CLR: 600, DifferenceIQD: 100, TX: 535, TaxiWater: 0 },
    ]);

    expect(totals.totalAmountUSD).toBe(19000);
    expect(totals.totalPartnerBaseUSD).toBe(13500);
    expect(totals.totalCLR).toBe(1200);
    expect(totals.totalDifferenceIQD).toBe(200);
    expect(totals.totalTaxiAndOfficer).toBe(535);
    expect(totals.totalPartnerUSD).toBe(15435);
    expect(totals.totalNetUSD).toBe(3565);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildSpecialHaiderTotals,
  isSpecialHaiderSettlementRow,
} from "./specialHaiderMath";

describe("specialHaiderMath", () => {
  it("calculates Haider totals including meters", () => {
    const totals = buildSpecialHaiderTotals([
      {
        Weight: 23600,
        Meters: 14,
        AmountUSD: 1780,
        AmountIQD: 6515000,
        DifferenceIQD: 2700000,
      },
      {
        Weight: 0,
        Meters: 6,
        AmountUSD: -40000,
        AmountIQD: 0,
        DifferenceIQD: 0,
      },
      {
        Weight: 0,
        Meters: 0,
        AmountUSD: 0,
        AmountIQD: -58440000,
        DifferenceIQD: -91560000,
      },
    ]);

    expect(totals.totalWeight).toBe(23600);
    expect(totals.totalMeters).toBe(20);
    expect(totals.totalAmountUSD).toBe(-38220);
    expect(totals.totalAmountIQD).toBe(-51925000);
    expect(totals.totalDifferenceIQD).toBe(-88860000);
    expect(totals.totalGrandIQD).toBe(-140785000);
  });

  it("detects settlement rows by the absence of shipment identity fields", () => {
    expect(
      isSpecialHaiderSettlementRow({
        DriverName: null,
        PlateNumber: null,
        GoodType: null,
      })
    ).toBe(true);
    expect(
      isSpecialHaiderSettlementRow({
        DriverName: "driver",
        PlateNumber: "123",
        GoodType: "pipes",
      })
    ).toBe(false);
  });
});

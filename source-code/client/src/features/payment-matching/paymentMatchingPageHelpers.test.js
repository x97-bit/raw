import { describe, expect, it } from "vitest";
import {
  buildPaymentProgress,
  formatAllocationAmount,
  formatOutstandingAmount,
  formatPaidAmount,
  formatPaymentMatchingNumber,
} from "./paymentMatchingPageHelpers";

describe("paymentMatchingPageHelpers", () => {
  it("formats payment matching numbers consistently", () => {
    expect(formatPaymentMatchingNumber(12500)).toBe("12,500");
    expect(formatPaymentMatchingNumber(0)).toBe("0");
  });

  it("formats outstanding and paid amounts with usd/iqd fallbacks", () => {
    expect(formatOutstandingAmount(10, 5000)).toBe("$10 + 5,000 د.ع");
    expect(formatOutstandingAmount(0, 5000)).toBe("5,000 د.ع");
    expect(formatOutstandingAmount(0, 0)).toBe("-");
    expect(formatPaidAmount(15, 0)).toBe("$15");
    expect(formatPaidAmount(0, 2500)).toBe("2,500 د.ع");
    expect(formatPaidAmount(0, 0)).toBe("-");
  });

  it("formats allocation rows via shared amount formatting", () => {
    expect(
      formatAllocationAmount({ allocated_usd: 4, allocated_iqd: 1000 })
    ).toBe("$4 + 1,000 د.ع");
  });

  it("builds progress percentages from dashboard stats", () => {
    expect(
      buildPaymentProgress({
        paid: { count: 2 },
        partial: { count: 1 },
        unpaid: { count: 1 },
      })
    ).toEqual({
      total: 4,
      paidPct: 50,
      partialPct: 25,
    });
  });
});

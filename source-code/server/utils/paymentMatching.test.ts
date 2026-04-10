import { describe, expect, it } from "vitest";
import { getPaymentStatus, getRemainingAmounts } from "./paymentMatching";

describe("getRemainingAmounts", () => {
  it("never returns negative balances", () => {
    expect(getRemainingAmounts(10, 5000, 25, 7000)).toEqual({
      remainingUsd: 0,
      remainingIqd: 0,
    });
  });
});

describe("getPaymentStatus", () => {
  it("returns paid when both balances are fully settled", () => {
    expect(getPaymentStatus(100, 0, 100, 0)).toEqual({
      status: "paid",
      remainingUsd: 0,
      remainingIqd: 0,
    });
  });

  it("returns partial when any amount was paid but balance remains", () => {
    expect(getPaymentStatus(100, 25000, 25, 0)).toEqual({
      status: "partial",
      remainingUsd: 75,
      remainingIqd: 25000,
    });
  });

  it("returns unpaid when nothing was settled yet", () => {
    expect(getPaymentStatus(100, 0, 0, 0)).toEqual({
      status: "unpaid",
      remainingUsd: 100,
      remainingIqd: 0,
    });
  });
});

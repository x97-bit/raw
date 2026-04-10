import { describe, expect, it } from "vitest";
import { addRunningBalances, calculateTransactionTotals } from "./transactionSummaries";

describe("transaction summary helpers", () => {
  it("calculates invoice and payment totals across legacy and current direction values", () => {
    const totals = calculateTransactionTotals([
      { direction: "IN", amountUsd: "1000", costUsd: "700", feeUsd: "25", weight: "12500" },
      { direction: "out", amountUsd: "-300" },
      { direction: "CR", amountUsd: "200", amountIqd: "-150000" },
      { direction: "DR", amountIqd: "500000", costIqd: "320000", Weight: "3600" },
    ]);

    expect(totals.count).toBe(4);
    expect(totals.invoiceCount).toBe(2);
    expect(totals.paymentCount).toBe(2);
    expect(totals.shipmentCount).toBe(2);
    expect(totals.totalWeight).toBe(16100);
    expect(totals.totalInvoicesUSD).toBe(1000);
    expect(totals.totalInvoicesIQD).toBe(500000);
    expect(totals.totalPaymentsUSD).toBe(500);
    expect(totals.totalPaymentsIQD).toBe(150000);
    expect(totals.totalCostUSD).toBe(700);
    expect(totals.totalCostIQD).toBe(320000);
    expect(totals.totalProfitUSD).toBe(300);
    expect(totals.totalProfitIQD).toBe(180000);
    expect(totals.totalFeeUSD).toBe(25);
    expect(totals.balanceUSD).toBe(500);
    expect(totals.balanceIQD).toBe(350000);
  });

  it("builds running balances from mapped rows without trusting stored signs", () => {
    const rows = addRunningBalances([
      { TransTypeID: 1, AmountUSD: 1000, AmountIQD: 0 },
      { TransTypeID: 2, AmountUSD: -300, AmountIQD: 0 },
      { direction: "OUT", amountUsd: "250", amountIqd: "100000" },
      { direction: "DR", amountUsd: "50", amountIqd: "0" },
    ]);

    expect(rows.map((row) => row.runningUSD)).toEqual([1000, 700, 450, 500]);
    expect(rows.map((row) => row.runningIQD)).toEqual([0, 0, -100000, -100000]);
  });
});

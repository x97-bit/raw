import { describe, expect, it } from "vitest";
import { addRunningBalances, calculateTransactionTotals } from "./utils/transactionSummaries";

describe("Profit Calculation Logic", () => {
  it("calculates invoice profit from amount minus cost", () => {
    const totals = calculateTransactionTotals([
      { direction: "IN", amountUsd: "1000", costUsd: "800" },
      { direction: "DR", amountUsd: "500", costUsd: "300" },
    ]);

    expect(totals.totalInvoicesUSD).toBe(1500);
    expect(totals.totalCostUSD).toBe(1100);
    expect(totals.totalProfitUSD).toBe(400);
  });

  it("ignores payment rows in profit totals", () => {
    const totals = calculateTransactionTotals([
      { direction: "OUT", amountUsd: "-1000", costUsd: "800" },
      { direction: "CR", amountUsd: "500", costUsd: "100" },
    ]);

    expect(totals.totalInvoicesUSD).toBe(0);
    expect(totals.totalCostUSD).toBe(0);
    expect(totals.totalProfitUSD).toBe(0);
    expect(totals.totalPaymentsUSD).toBe(1500);
  });

  it("handles null and missing values safely", () => {
    const totals = calculateTransactionTotals([
      { direction: "IN", amountUsd: null, costUsd: null },
      { direction: "DR", amountUsd: "1000", costUsd: null },
      { direction: "IN", amountUsd: null, costUsd: "500" },
    ]);

    expect(totals.totalInvoicesUSD).toBe(1000);
    expect(totals.totalCostUSD).toBe(500);
    expect(totals.totalProfitUSD).toBe(500);
  });

  it("supports negative profit scenarios", () => {
    const totals = calculateTransactionTotals([
      { direction: "IN", amountUsd: "500", costUsd: "800" },
    ]);

    expect(totals.totalProfitUSD).toBe(-300);
  });
});

describe("Running Balance Logic", () => {
  it("accumulates invoice rows as positive and payment rows as negative", () => {
    const rows = addRunningBalances([
      { direction: "DR", amountUsd: 1000 },
      { direction: "IN", amountUsd: 500 },
      { direction: "CR", amountUsd: 300 },
    ]);

    expect(rows[0].runningUSD).toBe(1000);
    expect(rows[1].runningUSD).toBe(1500);
    expect(rows[2].runningUSD).toBe(1200);
  });

  it("normalizes stored negative payment values", () => {
    const rows = addRunningBalances([
      { direction: "OUT", amountUsd: -500 },
      { direction: "CR", amountUsd: 300 },
    ]);

    expect(rows[0].runningUSD).toBe(-500);
    expect(rows[1].runningUSD).toBe(-800);
  });

  it("handles empty transactions", () => {
    expect(addRunningBalances([])).toEqual([]);
  });
});

describe("Trial Balance Opening/Closing Balance Logic", () => {
  interface Transaction {
    direction: string;
    amountUsd: number;
    transDate: string;
    accountId: number;
  }

  function computeTrialBalanceRow(
    accountId: number,
    allTxns: Transaction[],
    startDate: string | null,
    endDate: string | null,
  ) {
    const accAllTxns = allTxns.filter((t) => t.accountId === accountId);
    const priorTxns = startDate
      ? accAllTxns.filter((t) => t.transDate < startDate)
      : [];

    let periodTxns = accAllTxns;
    if (startDate) periodTxns = periodTxns.filter((t) => t.transDate >= startDate);
    if (endDate) periodTxns = periodTxns.filter((t) => t.transDate <= endDate);

    const openingTotals = calculateTransactionTotals(priorTxns);
    const periodTotals = calculateTransactionTotals(periodTxns);

    return {
      openingBalanceUSD: openingTotals.balanceUSD,
      debitUSD: periodTotals.totalInvoicesUSD,
      creditUSD: periodTotals.totalPaymentsUSD,
      closingBalanceUSD: openingTotals.balanceUSD + periodTotals.balanceUSD,
    };
  }

  it("computes opening balance from prior transactions", () => {
    const txns: Transaction[] = [
      { direction: "IN", amountUsd: 1000, transDate: "2025-01-15", accountId: 1 },
      { direction: "OUT", amountUsd: -300, transDate: "2025-01-20", accountId: 1 },
      { direction: "DR", amountUsd: 500, transDate: "2025-02-10", accountId: 1 },
    ];
    const result = computeTrialBalanceRow(1, txns, "2025-02-01", "2025-02-28");

    expect(result.openingBalanceUSD).toBe(700);
    expect(result.debitUSD).toBe(500);
    expect(result.creditUSD).toBe(0);
    expect(result.closingBalanceUSD).toBe(1200);
  });

  it("has zero opening balance when no start date", () => {
    const txns: Transaction[] = [
      { direction: "IN", amountUsd: 1000, transDate: "2025-01-15", accountId: 1 },
    ];
    const result = computeTrialBalanceRow(1, txns, null, null);

    expect(result.openingBalanceUSD).toBe(0);
    expect(result.debitUSD).toBe(1000);
    expect(result.closingBalanceUSD).toBe(1000);
  });

  it("handles negative closing balance", () => {
    const txns: Transaction[] = [
      { direction: "CR", amountUsd: 1000, transDate: "2025-01-15", accountId: 1 },
      { direction: "IN", amountUsd: 300, transDate: "2025-02-10", accountId: 1 },
    ];
    const result = computeTrialBalanceRow(1, txns, "2025-02-01", "2025-02-28");

    expect(result.openingBalanceUSD).toBe(-1000);
    expect(result.debitUSD).toBe(300);
    expect(result.closingBalanceUSD).toBe(-700);
  });

  it("separates accounts correctly", () => {
    const txns: Transaction[] = [
      { direction: "IN", amountUsd: 1000, transDate: "2025-01-15", accountId: 1 },
      { direction: "DR", amountUsd: 2000, transDate: "2025-01-15", accountId: 2 },
    ];
    const result1 = computeTrialBalanceRow(1, txns, null, null);
    const result2 = computeTrialBalanceRow(2, txns, null, null);

    expect(result1.debitUSD).toBe(1000);
    expect(result2.debitUSD).toBe(2000);
  });
});

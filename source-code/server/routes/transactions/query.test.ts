import { describe, expect, it } from "vitest";
import { normalizeTransactionQueryResult } from "./query";

describe("normalizeTransactionQueryResult", () => {
  it("maps paged rows and preserves summary values", () => {
    const result = normalizeTransactionQueryResult([
      {
        id: 5,
        refNo: "INV-005",
        direction: "IN",
        transDate: "2026-04-10",
        accountId: "7",
        currency: "USD",
        amountUsd: "150.50",
        amountIqd: "0",
        costUsd: "25.25",
        costIqd: "0",
        feeUsd: "5",
        totalCount: "2",
        shipmentCount: "1",
        totalWeight: "12.5",
        totalInvoicesUSD: "150.50",
        totalInvoicesIQD: "0",
        totalPaymentsUSD: "40",
        totalPaymentsIQD: "0",
        totalCostUSD: "25.25",
        totalCostIQD: "0",
        totalProfitUSD: "125.25",
        totalProfitIQD: "0",
        balanceUSD: "110.5",
        balanceIQD: "0",
      },
      {
        id: 4,
        refNo: "PAY-004",
        direction: "OUT",
        transDate: "2026-04-09",
        accountId: 7,
        currency: "USD",
        amountUsd: "40",
        amountIqd: "0",
        costUsd: "0",
        costIqd: "0",
        feeUsd: "0",
        totalCount: "2",
        shipmentCount: "1",
        totalWeight: "12.5",
        totalInvoicesUSD: "150.50",
        totalInvoicesIQD: "0",
        totalPaymentsUSD: "40",
        totalPaymentsIQD: "0",
        totalCostUSD: "25.25",
        totalCostIQD: "0",
        totalProfitUSD: "125.25",
        totalProfitIQD: "0",
        balanceUSD: "110.5",
        balanceIQD: "0",
      },
    ]);

    expect(result.total).toBe(2);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      id: 5,
      refNo: "INV-005",
      direction: "IN",
      transDate: "2026-04-10",
      accountId: 7,
      currency: "USD",
    });
    expect(result.summary).toEqual({
      count: 2,
      shipmentCount: 1,
      totalWeight: 12.5,
      totalInvoicesUSD: 150.5,
      totalInvoicesIQD: 0,
      totalPaymentsUSD: 40,
      totalPaymentsIQD: 0,
      totalCostUSD: 25.25,
      totalCostIQD: 0,
      totalProfitUSD: 125.25,
      totalProfitIQD: 0,
      balanceUSD: 110.5,
      balanceIQD: 0,
    });
  });

  it("returns an empty page when the query only yields the summary row", () => {
    const result = normalizeTransactionQueryResult([
      {
        id: null,
        direction: null,
        transDate: null,
        accountId: null,
        totalCount: "0",
        shipmentCount: "0",
        totalWeight: "0",
        totalInvoicesUSD: "0",
        totalInvoicesIQD: "0",
        totalPaymentsUSD: "0",
        totalPaymentsIQD: "0",
        totalCostUSD: "0",
        totalCostIQD: "0",
        totalProfitUSD: "0",
        totalProfitIQD: "0",
        balanceUSD: "0",
        balanceIQD: "0",
      },
    ]);

    expect(result.rows).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.summary).toMatchObject({
      count: 0,
      shipmentCount: 0,
      totalWeight: 0,
      totalInvoicesUSD: 0,
      totalPaymentsUSD: 0,
      totalProfitUSD: 0,
      balanceUSD: 0,
    });
  });
});

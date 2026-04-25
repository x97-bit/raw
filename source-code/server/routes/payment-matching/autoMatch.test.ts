import { describe, expect, it } from "vitest";
import { AUTO_MATCH_NOTE } from "./mutationShared";
import { buildAutoMatchAllocations } from "./autoMatch";

describe("buildAutoMatchAllocations", () => {
  it("keeps earlier invoices available for later payments when currencies differ", () => {
    const allocations = buildAutoMatchAllocations(
      [
        {
          payment_id: 10,
          account_id: 1,
          total_usd: "50",
          total_iqd: "0",
          used_usd: "0",
          used_iqd: "0",
        },
        {
          payment_id: 11,
          account_id: 1,
          total_usd: "0",
          total_iqd: "100",
          used_usd: "0",
          used_iqd: "0",
        },
      ],
      [
        {
          invoice_id: 1,
          account_id: 1,
          amount_usd: "0",
          amount_iqd: "100",
          paid_usd: "0",
          paid_iqd: "0",
        },
        {
          invoice_id: 2,
          account_id: 1,
          amount_usd: "50",
          amount_iqd: "0",
          paid_usd: "0",
          paid_iqd: "0",
        },
      ]
    );

    expect(allocations).toEqual([
      {
        invoiceId: 2,
        paymentId: 10,
        amountUSD: "50",
        amountIQD: "0",
        notes: AUTO_MATCH_NOTE,
      },
      {
        invoiceId: 1,
        paymentId: 11,
        amountUSD: "0",
        amountIQD: "100",
        notes: AUTO_MATCH_NOTE,
      },
    ]);
  });

  it("respects existing allocations and carries remaining balances across invoices", () => {
    const allocations = buildAutoMatchAllocations(
      [
        {
          payment_id: 20,
          account_id: 4,
          total_usd: "90",
          total_iqd: "500",
          used_usd: "10",
          used_iqd: "100",
        },
      ],
      [
        {
          invoice_id: 30,
          account_id: 4,
          amount_usd: "40",
          amount_iqd: "250",
          paid_usd: "10",
          paid_iqd: "50",
        },
        {
          invoice_id: 31,
          account_id: 4,
          amount_usd: "100",
          amount_iqd: "300",
          paid_usd: "50",
          paid_iqd: "0",
        },
      ]
    );

    expect(allocations).toEqual([
      {
        invoiceId: 30,
        paymentId: 20,
        amountUSD: "30",
        amountIQD: "200",
        notes: AUTO_MATCH_NOTE,
      },
      {
        invoiceId: 31,
        paymentId: 20,
        amountUSD: "50",
        amountIQD: "200",
        notes: AUTO_MATCH_NOTE,
      },
    ]);
  });
});

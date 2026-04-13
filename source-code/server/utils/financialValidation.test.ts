import { describe, expect, it } from "vitest";
import {
  debtCreateSchema,
  expenseMutationSchema,
  expenseUpdateSchema,
  paymentMatchingCreateSchema,
  transactionCreateSchema,
  transactionUpdateSchema,
} from "./financialValidation";

describe("financial validation schemas", () => {
  it("accepts a valid transaction create payload", () => {
    const parsed = transactionCreateSchema.parse({
      refNo: "QAIM-INV000001",
      direction: "IN",
      transDate: "2026-04-08",
      accountId: 5,
      currency: "usd",
      driverId: null,
      vehicleId: null,
      goodTypeId: null,
      weight: "12500.5",
      meters: null,
      costUsd: "100",
      amountUsd: "150",
      costIqd: "0",
      amountIqd: "0",
      feeUsd: "0",
      syrCus: "0",
      carQty: null,
      transPrice: null,
      carrierId: null,
      qty: 4,
      companyId: null,
      companyName: null,
      govId: null,
      notes: null,
      traderNote: null,
      recordType: "shipment",
      portId: "port-3",
      accountType: "trader",
      createdBy: 1,
    });

    expect(parsed.currency).toBe("USD");
    expect(parsed.qty).toBe(4);
  });

  it("rejects invalid transaction updates", () => {
    expect(() =>
      transactionUpdateSchema.parse({
        accountId: null,
      }),
    ).toThrow();
  });

  it("accepts a valid debt payload", () => {
    const parsed = debtCreateSchema.parse({
      debtorName: "مدين اختبار",
      amountUSD: "100",
      amountIQD: "0",
      feeUSD: "0",
      feeIQD: "0",
      paidAmountUSD: "0",
      paidAmountIQD: "0",
      transType: null,
      fxRate: null,
      driverName: null,
      carNumber: null,
      goodType: null,
      weight: null,
      meters: null,
      description: "",
      date: "2026-04-08",
      status: "pending",
      state: null,
      fxNote: null,
    });

    expect(parsed.debtorName).toBe("مدين اختبار");
  });

  it("accepts a valid expense payload", () => {
    const parsed = expenseMutationSchema.parse({
      expenseDate: "2026-04-08",
      amountUSD: "25",
      amountIQD: "0",
      description: "مصروف",
      portId: "general",
      chargeTarget: "port",
      accountId: null,
      accountName: null,
      createdBy: 1,
    });

    expect(parsed.portId).toBe("general");
    expect(parsed.chargeTarget).toBe("port");
  });

  it("accepts partial expense updates and rejects empty ones", () => {
    const parsed = expenseUpdateSchema.parse({
      amountUSD: "25",
    });

    expect(parsed.amountUSD).toBe("25");
    expect(() => expenseUpdateSchema.parse({})).toThrow();
  });

  it("rejects zero-value payment matches", () => {
    expect(() =>
      paymentMatchingCreateSchema.parse({
        invoiceId: 1,
        paymentId: 2,
        amountUSD: "0",
        amountIQD: "0",
        notes: null,
      }),
    ).toThrow();
  });
});

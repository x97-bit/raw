import { describe, expect, it } from "vitest";
import {
  hasBodyKey,
  hasBodyValue,
  mapAccount,
  mapTransaction,
  parseNullableNumber,
  parseOptionalDecimal,
  parseOptionalInt,
  pickBodyField,
} from "./apiRouteHelpers";

describe("apiRouteHelpers", () => {
  it("maps legacy account fields", () => {
    expect(
      mapAccount({
        id: 9,
        name: "Test Account",
        accountType: 4,
        portId: "QAIM",
        phone: "123",
        notes: "note",
      })
    ).toMatchObject({
      AccountID: 9,
      AccountName: "Test Account",
      AccountTypeID: 4,
      DefaultPortID: "QAIM",
      Phone: "123",
      Notes: "note",
    });
  });

  it("maps transaction names and profit fields", () => {
    expect(
      mapTransaction(
        {
          id: 11,
          refNo: "INV-11",
          direction: "IN",
          transDate: "2026-01-01",
          accountId: 5,
          currency: "USD",
          amountUsd: "150",
          costUsd: "100",
          amountIqd: "0",
          costIqd: "0",
          feeUsd: "5",
          syrCus: "0",
          portId: "SA",
          accountType: "4",
          createdBy: 1,
          notes: "ok",
          traderNote: "t",
          recordType: "shipment",
          companyName: "ACME",
        },
        "Driver",
        "11A",
        "Goods",
        "Baghdad"
      )
    ).toMatchObject({
      TransTypeID: 1,
      TransTypeName: "فاتورة",
      DriverName: "Driver",
      VehiclePlate: "11A",
      GoodTypeName: "Goods",
      Governorate: "Baghdad",
      ProfitUSD: 50,
    });
  });

  it("maps debit-note transactions as a separate display type without profit", () => {
    expect(
      mapTransaction({
        id: 12,
        refNo: "DBN-12",
        direction: "IN",
        transDate: "2026-01-02",
        accountId: 5,
        currency: "USD",
        amountUsd: "150",
        costUsd: "0",
        amountIqd: "0",
        costIqd: "0",
        feeUsd: "0",
        syrCus: "0",
        portId: "SA",
        accountType: "4",
        createdBy: 1,
        recordType: "debit-note",
      })
    ).toMatchObject({
      TransTypeID: 3,
      TransTypeName: "سند إضافة",
      ProfitUSD: 0,
    });
  });

  it("parses numeric body helpers safely", () => {
    expect(hasBodyValue("")).toBe(false);
    expect(hasBodyValue("0")).toBe(true);
    expect(parseOptionalInt("42")).toBe(42);
    expect(parseOptionalInt("x")).toBeUndefined();
    expect(parseOptionalDecimal("42.5")).toBe("42.5");
    expect(parseOptionalDecimal("bad")).toBeUndefined();
    expect(parseNullableNumber("7.5")).toBe(7.5);
    expect(parseNullableNumber("")).toBeNull();
  });

  it("picks first non-empty body field and detects keys", () => {
    const body = {
      accountId: "",
      AccountID: 18,
      notes: null,
      Notes: "hello",
    };

    expect(pickBodyField(body, "accountId", "AccountID")).toBe(18);
    expect(pickBodyField(body, "notes", "Notes")).toBe("hello");
    expect(hasBodyKey(body, "missing", "Notes")).toBe(true);
    expect(hasBodyKey(body, "missing")).toBe(false);
  });
});

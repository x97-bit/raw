import { describe, expect, it } from "vitest";
import { buildTransactionFormDefaults } from "./formDefaults";

describe("buildTransactionFormDefaults", () => {
  it("prefers explicit account defaults over recent transaction values", () => {
    const result = buildTransactionFormDefaults({
      accountCurrency: "IQD",
      accountDefaults: {
        defaultCurrency: "USD",
        defaultDriver: { id: 7, name: "سائق افتراضي" },
        defaultCompany: { id: 3, name: "شركة افتراضية" },
        defaultFeeUsd: 25,
        defaultCarQty: 2,
      },
      recentTransaction: {
        Currency: "BOTH",
        DriverID: 11,
        DriverName: "سائق قديم",
        CompanyID: 9,
        CompanyName: "شركة قديمة",
        CarQty: 4,
      },
    });

    expect(result.Currency).toBe("USD");
    expect(result.DriverID).toBe(7);
    expect(result.DriverName).toBe("سائق افتراضي");
    expect(result.CompanyID).toBe(3);
    expect(result.CompanyName).toBe("شركة افتراضية");
    expect(result.FeeUSD).toBe(25);
    expect(result.CarQty).toBe(2);
  });

  it("falls back to route and recent transaction data when account defaults are absent", () => {
    const result = buildTransactionFormDefaults({
      accountCurrency: "IQD",
      routeDefaults: {
        gov: { id: 4, name: "بغداد" },
        defaultTransPrice: 450000,
        defaultFeeUsd: 12,
      },
      recentTransaction: {
        Currency: "USD",
        VehicleID: 14,
        VehiclePlate: "12345",
        GoodTypeID: 6,
        GoodTypeName: "شعير",
        CarQty: 3,
      },
    });

    expect(result.Currency).toBe("USD");
    expect(result.GovID).toBe(4);
    expect(result.GovName).toBe("بغداد");
    expect(result.VehicleID).toBe(14);
    expect(result.VehiclePlate).toBe("12345");
    expect(result.GoodTypeID).toBe(6);
    expect(result.GoodTypeName).toBe("شعير");
    expect(result.TransPrice).toBe(450000);
    expect(result.FeeUSD).toBe(12);
    expect(result.CarQty).toBe(3);
  });

  it("keeps zero values instead of treating them as missing", () => {
    const result = buildTransactionFormDefaults({
      accountDefaults: {
        defaultFeeUsd: 0,
        defaultCarQty: 0,
      },
      routeDefaults: {
        defaultTransPrice: 0,
      },
    });

    expect(result.FeeUSD).toBe(0);
    expect(result.CarQty).toBe(0);
    expect(result.TransPrice).toBe(0);
  });
});

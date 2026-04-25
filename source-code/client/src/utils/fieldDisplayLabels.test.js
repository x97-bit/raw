import { describe, expect, it } from "vitest";
import {
  getFieldDisplayLabel,
  isStandardFieldLabel,
} from "./fieldDisplayLabels";

describe("fieldDisplayLabels", () => {
  it("returns the shared screen labels for standard transaction fields", () => {
    expect(getFieldDisplayLabel("amount_usd")).toBe("المبلغ دولار");
    expect(getFieldDisplayLabel("AmountUSD")).toBe("المبلغ دولار");
    expect(getFieldDisplayLabel("cost_iqd")).toBe("الكلفة دينار");
    expect(getFieldDisplayLabel("DriverName")).toBe("اسم السائق");
  });

  it("returns the compact export variant for USD money fields only", () => {
    expect(
      getFieldDisplayLabel("AmountUSD", { variant: "compact-export" })
    ).toBe("المبلغ $");
    expect(getFieldDisplayLabel("CostUSD", { variant: "compact-export" })).toBe(
      "الكلفة $"
    );
    expect(
      getFieldDisplayLabel("AmountIQD", { variant: "compact-export" })
    ).toBe("المبلغ دينار");
  });

  it("returns payment reference label only in payment context", () => {
    expect(getFieldDisplayLabel("ref_no")).toBe("رقم الفاتورة");
    expect(getFieldDisplayLabel("ref_no", { variant: "payment-ref" })).toBe(
      "رقم سند القبض"
    );
  });

  it("keeps unknown keys on their fallback labels", () => {
    expect(
      getFieldDisplayLabel("account_name", { fallback: "اسم الشريك" })
    ).toBe("اسم الشريك");
    expect(isStandardFieldLabel("account_name")).toBe(false);
    expect(isStandardFieldLabel("amount_usd")).toBe(true);
  });
});

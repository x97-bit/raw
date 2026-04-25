import { describe, expect, it } from "vitest";
import {
  getAbsoluteAmount,
  getDirectionAliases,
  getSignedDirectionAmount,
  getStoredDirectionValue,
  isInvoiceDirection,
  isPaymentDirection,
  normalizeDirectionValue,
} from "./direction";

describe("direction helpers", () => {
  it("normalizes invoice aliases to IN", () => {
    expect(normalizeDirectionValue("IN")).toBe("IN");
    expect(normalizeDirectionValue("in")).toBe("IN");
    expect(normalizeDirectionValue("DR")).toBe("IN");
    expect(normalizeDirectionValue(1)).toBe("IN");
  });

  it("normalizes payment aliases to OUT", () => {
    expect(normalizeDirectionValue("OUT")).toBe("OUT");
    expect(normalizeDirectionValue("out")).toBe("OUT");
    expect(normalizeDirectionValue("CR")).toBe("OUT");
    expect(normalizeDirectionValue(2)).toBe("OUT");
  });

  it("detects invoice and payment directions across legacy values", () => {
    expect(isInvoiceDirection("IN")).toBe(true);
    expect(isInvoiceDirection("DR")).toBe(true);
    expect(isPaymentDirection("OUT")).toBe(true);
    expect(isPaymentDirection("CR")).toBe(true);
  });

  it("returns stored direction values for writes and filters", () => {
    expect(getStoredDirectionValue("DR")).toBe("IN");
    expect(getStoredDirectionValue("CR")).toBe("OUT");
    expect(getStoredDirectionValue("IN")).toBe("IN");
    expect(getStoredDirectionValue("OUT")).toBe("OUT");
  });

  it("expands aliases for query filters", () => {
    expect(getDirectionAliases("IN")).toEqual(["IN", "in", "DR", "dr"]);
    expect(getDirectionAliases("OUT")).toEqual(["OUT", "out", "CR", "cr"]);
  });

  it("normalizes monetary values by direction", () => {
    expect(getAbsoluteAmount(-1250)).toBe(1250);
    expect(getSignedDirectionAmount(-1250, "IN")).toBe(1250);
    expect(getSignedDirectionAmount(1250, "OUT")).toBe(-1250);
    expect(getSignedDirectionAmount(-1250, "OUT")).toBe(-1250);
  });
});

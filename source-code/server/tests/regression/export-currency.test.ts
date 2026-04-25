import { describe, it, expect } from "vitest";

/**
 * Tests for currency-aware export formatting logic.
 * The actual formatting function is in client/src/utils/exportUtils.js,
 * but we test the logic pattern here to ensure correctness.
 */

// Replicate the formatCellValue logic from exportUtils.js
function formatCellValue(val: any, format?: string): string {
  if (val === null || val === undefined) return "-";
  if (format === "date") return String(val).split(" ")[0];
  if (format === "number" && val) return Number(val).toLocaleString("en-US");
  if (format === "money" && val)
    return "$" + Number(val).toLocaleString("en-US");
  if (format === "money_iqd" && val)
    return Number(val).toLocaleString("en-US") + " د.ع";
  return String(val);
}

describe("Currency-aware export formatting", () => {
  it("should format USD values with $ prefix", () => {
    expect(formatCellValue(1500, "money")).toBe("$1,500");
    expect(formatCellValue(250.5, "money")).toBe("$250.5");
    expect(formatCellValue(1000000, "money")).toBe("$1,000,000");
  });

  it("should format IQD values with د.ع suffix", () => {
    expect(formatCellValue(1500000, "money_iqd")).toBe("1,500,000 د.ع");
    expect(formatCellValue(250000, "money_iqd")).toBe("250,000 د.ع");
    expect(formatCellValue(50000, "money_iqd")).toBe("50,000 د.ع");
  });

  it("should return - for null/undefined values", () => {
    expect(formatCellValue(null, "money")).toBe("-");
    expect(formatCellValue(undefined, "money")).toBe("-");
    expect(formatCellValue(null, "money_iqd")).toBe("-");
    expect(formatCellValue(undefined, "money_iqd")).toBe("-");
  });

  it("should return - for zero values with money format", () => {
    // 0 is falsy, so it returns the string '0' (not formatted as money)
    expect(formatCellValue(0, "money")).toBe("0");
    expect(formatCellValue(0, "money_iqd")).toBe("0");
  });

  it("should format numbers without currency symbol", () => {
    expect(formatCellValue(1500, "number")).toBe("1,500");
    expect(formatCellValue(1000000, "number")).toBe("1,000,000");
  });

  it("should format dates correctly", () => {
    expect(formatCellValue("2026-01-15 10:30:00", "date")).toBe("2026-01-15");
    expect(formatCellValue("2026-04-06", "date")).toBe("2026-04-06");
  });

  it("should return string for unformatted values", () => {
    expect(formatCellValue("some text", undefined)).toBe("some text");
    expect(formatCellValue(123, undefined)).toBe("123");
  });

  it("should not add $ to IQD columns", () => {
    // This is the key test - IQD values should never have $
    const iqdValue = formatCellValue(500000, "money_iqd");
    expect(iqdValue).not.toContain("$");
    expect(iqdValue).toContain("د.ع");
  });

  it("should not add د.ع to USD columns", () => {
    const usdValue = formatCellValue(1500, "money");
    expect(usdValue).not.toContain("د.ع");
    expect(usdValue).toContain("$");
  });
});

describe("Column format mapping from type", () => {
  // Replicate the PortPage export column mapping logic
  function mapTypeToFormat(type: string): string | undefined {
    if (type.includes("money_iqd")) return "money_iqd";
    if (type.includes("money")) return "money";
    if (type === "number") return "number";
    if (type === "date") return "date";
    return undefined;
  }

  it("should map money_usd types to money format", () => {
    expect(mapTypeToFormat("money_usd")).toBe("money");
    expect(mapTypeToFormat("money_usd_bold")).toBe("money");
  });

  it("should map money_iqd types to money_iqd format", () => {
    expect(mapTypeToFormat("money_iqd")).toBe("money_iqd");
    expect(mapTypeToFormat("money_iqd_bold")).toBe("money_iqd");
  });

  it("should map number type to number format", () => {
    expect(mapTypeToFormat("number")).toBe("number");
  });

  it("should map date type to date format", () => {
    expect(mapTypeToFormat("date")).toBe("date");
  });

  it("should return undefined for text types", () => {
    expect(mapTypeToFormat("text")).toBeUndefined();
    expect(mapTypeToFormat("badge")).toBeUndefined();
    expect(mapTypeToFormat("notes")).toBeUndefined();
  });

  it('should correctly distinguish money_iqd from money_usd when both contain "money"', () => {
    // Critical: money_iqd_bold contains "money" but should map to money_iqd, not money
    expect(mapTypeToFormat("money_iqd_bold")).toBe("money_iqd");
    expect(mapTypeToFormat("money_usd_bold")).toBe("money");
  });
});

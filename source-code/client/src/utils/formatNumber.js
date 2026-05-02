/**
 * Smart currency-aware number formatting.
 *
 * USD  → 2 decimal places, comma-grouped  e.g. 1,234.56
 * IQD  → 0 decimal places, comma-grouped  e.g. 1,234,567
 * generic → comma-grouped, preserve existing decimals
 */

/**
 * Format a number with commas.
 * @param {number|string} value
 * @param {object} [opts]
 * @param {"USD"|"IQD"|"generic"} [opts.currency="generic"]
 * @returns {string}
 */
export function formatNumber(value, { currency = "generic" } = {}) {
  if (value === null || value === undefined || value === "") return "0";
  const num = Number(value);
  if (isNaN(num)) return "0";

  switch (currency) {
    case "USD":
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    case "IQD":
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    default:
      return num.toLocaleString("en-US");
  }
}

/** Shorthand: format as USD (2 decimals) */
export const fmtUSD = (v) => formatNumber(v, { currency: "USD" });

/** Shorthand: format as IQD (no decimals) */
export const fmtIQD = (v) => formatNumber(v, { currency: "IQD" });

/** Shorthand: generic number formatting (backward-compatible) */
export const fmtNum = (v) => formatNumber(v);

/**
 * Format with $ prefix for USD
 * @param {number|string} value
 * @returns {string} e.g. "$1,234.56"
 */
export const fmtUSDLabel = (v) => `$${fmtUSD(v)}`;

/**
 * Format with د.ع suffix for IQD
 * @param {number|string} value
 * @returns {string} e.g. "1,234,567 د.ع"
 */
export const fmtIQDLabel = (v) => `${fmtIQD(v)} د.ع`;

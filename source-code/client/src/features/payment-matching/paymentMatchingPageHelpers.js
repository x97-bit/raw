import { fmtNum, fmtUSD, fmtIQD } from "../../utils/formatNumber";
export function formatPaymentMatchingNumber(value) {
  return value ? Number(value).toLocaleString("en-US") : "0";
}

export function formatOutstandingAmount(usd, iqd) {
  const usdPart =
    Number(usd || 0) > 0 ? `$${formatPaymentMatchingNumber(usd)}` : "";
  const iqdPart =
    Number(iqd || 0) > 0 ? `${formatPaymentMatchingNumber(iqd)} د.ع` : "";

  if (usdPart && iqdPart) {
    return `${usdPart} + ${iqdPart}`;
  }

  return usdPart || iqdPart || "-";
}

export function formatPaidAmount(usd, iqd) {
  if (Number(usd || 0) > 0) {
    return `$${formatPaymentMatchingNumber(usd)}`;
  }

  if (Number(iqd || 0) > 0) {
    return `${formatPaymentMatchingNumber(iqd)} د.ع`;
  }

  return "-";
}

export function formatAllocationAmount(allocation = {}) {
  return formatOutstandingAmount(
    allocation.allocated_usd,
    allocation.allocated_iqd
  );
}

export function buildPaymentProgress(stats) {
  const total =
    (stats?.paid?.count || 0) +
    (stats?.partial?.count || 0) +
    (stats?.unpaid?.count || 0);
  const paidPct = total
    ? Math.round(((stats?.paid?.count || 0) / total) * 100)
    : 0;
  const partialPct = total
    ? Math.round(((stats?.partial?.count || 0) / total) * 100)
    : 0;

  return { total, paidPct, partialPct };
}

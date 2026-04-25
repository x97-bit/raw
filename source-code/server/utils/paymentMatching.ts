export type PaymentStatus = "paid" | "partial" | "unpaid";

export function getRemainingAmounts(
  amountUsd: number,
  amountIqd: number,
  paidUsd: number,
  paidIqd: number
) {
  return {
    remainingUsd: Math.max(0, amountUsd - paidUsd),
    remainingIqd: Math.max(0, amountIqd - paidIqd),
  };
}

export function getPaymentStatus(
  amountUsd: number,
  amountIqd: number,
  paidUsd: number,
  paidIqd: number
) {
  const { remainingUsd, remainingIqd } = getRemainingAmounts(
    amountUsd,
    amountIqd,
    paidUsd,
    paidIqd
  );

  if (remainingUsd <= 0 && remainingIqd <= 0) {
    return { status: "paid" as PaymentStatus, remainingUsd, remainingIqd };
  }

  if (paidUsd > 0 || paidIqd > 0) {
    return { status: "partial" as PaymentStatus, remainingUsd, remainingIqd };
  }

  return { status: "unpaid" as PaymentStatus, remainingUsd, remainingIqd };
}

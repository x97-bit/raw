import { getPaymentStatus } from "../../utils/paymentMatching";

export const UNKNOWN_ACCOUNT_NAME = "ط؛ظٹط± ظ…ط¹ط±ظˆظپ";
export const ACCOUNT_PARAMETER_REQUIRED_MESSAGE = "account parameter required";
export const SHIPMENT_NOT_FOUND_MESSAGE = "Shipment not found";

export function mapShipmentPaymentStatus(row: any) {
  const amountUsd = Number(row.amount_usd) || 0;
  const amountIqd = Number(row.amount_iqd) || 0;
  const paidUsd = Number(row.paid_usd) || 0;
  const paidIqd = Number(row.paid_iqd) || 0;
  const { status, remainingUsd, remainingIqd } = getPaymentStatus(
    amountUsd,
    amountIqd,
    paidUsd,
    paidIqd
  );

  return {
    ...row,
    payment_status: status,
    remaining_usd: remainingUsd,
    remaining_iqd: remainingIqd,
  };
}

import { PAYMENT_STATUS_CONFIG } from "../../../utils/paymentMatchingConfig";

export default function PaymentStatusBadge({ status }) {
  const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.unpaid;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${config.bg} ${config.text} ${config.ring}`}
    >
      <Icon size={12} /> {config.label}
    </span>
  );
}

import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export const PAYMENT_STATUS_CONFIG = {
  paid: {
    label: "مسدد",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    icon: CheckCircle,
  },
  partial: {
    label: "جزئي",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    icon: Clock,
  },
  unpaid: {
    label: "غير مسدد",
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-200",
    icon: AlertCircle,
  },
};

export const PAYMENT_SUMMARY_VARIANTS = {
  paid: "success",
  partial: "warning",
  unpaid: "danger",
};

export function buildPaymentDashboardStats(dashboard) {
  if (!dashboard) return null;

  const shipmentStats = dashboard.shipmentStats;
  if (Array.isArray(shipmentStats)) {
    return {
      paid: shipmentStats.find(entry => entry.payment_status === "paid") || {
        count: 0,
        total_usd: 0,
        total_iqd: 0,
      },
      partial: shipmentStats.find(
        entry => entry.payment_status === "partial"
      ) || { count: 0, remaining_usd: 0, remaining_iqd: 0 },
      unpaid: shipmentStats.find(
        entry => entry.payment_status === "unpaid"
      ) || { count: 0, remaining_usd: 0, remaining_iqd: 0 },
      payments: dashboard.paymentStats || {
        unallocated_usd: 0,
        unallocated_iqd: 0,
      },
    };
  }

  return {
    paid: { count: shipmentStats?.matched || 0, total_usd: 0, total_iqd: 0 },
    partial: {
      count: shipmentStats?.partial || 0,
      remaining_usd: 0,
      remaining_iqd: 0,
    },
    unpaid: {
      count: shipmentStats?.unmatched || 0,
      remaining_usd: 0,
      remaining_iqd: 0,
    },
    payments: dashboard.paymentStats || {
      unallocated_usd: 0,
      unallocated_iqd: 0,
    },
  };
}

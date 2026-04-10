import { describe, expect, it } from 'vitest';
import {
  buildPaymentDashboardStats,
  PAYMENT_STATUS_CONFIG,
  PAYMENT_SUMMARY_VARIANTS,
} from './paymentMatchingConfig';

describe('paymentMatchingConfig', () => {
  it('provides human-readable payment statuses', () => {
    expect(PAYMENT_STATUS_CONFIG.paid.label).toBe('مسدد');
    expect(PAYMENT_STATUS_CONFIG.partial.label).toBe('جزئي');
    expect(PAYMENT_STATUS_CONFIG.unpaid.label).toBe('غير مسدد');
    expect(PAYMENT_SUMMARY_VARIANTS).toEqual({ paid: 'success', partial: 'warning', unpaid: 'danger' });
  });

  it('normalizes dashboard stats from array and aggregate shapes', () => {
    expect(buildPaymentDashboardStats({
      shipmentStats: [
        { payment_status: 'paid', count: 2, total_usd: 10, total_iqd: 0 },
        { payment_status: 'partial', count: 1, remaining_usd: 3, remaining_iqd: 0 },
      ],
      paymentStats: { unallocated_usd: 5, unallocated_iqd: 1000 },
    })).toEqual({
      paid: { payment_status: 'paid', count: 2, total_usd: 10, total_iqd: 0 },
      partial: { payment_status: 'partial', count: 1, remaining_usd: 3, remaining_iqd: 0 },
      unpaid: { count: 0, remaining_usd: 0, remaining_iqd: 0 },
      payments: { unallocated_usd: 5, unallocated_iqd: 1000 },
    });

    expect(buildPaymentDashboardStats({
      shipmentStats: { matched: 4, partial: 2, unmatched: 1 },
      paymentStats: { unallocated_usd: 0, unallocated_iqd: 0 },
    })).toEqual({
      paid: { count: 4, total_usd: 0, total_iqd: 0 },
      partial: { count: 2, remaining_usd: 0, remaining_iqd: 0 },
      unpaid: { count: 1, remaining_usd: 0, remaining_iqd: 0 },
      payments: { unallocated_usd: 0, unallocated_iqd: 0 },
    });
  });
});

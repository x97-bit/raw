import { describe, expect, it } from 'vitest';
import {
  buildTransactionDetailItems,
  formatTransactionModalNumber,
  TRANSACTION_MODAL_BUILT_IN_FIELD_FALLBACKS,
} from './transactionModalConfig';

describe('transactionModalConfig', () => {
  it('formats numbers consistently for transaction previews', () => {
    expect(formatTransactionModalNumber(12500)).toBe('12,500');
    expect(formatTransactionModalNumber(0)).toBe('0');
  });

  it('builds transaction detail items with extended transport fields', () => {
    const items = buildTransactionDetailItems({
      transaction: {
        TransTypeID: 1,
        TransDate: '2026-04-08 00:00:00',
        RefNo: 'INV-10',
        AccountName: 'أبو حسن',
        AmountUSD: 450,
        AmountIQD: 120000,
        CostUSD: 300,
        Weight: 15000,
        SyrCus: 25,
        CarQty: 2,
        TransPrice: 50000,
        CarrierName: 'الناقل الأول',
        CompanyName: 'شركة المثال',
      },
      transactionLabel: 'فاتورة',
      customDetailItems: [{ label: 'حقل إضافي', value: 'قيمة' }],
    });

    expect(items[0]).toEqual({ label: 'التاريخ', value: '2026-04-08' });
    expect(items.some((item) => item.label === 'الكمرك السوري')).toBe(true);
    expect(items.some((item) => item.label === 'عدد السيارات')).toBe(true);
    expect(items.some((item) => item.label === 'اسم الناقل')).toBe(true);
    expect(items.at(-1)).toEqual({ label: 'حقل إضافي', value: 'قيمة' });
  });

  it('keeps core built-in field labels available for edit rendering', () => {
    expect(TRANSACTION_MODAL_BUILT_IN_FIELD_FALLBACKS.qty).toBe('العدد');
    expect(TRANSACTION_MODAL_BUILT_IN_FIELD_FALLBACKS.trader_note).toBe('ملاحظات التاجر');
  });
});

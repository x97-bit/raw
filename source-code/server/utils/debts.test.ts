import { describe, expect, it } from 'vitest';
import { buildDebtMutationData, getDebtStatusLabel, mapDebtRow, normalizeDebtStatus } from './debts';

describe('normalizeDebtStatus', () => {
  it('maps Arabic and English status labels to enum values', () => {
    expect(normalizeDebtStatus('مسدد')).toBe('paid');
    expect(normalizeDebtStatus('تسديد جزئي')).toBe('partial');
    expect(normalizeDebtStatus('غير مسدد')).toBe('pending');
    expect(normalizeDebtStatus('paid')).toBe('paid');
  });

  it('returns Arabic labels for display', () => {
    expect(getDebtStatusLabel('paid')).toBe('مسدد');
    expect(getDebtStatusLabel('partial')).toBe('تسديد جزئي');
    expect(getDebtStatusLabel('pending')).toBe('غير مسدد');
  });
});

describe('buildDebtMutationData', () => {
  it('accepts legacy field names and normalizes them for storage', () => {
    expect(buildDebtMutationData({
      AccountName: 'باسم',
      AmountUSD: '125.5',
      AmountIQD: '0',
      FeeUSD: '5',
      DriverName: 'أحمد',
      VehiclePlate: '123',
      GoodTypeName: 'سيراميك',
      Weight: '12',
      Notes: 'اختبار',
      TransDate: '2026-04-07',
      State: 'مسدد',
    })).toEqual({
      debtorName: 'باسم',
      amountUSD: '125.5',
      amountIQD: '0',
      feeUSD: '5',
      feeIQD: '0',
      paidAmountUSD: '0',
      paidAmountIQD: '0',
      transType: null,
      fxRate: null,
      driverName: 'أحمد',
      carNumber: '123',
      goodType: 'سيراميك',
      weight: '12',
      meters: null,
      description: 'اختبار',
      date: '2026-04-07',
      status: 'paid',
      state: 'مسدد',
      fxNote: null,
    });
  });

  it('supports partial updates without forcing defaults for absent fields', () => {
    expect(buildDebtMutationData({ PaidAmountUSD: '15', State: 'تسديد جزئي' }, undefined, { partial: true })).toEqual({
      paidAmountUSD: '15',
      status: 'partial',
      state: 'تسديد جزئي',
    });
  });
});

describe('mapDebtRow', () => {
  it('returns legacy frontend field names with calculated remaining amounts', () => {
    const mapped = mapDebtRow({
      id: 7,
      debtorName: 'نعمان',
      amountUSD: '100',
      amountIQD: '25000',
      paidAmountUSD: '40',
      paidAmountIQD: '5000',
      feeUSD: '7',
      feeIQD: '0',
      driverName: 'سائق',
      carNumber: '12345',
      goodType: 'حديد',
      weight: '20',
      meters: '5',
      status: 'pending',
      description: 'ملاحظة',
      date: '2026-04-07',
    });

    expect(mapped.DebtID).toBe(7);
    expect(mapped.AccountName).toBe('نعمان');
    expect(mapped.DriverName).toBe('سائق');
    expect(mapped.VehiclePlate).toBe('12345');
    expect(mapped.GoodTypeName).toBe('حديد');
    expect(mapped.RemainingUSD).toBe(60);
    expect(mapped.RemainingIQD).toBe(20000);
    expect(mapped.State).toBe('غير مسدد');
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildHaiderSpecialReport,
  buildPartnershipSpecialReport,
  buildSpecialAccountMutationData,
  getSpecialAccountDateFilters,
} from './specialAccounts';

describe('getSpecialAccountDateFilters', () => {
  it('supports from/to and startDate/endDate aliases', () => {
    expect(getSpecialAccountDateFilters({ from: '2026-04-01', to: '2026-04-30' })).toEqual({
      from: '2026-04-01',
      to: '2026-04-30',
    });

    expect(getSpecialAccountDateFilters({ startDate: '2026-03-01', endDate: '2026-03-31' })).toEqual({
      from: '2026-03-01',
      to: '2026-03-31',
    });
  });
});

describe('buildHaiderSpecialReport', () => {
  it('filters by date and calculates totals', () => {
    const report = buildHaiderSpecialReport([
      { id: 1, date: '2026-04-02', amountUSD: '100', amountIQD: '150000', costUSD: '70', costIQD: '100000', differenceIQD: '15000', weight: '10', destination: 'بغداد', notes: 'أولى' },
      { id: 2, date: '2026-04-10', amountUSD: '200', amountIQD: '0', costUSD: '120', costIQD: '0', differenceIQD: '5000', weight: '5', destination: 'البصرة', notes: 'ثانية' },
      { id: 3, date: '2026-03-29', amountUSD: '50', amountIQD: '0', costUSD: '20', description: 'قديمة' },
    ], { from: '2026-04-01', to: '2026-04-30' });

    expect(report.statement).toHaveLength(2);
    expect(report.statement[0].id).toBe(2);
    expect(report.statement[0]).not.toHaveProperty('driverName');
    expect(report.statement[0]).not.toHaveProperty('vehiclePlate');
    expect(report.statement[0].Destination).toBe('البصرة');
    expect(report.totals.totalAmountUSD).toBe(300);
    expect(report.totals.totalCostUSD).toBe(190);
    expect(report.totals.totalProfitUSD).toBe(110);
    expect(report.totals.totalAmountIQD).toBe(150000);
    expect(report.totals.totalCostIQD).toBe(100000);
    expect(report.totals.totalDifferenceIQD).toBe(20000);
    expect(report.totals.totalNetIQD).toBe(70000);
    expect(report.totals.totalWeight).toBe(15);
  });
});

describe('buildPartnershipSpecialReport', () => {
  it('filters by date, maps rows, and totals partner fields', () => {
    const report = buildPartnershipSpecialReport([
      { id: 5, date: '2026-04-08', name: 'ياسر', traderName: 'ياسر', amountUSD: '40', amountUSDPartner: '15', clr: '5', tx: '2', taxiWater: '1', differenceIQD: '2000', companyName: 'الأنوار', description: 'نشط' },
      { id: 6, date: '2026-04-01', name: 'ياسر', amountUSD: '60', amountUSDPartner: '20', clr: '3', tx: '1', taxiWater: '2', differenceIQD: '1000', description: 'ثانوي' },
      { id: 7, date: '2026-03-28', name: 'قديم', amountUSD: '90', amountUSDPartner: '25', clr: '7', tx: '3', description: 'مستبعد' },
    ], { from: '2026-04-01', to: '2026-04-30' });

    expect(report.rows).toHaveLength(2);
    expect(report.rows[0].id).toBe(5);
    expect(report.rows[0]).not.toHaveProperty('traderName');
    expect(report.rows[0]).not.toHaveProperty('companyName');
    expect(report.rows[0].TraderName).toBe('ياسر');
    expect(report.rows[0].CompanyName).toBe('الأنوار');
    expect(report.totals.totalAmountUSD).toBe(100);
    expect(report.totals.totalAmountIQD).toBe(0);
    expect(report.totals.totalPartnerBaseUSD).toBe(35);
    expect(report.totals.totalPartnerUSD).toBe(35);
    expect(report.totals.totalCLR).toBe(8);
    expect(report.totals.totalTX).toBe(3);
    expect(report.totals.totalTaxiWater).toBe(3);
    expect(report.totals.totalTaxiAndOfficer).toBe(6);
    expect(report.totals.totalDifferenceIQD).toBe(3000);
    expect(report.totals.totalPartnerIQD).toBe(3014);
    expect(report.totals.totalNetUSD).toBe(65);
    expect(report.totals.totalNetIQD).toBe(-3014);
  });
});

describe('buildSpecialAccountMutationData', () => {
  it('normalizes haider payload fields for storage', () => {
    expect(buildSpecialAccountMutationData({
      Type: 'haider',
      DriverName: 'أحمد',
      VehiclePlate: '13-أ',
      GoodTypeName: 'سمنت',
      Weight: '12.5',
      Meters: '5',
      CostUSD: '60',
      AmountUSD: '100',
      CostIQD: '20000',
      AmountIQD: '35000',
      DifferenceIQD: '1500',
      Destination: 'بغداد',
      BatchName: 'وجبة 1',
      Notes: 'اختبار',
      TransDate: '2026-04-07',
    })).toEqual({
      type: 'haider',
      name: 'حيدر شركة الأنوار',
      traderName: null,
      driverName: 'أحمد',
      vehiclePlate: '13-أ',
      goodType: 'سمنت',
      govName: null,
      portName: null,
      companyName: null,
      batchName: 'وجبة 1',
      destination: 'بغداد',
      amountUSD: '100',
      amountIQD: '35000',
      costUSD: '60',
      costIQD: '20000',
      amountUSDPartner: '0',
      differenceIQD: '1500',
      clr: '0',
      tx: '0',
      taxiWater: '0',
      weight: '12.5',
      meters: '5',
      qty: null,
      date: '2026-04-07',
      notes: 'اختبار',
      description: 'اختبار',
    });
  });
});

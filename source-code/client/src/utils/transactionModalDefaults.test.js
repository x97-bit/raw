import { describe, expect, it } from 'vitest';
import {
  applyDefaultsToTransactionDraft,
  buildTransactionModalSeed,
  parseNumericInput,
} from './transactionModalDefaults';

describe('transactionModalDefaults', () => {
  it('builds editable seed text helpers from transaction names', () => {
    const seed = buildTransactionModalSeed({
      DriverName: 'علي',
      VehiclePlate: '12345',
      GoodTypeName: 'حديد',
      GovName: 'بغداد',
      CompanyName: 'الأنوار',
      CarrierName: 'ناقل',
    });

    expect(seed._driverText).toBe('علي');
    expect(seed._vehicleText).toBe('12345');
    expect(seed._goodText).toBe('حديد');
    expect(seed._govText).toBe('بغداد');
    expect(seed._companyText).toBe('الأنوار');
    expect(seed._carrierText).toBe('ناقل');
  });

  it('applies defaults only to empty and visible fields', () => {
    const result = applyDefaultsToTransactionDraft(
      {
        AmountUSD: 125,
        Currency: '',
        DriverID: null,
        _driverText: '',
        _govText: 'موجود',
      },
      {
        Currency: 'USD',
        AmountUSD: 300,
        DriverID: 8,
        DriverName: 'سائق افتراضي',
        GovID: 3,
        GovName: 'الأنبار',
      },
      new Set(['currency', 'amount_usd', 'driver_name', 'gov_name']),
    );

    expect(result.Currency).toBe('USD');
    expect(result.AmountUSD).toBe(125);
    expect(result.DriverID).toBe(8);
    expect(result._driverText).toBe('سائق افتراضي');
    expect(result.GovID).toBe(3);
    expect(result._govText).toBe('موجود');
  });

  it('parses numeric input without converting empty values to NaN', () => {
    expect(parseNumericInput('', parseFloat)).toBe('');
    expect(parseNumericInput('0', parseFloat)).toBe(0);
    expect(parseNumericInput('15.5', parseFloat)).toBe(15.5);
    expect(parseNumericInput('abc', parseFloat)).toBe('');
  });
});

import { describe, expect, it } from 'vitest';
import { buildCurrentTemplateColumns, getSectionExportProfiles } from './sectionExportProfiles';

describe('sectionExportProfiles', () => {
  it('provides extra list templates for configured port sections', () => {
    const profiles = getSectionExportProfiles('port-1', 'list');

    expect(profiles.map((profile) => profile.id)).toEqual(['saudi-ops', 'saudi-finance']);
    expect(profiles[0].columns.some((column) => column.key === 'DriverName')).toBe(true);
    expect(profiles[1].columns.some((column) => column.key === 'FeeUSD')).toBe(true);
    expect(profiles[1].columns.some((column) => column.key === 'TransPrice')).toBe(true);
  });

  it('provides the four Saudi statement print templates with the expected money columns', () => {
    const profiles = getSectionExportProfiles('port-1', 'statement');

    expect(profiles.map((profile) => profile.id)).toEqual(['saudi-usd', 'saudi-iqd', 'saudi-both', 'saudi-governorate']);
    expect(profiles[0].columns.some((column) => column.key === 'AmountUSD')).toBe(true);
    expect(profiles[0].columns.find((column) => column.key === 'AmountUSD')?.label).toBe('المبلغ $');
    expect(profiles[1].columns.some((column) => column.key === 'AmountIQD')).toBe(true);
    expect(profiles[2].columns.some((column) => column.key === 'AmountUSD')).toBe(true);
    expect(profiles[2].columns.some((column) => column.key === 'AmountIQD')).toBe(true);
    expect(profiles[3].columns.some((column) => column.key === 'Governorate')).toBe(true);
  });


  it('provides a Mondhiriya USD statement template with the requested columns', () => {
    const profiles = getSectionExportProfiles('port-2', 'statement');
    const usdProfile = profiles.find((profile) => profile.id === 'mondhiriya-usd');

    expect(usdProfile).toBeTruthy();
    expect(usdProfile?.label).toBe('نموذج دولار');
    expect(usdProfile?.columns.map((column) => column.key)).toEqual([
      'DriverName',
      'VehiclePlate',
      'GoodTypeName',
      'TransDate',
      'Weight',
      'AmountUSD',
      'SyrCus',
      '__combinedNotes',
    ]);
    expect(usdProfile?.columns.find((column) => column.key === 'SyrCus')?.label).toBe('الكمرك السوري');
  });

  it('uses the Saudi statement templates for Qaim printing', () => {
    const profiles = getSectionExportProfiles('port-3', 'statement');

    expect(profiles.map((profile) => profile.id)).toEqual([
      'saudi-usd',
      'saudi-iqd',
      'saudi-both',
      'saudi-governorate',
    ]);

    expect(profiles[0].columns.map((column) => column.key)).toEqual([
      'DriverName',
      'VehiclePlate',
      'GoodTypeName',
      'TransDate',
      'Weight',
      'Meters',
      'AmountUSD',
      '__combinedNotes',
    ]);

    expect(profiles[2].columns.some((column) => column.key === 'AmountUSD')).toBe(true);
    expect(profiles[2].columns.some((column) => column.key === 'AmountIQD')).toBe(true);
    expect(profiles[3].columns.some((column) => column.key === 'Governorate')).toBe(true);

    expect(profiles.every((profile) => !profile.summaryCards)).toBe(true);
  });
  it('orders the current template with the requested leading columns when available', () => {
    const columns = buildCurrentTemplateColumns('port-3', [
      { key: 'AmountUSD', label: 'المبلغ دولار', format: 'money' },
      { key: 'AccountName', label: 'اسم التاجر' },
      { key: 'RefNo', label: 'رقم الفاتورة' },
      { key: 'Currency', label: 'العملة' },
      { key: 'Qty', label: 'العدد', format: 'number' },
      { key: 'VehiclePlate', label: 'رقم السيارة' },
      { key: 'GoodTypeName', label: 'نوع البضاعة' },
      { key: 'TransDate', label: 'التاريخ', format: 'date' },
      { key: 'CostIQD', label: 'الكلفة دينار', format: 'money_iqd' },
      { key: 'DriverName', label: 'اسم السائق' },
      { key: 'AmountIQD', label: 'المبلغ دينار', format: 'money_iqd' },
      { key: 'Weight', label: 'الوزن', format: 'number' },
      { key: 'CostUSD', label: 'الكلفة دولار', format: 'money' },
      { key: 'TransTypeName', label: 'نوع الحركة' },
    ]);

    expect(columns.slice(0, 14).map((column) => column.key)).toEqual([
      'RefNo',
      'TransTypeName',
      'TransDate',
      'AccountName',
      'Currency',
      'DriverName',
      'VehiclePlate',
      'GoodTypeName',
      'Weight',
      'Qty',
      'CostUSD',
      'AmountUSD',
      'CostIQD',
      'AmountIQD',
    ]);
  });
});

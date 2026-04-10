import { describe, expect, it } from 'vitest';
import {
  FIELD_MANAGEMENT_SECTIONS,
  FIELD_TYPES,
  OPERATORS,
  SECTION_FIELDS_MAP,
  TARGET_SCREEN_META,
} from './fieldManagementConfig';

describe('fieldManagementConfig', () => {
  it('lists the expected system sections', () => {
    expect(FIELD_MANAGEMENT_SECTIONS.map((section) => section.key)).toEqual(expect.arrayContaining([
      'port-1',
      'port-2',
      'port-3',
      'debts',
      'special-haider',
      'special-partner',
    ]));
  });

  it('keeps target metadata and operators centralized', () => {
    expect(TARGET_SCREEN_META.statement.description).toBe('إعدادات شاشة كشف الحساب والجداول');
    expect(FIELD_TYPES.find((type) => type.value === 'formula')?.label).toBe('عملية حسابية');
    expect(OPERATORS.map((operator) => operator.value)).toEqual(['+', '-', '*', '/']);
  });

  it('exposes custom field maps for special accounts and debts', () => {
    expect(SECTION_FIELDS_MAP.debts.some((field) => field.key === 'amount_usd')).toBe(true);
    expect(SECTION_FIELDS_MAP['special-partner'].some((field) => field.key === 'amount_usd_partner')).toBe(true);
    expect(SECTION_FIELDS_MAP['special-haider'].some((field) => field.key === 'difference_iqd')).toBe(true);
  });
});

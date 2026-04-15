import { describe, expect, it } from 'vitest';
import { buildOrderedFormSections, filterSectionsByCurrency } from './orderedFormSections';

describe('buildOrderedFormSections', () => {
  it('keeps custom fields near their configured anchors instead of pushing them to the end', () => {
    const sections = [
      {
        title: 'base',
        subtitle: '',
        fields: [
          { key: 'ref_no', label: 'Ref No' },
          { key: 'trans_date', label: 'Date' },
        ],
      },
      {
        title: 'money',
        subtitle: '',
        fields: [
          { key: 'amount_usd', label: 'Amount USD' },
          { key: 'amount_iqd', label: 'Amount IQD' },
        ],
      },
    ];

    const result = buildOrderedFormSections({
      sections,
      configMap: {
        ref_no: { sortOrder: 1 },
        trans_date: { sortOrder: 2 },
        custom_1: { sortOrder: 3 },
        amount_usd: { sortOrder: 4 },
        amount_iqd: { sortOrder: 5 },
      },
      editableCustomFields: [
        { fieldKey: 'custom_1', label: 'Custom Field', fieldType: 'text' },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0].items.map((item) => item.key)).toEqual(['ref_no', 'trans_date', 'custom_1']);
    expect(result[1].items.map((item) => item.key)).toEqual(['amount_usd', 'amount_iqd']);
  });

  it('falls back to the first section when the form has no built-in anchors', () => {
    const result = buildOrderedFormSections({
      sections: [],
      configMap: {
        custom_1: { sortOrder: 1 },
      },
      editableCustomFields: [
        { fieldKey: 'custom_1', label: 'Custom Field', fieldType: 'text' },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].items[0].key).toBe('custom_1');
  });
});

describe('filterSectionsByCurrency', () => {
  const sampleSections = () => ([
    {
      title: 'basics',
      items: [
        { key: 'ref_no', kind: 'builtIn' },
        { key: 'trans_date', kind: 'builtIn' },
      ],
    },
    {
      title: 'money',
      items: [
        { key: 'cost_usd', kind: 'builtIn' },
        { key: 'amount_usd', kind: 'builtIn' },
        { key: 'cost_iqd', kind: 'builtIn' },
        { key: 'amount_iqd', kind: 'builtIn' },
        { key: 'fee_usd', kind: 'builtIn' },
      ],
    },
    {
      title: 'iqd-only',
      items: [
        { key: 'amount_iqd', kind: 'builtIn' },
      ],
    },
  ]);

  it('keeps only USD fields when currency is USD', () => {
    const result = filterSectionsByCurrency(sampleSections(), 'USD');
    const moneyKeys = result.find((s) => s.title === 'money').items.map((i) => i.key);
    expect(moneyKeys).toEqual(['cost_usd', 'amount_usd', 'fee_usd']);
    expect(result.find((s) => s.title === 'iqd-only')).toBeUndefined();
  });

  it('keeps only IQD fields when currency is IQD', () => {
    const result = filterSectionsByCurrency(sampleSections(), 'IQD');
    const moneyKeys = result.find((s) => s.title === 'money').items.map((i) => i.key);
    expect(moneyKeys).toEqual(['cost_iqd', 'amount_iqd']);
    expect(result.find((s) => s.title === 'iqd-only').items).toHaveLength(1);
  });

  it('keeps all fields when currency is BOTH', () => {
    const sections = sampleSections();
    const result = filterSectionsByCurrency(sections, 'BOTH');
    expect(result).toBe(sections);
  });

  it('leaves non-currency-suffixed fields (trans_price, syr_cus) untouched', () => {
    const sections = [
      {
        title: 'mixed',
        items: [
          { key: 'trans_price', kind: 'builtIn' },
          { key: 'syr_cus', kind: 'builtIn' },
          { key: 'amount_usd', kind: 'builtIn' },
          { key: 'amount_iqd', kind: 'builtIn' },
        ],
      },
    ];
    const usdResult = filterSectionsByCurrency(sections, 'USD');
    expect(usdResult[0].items.map((i) => i.key)).toEqual(['trans_price', 'syr_cus', 'amount_usd']);
    const iqdResult = filterSectionsByCurrency(sections, 'IQD');
    expect(iqdResult[0].items.map((i) => i.key)).toEqual(['trans_price', 'syr_cus', 'amount_iqd']);
  });

  it('defaults to USD filter when currency is missing', () => {
    const result = filterSectionsByCurrency(sampleSections(), null);
    const moneyKeys = result.find((s) => s.title === 'money').items.map((i) => i.key);
    expect(moneyKeys).toEqual(['cost_usd', 'amount_usd', 'fee_usd']);
  });
});

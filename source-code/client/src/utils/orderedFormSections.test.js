import { describe, expect, it } from 'vitest';
import { buildOrderedFormSections } from './orderedFormSections';

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

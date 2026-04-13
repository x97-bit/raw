import { describe, expect, it } from 'vitest';
import { toExportColumn, toPreviewColumn } from './portPageColumns';

describe('portPageColumns helpers', () => {
  it('maps view columns to export columns with matching money formats', () => {
    expect(toExportColumn({
      dataKey: 'AmountUSD',
      label: 'المبلغ دولار',
      type: 'money_usd',
    })).toEqual({
      key: 'AmountUSD',
      label: 'المبلغ دولار',
      format: 'money',
    });
  });

  it('adds a transport-aware label resolver for direction columns', () => {
    const exportColumn = toExportColumn({
      key: 'direction',
      dataKey: 'TransTypeName',
      label: 'نوع الحركة',
      type: 'badge',
    }, { sectionKey: 'transport-1' });

    expect(exportColumn.getValue({ TransTypeID: 1 })).toBe('استحقاق نقل');
    expect(exportColumn.getValue({ TransTypeID: 2 })).toBe('سند دفع');
  });

  it('maps export columns back to preview columns', () => {
    const getValue = (row) => row.AmountUSD;
    expect(toPreviewColumn({
      key: 'amount_usd',
      label: 'المبلغ $',
      format: 'money',
      getValue,
    }, 0)).toEqual({
      key: 'amount_usd',
      dataKey: 'amount_usd',
      label: 'المبلغ $',
      type: 'money_usd',
      getValue,
    });
  });
});

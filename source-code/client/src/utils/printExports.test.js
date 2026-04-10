import { describe, expect, it } from 'vitest';
import { buildPrintMetaHtml, normalizeTabularPrintSections } from './printExports';

describe('printExports', () => {
  it('builds printable metadata HTML and ignores empty values', () => {
    const html = buildPrintMetaHtml([
      { label: 'المنفذ', value: 'السعودية' },
      { label: 'من تاريخ', value: '' },
      { label: 'إلى تاريخ', value: '2026-04-10', tone: 'accent' },
    ]);

    expect(html).toContain('المنفذ');
    expect(html).toContain('السعودية');
    expect(html).toContain('إلى تاريخ');
    expect(html).toContain('tay-meta-value-red');
    expect(html).not.toContain('من تاريخ');
  });

  it('normalizes provided print sections and falls back to a main section', () => {
    const sections = normalizeTabularPrintSections({
      sections: [
        {
          key: 'summary',
          title: 'ملخص',
          rows: [{ id: 1 }],
          columns: [{ key: 'id', label: 'المعرف' }],
          highlightRows: false,
        },
      ],
      emptyMessage: 'فارغ',
    });

    expect(sections).toEqual([
      {
        key: 'summary',
        title: 'ملخص',
        subtitle: '',
        rows: [{ id: 1 }],
        columns: [{ key: 'id', label: 'المعرف' }],
        totalsRow: null,
        highlightRows: false,
        emptyMessage: 'فارغ',
      },
    ]);

    expect(normalizeTabularPrintSections({
      rows: [{ RefNo: 'A-1' }],
      columns: [{ key: 'RefNo', label: 'المرجع' }],
      totalsRow: { RefNo: 1 },
    })).toEqual([
      {
        key: 'main-section',
        title: '',
        subtitle: '',
        rows: [{ RefNo: 'A-1' }],
        columns: [{ key: 'RefNo', label: 'المرجع' }],
        totalsRow: { RefNo: 1 },
        highlightRows: true,
        emptyMessage: 'لا توجد بيانات للطباعة.',
      },
    ]);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  aoaToSheet,
  bookNew,
  bookAppendSheet,
  encodeRange,
  write,
  saveAs,
} = vi.hoisted(() => ({
  aoaToSheet: vi.fn(() => ({})),
  bookNew: vi.fn(() => ({})),
  bookAppendSheet: vi.fn(),
  encodeRange: vi.fn(() => 'A1:B2'),
  write: vi.fn(() => new Uint8Array([1, 2, 3])),
  saveAs: vi.fn(),
}));

vi.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: aoaToSheet,
    book_new: bookNew,
    book_append_sheet: bookAppendSheet,
    encode_range: encodeRange,
  },
  write,
}));

vi.mock('file-saver', () => ({
  saveAs,
}));

import { exportToExcel } from './excelExports';

describe('exportToExcel', () => {
  beforeEach(() => {
    aoaToSheet.mockClear();
    bookNew.mockClear();
    bookAppendSheet.mockClear();
    encodeRange.mockClear();
    write.mockClear();
    saveAs.mockClear();
  });

  it('uses computed column values and sanitizes the worksheet title', () => {
    exportToExcel(
      [{ TraderNote: 'ملاحظة أولى', Notes: 'ملاحظة ثانية' }],
      [{
        key: '__combinedNotes',
        label: 'الملاحظات',
        getValue: (row) => `${row.TraderNote} | ${row.Notes}`,
      }],
      'statement',
      'bad:/sheet*name?',
    );

    expect(aoaToSheet).toHaveBeenCalledWith([
      ['الملاحظات'],
      ['ملاحظة أولى | ملاحظة ثانية'],
    ]);

    const worksheet = aoaToSheet.mock.results[0].value;
    expect(worksheet['!cols'][0].wch).toBeGreaterThanOrEqual(26);
    expect(worksheet['!autofilter']).toEqual({ ref: 'A1:B2' });
    expect(bookAppendSheet).toHaveBeenCalledWith(expect.any(Object), worksheet, 'bad sheet name');
    expect(saveAs).toHaveBeenCalledTimes(1);
  });
});

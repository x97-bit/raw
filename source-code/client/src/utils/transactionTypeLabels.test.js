import { describe, expect, it } from 'vitest';
import {
  getTransactionReferenceLabel,
  getTransactionTypeLabel,
  isTransportSectionKey,
} from './transactionTypeLabels';

describe('transactionTypeLabels', () => {
  it('maps transaction ids to generic invoice and receipt labels', () => {
    expect(getTransactionTypeLabel('', 1)).toBe('فاتورة');
    expect(getTransactionTypeLabel('', 2)).toBe('سند قبض');
  });

  it('supports custom debit-note labels and references', () => {
    expect(getTransactionTypeLabel('', 3, { recordType: 'debit-note' })).toBe('سند إضافة');
    expect(getTransactionReferenceLabel(3, { recordType: 'debit-note' })).toBe('رقم سند الإضافة');
  });

  it('normalizes legacy labels safely', () => {
    expect(getTransactionTypeLabel('له')).toBe('فاتورة');
    expect(getTransactionTypeLabel('عليه')).toBe('سند قبض');
    expect(getTransactionTypeLabel('فاتورة')).toBe('فاتورة');
    expect(getTransactionTypeLabel('سند')).toBe('سند قبض');
    expect(getTransactionTypeLabel('سند قبض')).toBe('سند قبض');
  });

  it('switches transport labels and references when the section is transport', () => {
    expect(isTransportSectionKey('transport-1')).toBe(true);
    expect(getTransactionTypeLabel('', 1, { sectionKey: 'transport-1' })).toBe('استحقاق نقل');
    expect(getTransactionTypeLabel('', 2, { sectionKey: 'transport-1' })).toBe('سند دفع');
    expect(getTransactionReferenceLabel(1, { sectionKey: 'transport-1' })).toBe('رقم استحقاق النقل');
    expect(getTransactionReferenceLabel(2, { sectionKey: 'transport-1' })).toBe('رقم سند الدفع');
  });
});

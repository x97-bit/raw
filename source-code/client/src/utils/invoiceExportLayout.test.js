import { describe, expect, it } from 'vitest';
import { getCurrencyLabel } from './currencyLabels';
import {
  buildInvoiceExportSections,
  buildInvoiceHeaderMeta,
  resolveInvoiceFieldValue,
} from './invoiceExportLayout';

const SAMPLE_TRANSACTION = {
  RefNo: 'INV-204',
  TransDate: '2026-04-10 08:30:00',
  TransTypeID: 1,
  AccountName: 'شركة الاختبار',
  Currency: 'USD',
  DriverName: 'حيدر',
  VehiclePlate: '12-345',
  GoodTypeName: 'حديد',
  Weight: 32.5,
  Meters: 14,
  CostUSD: 1250,
  AmountUSD: 1500,
  CostIQD: 1500000,
  AmountIQD: 1800000,
  GovName: 'بغداد',
  PortName: 'عرعر',
  FeeUSD: 125,
  TransPrice: 250000,
  TraderNote: 'ملاحظة التاجر',
  Notes: 'ملاحظة داخلية',
};

describe('invoiceExportLayout', () => {
  it('formats invoice field values for the export cards', () => {
    expect(resolveInvoiceFieldValue(SAMPLE_TRANSACTION, 'currency')).toBe(getCurrencyLabel('USD'));
    expect(resolveInvoiceFieldValue(SAMPLE_TRANSACTION, 'amount_usd')).toBe('$1,500');
    expect(resolveInvoiceFieldValue(SAMPLE_TRANSACTION, 'notes')).toBe('ملاحظة داخلية');
  });

  it('builds the invoice header metadata in export order', () => {
    const metaItems = buildInvoiceHeaderMeta(SAMPLE_TRANSACTION, 'invoice');

    expect(metaItems).toHaveLength(4);
    expect(metaItems.map((item) => item.value)).toEqual([
      'INV-204',
      '2026-04-10',
      metaItems[2].value,
      'عرعر',
    ]);
    expect(metaItems[2].value).not.toBe('-');
  });

  it('uses transport-specific reference labels when exporting transport documents', () => {
    expect(buildInvoiceHeaderMeta(SAMPLE_TRANSACTION, 'invoice', 'transport-1')[0].label).toBe('رقم استحقاق النقل');
    expect(buildInvoiceHeaderMeta({ ...SAMPLE_TRANSACTION, TransTypeID: 2 }, 'payment', 'transport-1')[0].label).toBe('رقم سند الدفع');
  });

  it('uses debit-note references when exporting added-charge vouchers', () => {
    expect(buildInvoiceHeaderMeta({
      ...SAMPLE_TRANSACTION,
      TransTypeID: 3,
      RecordType: 'debit-note',
    }, 'invoice', 'port-1')[0].label).toBe('رقم سند الإضافة');
  });

  it('uses the section invoice layout instead of the generic field list', () => {
    const sections = buildInvoiceExportSections(SAMPLE_TRANSACTION, 'port-1', 'invoice');
    const flattenedKeys = sections.flatMap((section) => section.items.map((item) => item.key));

    expect(sections[0].items.map((item) => item.key)).toEqual([
      'ref_no',
      'trans_date',
      'account_name',
      'currency',
    ]);
    expect(flattenedKeys).toContain('fee_usd');
    expect(flattenedKeys).toContain('trans_price');
    expect(flattenedKeys).not.toContain('syr_cus');
  });
});

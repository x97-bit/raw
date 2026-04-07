import { describe, expect, it } from 'vitest';
import { getSectionColumns, getSectionTargetFields } from './sectionScreenSpecs';

const TRANSACTION_SECTIONS = ['transport-1', 'port-1', 'port-2', 'port-3', 'partnership-1'];
const STATEMENT_CORE_KEYS = ['ref_no', 'direction', 'trans_date', 'currency', 'amount_usd', 'amount_iqd'];

describe('sectionScreenSpecs', () => {
  it('keeps statement core columns visible for every transaction section', () => {
    TRANSACTION_SECTIONS.forEach((sectionKey) => {
      const statementColumns = getSectionColumns(sectionKey, 'statement');
      expect(statementColumns.slice(0, STATEMENT_CORE_KEYS.length).map((column) => column.key)).toEqual(STATEMENT_CORE_KEYS);
    });
  });

  it('preserves section-specific invoice fields per port', () => {
    const saudiInvoiceKeys = getSectionTargetFields('port-1', 'invoice').map((field) => field.key);
    const mondhiriyaInvoiceKeys = getSectionTargetFields('port-2', 'invoice').map((field) => field.key);
    const qaimInvoiceKeys = getSectionTargetFields('port-3', 'invoice').map((field) => field.key);

    expect(saudiInvoiceKeys).toContain('fee_usd');
    expect(saudiInvoiceKeys).not.toContain('syr_cus');
    expect(mondhiriyaInvoiceKeys).toContain('syr_cus');
    expect(qaimInvoiceKeys).toContain('company_name');
  });
});

import { describe, expect, it } from 'vitest';
import {
  applySuggestedDefaultsToForm,
  buildAccountDefaultsPayload,
  buildPortColumnsForTarget,
  buildInitialPortForm,
  buildPortAccountsQuery,
  buildPortStatementQuery,
  buildPortTransactionsQuery,
  buildRouteDefaultsPayload,
  createPortFilters,
  dedupePortCustomFieldsById,
  getPortBuiltInFieldLabel,
  getPortFormTarget,
  getPortStatementFooterCell,
  getPortViewLabels,
  getVisiblePortCustomFieldsForTarget,
  getVisiblePortFormulaFieldsForTarget,
  relabelPortColumnsForSection,
  resolvePortSectionKey,
} from './portPageHelpers';

describe('portPageHelpers', () => {
  it('creates stable filter defaults and resolves section keys', () => {
    expect(createPortFilters()).toEqual({ accountId: '', from: '', to: '' });
    expect(createPortFilters(15)).toEqual({ accountId: '15', from: '', to: '' });
    expect(resolvePortSectionKey('port-3', null)).toBe('port-3');
    expect(resolvePortSectionKey(null, 2)).toBe('transport-1');
    expect(resolvePortSectionKey(null, 5)).toBe('partnership-1');
    expect(resolvePortSectionKey(2, null)).toBe('port-2');
  });

  it('builds transaction, account, and statement queries safely', () => {
    expect(buildPortTransactionsQuery({
      portId: 3,
      accountType: 2,
      filters: { accountId: '11', from: '2026-04-01', to: '2026-04-09' },
      search: 'test',
      limit: 30,
      page: 2,
    })).toBe('port=3&accountType=2&accountId=11&startDate=2026-04-01&endDate=2026-04-09&search=test&limit=30&offset=60');

    expect(buildPortAccountsQuery({ portId: 1, accountType: 5 })).toBe('port=1&accountType=5');
    expect(buildPortAccountsQuery({ portId: 'transport-1', accountType: 2 })).toBe('accountType=2');
    expect(buildPortStatementQuery({
      portId: 2,
      accountType: 3,
      from: '2026-04-01',
      to: '2026-04-09',
    })).toBe('portId=2&accountType=3&startDate=2026-04-01&endDate=2026-04-09');
  });

  it('builds initial port forms from form type and custom values', () => {
    expect(getPortFormTarget(1)).toBe('invoice');
    expect(getPortFormTarget(2)).toBe('payment');
    expect(getPortFormTarget(3)).toBe('debit-note');

    expect(buildInitialPortForm({
      formType: 2,
      portId: 7,
      customFieldValues: { ExtraField: 'abc' },
      today: new Date('2026-04-09T10:30:00.000Z'),
    })).toEqual({
      ExtraField: 'abc',
      TransDate: '2026-04-09',
      TransTypeID: 2,
      Currency: 'USD',
      PortID: 7,
    });

    expect(buildInitialPortForm({
      formType: 3,
      portId: 'port-1',
      today: new Date('2026-04-09T10:30:00.000Z'),
    })).toEqual({
      TransDate: '2026-04-09',
      TransTypeID: 3,
      RecordType: 'debit-note',
      Currency: 'USD',
      PortID: 'port-1',
    });
  });

  it('applies suggested defaults only to visible empty built-in fields', () => {
    const next = applySuggestedDefaultsToForm({
      currentForm: {
        Currency: '',
        DriverID: '',
        _driverText: '',
        GovID: 8,
      },
      defaults: {
        Currency: 'IQD',
        DriverID: 4,
        DriverName: 'Ali Driver',
        GovID: 99,
        GovName: 'Baghdad',
        AmountUSD: 250,
      },
      visibleBuiltInFieldKeys: new Set(['currency', 'driver_name', 'amount_usd']),
    });

    expect(next.Currency).toBe('IQD');
    expect(next.DriverID).toBe(4);
    expect(next._driverText).toBe('Ali Driver');
    expect(next.GovID).toBe(8);
    expect(next.AmountUSD).toBe(250);
  });

  it('builds defaults payloads and transport-aware footer cells', () => {
    expect(buildAccountDefaultsPayload({
      sectionKey: 'port-1',
      form: {
        AccountID: 10,
        Currency: 'USD',
        DriverID: 2,
        GovID: 5,
      },
    })).toEqual({
      accountId: 10,
      sectionKey: 'port-1',
      defaultCurrency: 'USD',
      defaultDriverId: 2,
      defaultGovId: 5,
    });

    expect(buildRouteDefaultsPayload({
      sectionKey: 'port-3',
      form: {
        GovID: 7,
        Currency: '',
        TransPrice: 100,
      },
    })).toEqual({
      sectionKey: 'port-3',
      govId: 7,
      currency: 'IQD',
      defaultTransPrice: 100,
    });

    expect(getPortStatementFooterCell({ key: 'AmountUSD' }, 0, {}, { sectionKey: 'transport-1' })).toEqual({
      value: 'المتبقي علينا',
      className: 'px-3 py-3',
    });
    expect(getPortStatementFooterCell({ key: 'AmountUSD' }, 1, { balanceUSD: 300 }, { sectionKey: 'transport-1' })).toEqual({
      value: '-',
      className: 'px-3 py-3 text-utility-muted',
    });
    expect(getPortStatementFooterCell({ key: 'ProfitUSD' }, 2, { totalProfitUSD: -50 })).toEqual({
      value: '$-50',
      className: 'px-3 py-3 text-red-600',
    });
  });

  it('exposes transport-specific labels and relabels ref columns', () => {
    expect(getPortViewLabels({ sectionKey: 'port-1', formType: 3 }).debitLabel).toBe('سند إضافة');
    expect(getPortViewLabels({ sectionKey: 'transport-1', formType: 1 }).invoiceLabel).toBe('استحقاق نقل');
    expect(getPortViewLabels({ sectionKey: 'transport-1', formType: 2 }).paymentLabel).toBe('سند دفع');
    expect(getPortBuiltInFieldLabel('port-1', 'ref_no', 3, 'fallback')).toBe('رقم سند الإضافة');
    expect(getPortBuiltInFieldLabel('transport-1', 'ref_no', 1, 'fallback')).toBe('رقم استحقاق النقل');
    expect(getPortBuiltInFieldLabel('transport-1', 'ref_no', 2, 'fallback')).toBe('رقم سند الدفع');
    expect(relabelPortColumnsForSection([{ key: 'ref_no', label: 'رقم الفاتورة' }], 'transport-1')).toEqual([
      { key: 'ref_no', label: 'رقم المستند' },
    ]);
  });

  it('deduplicates custom fields and builds visible port columns', () => {
    const customField = {
      id: 5,
      fieldKey: 'custom_weight_note',
      label: 'Weight Note',
      fieldType: 'text',
      sortOrder: 20,
      sectionKeys: ['port-1::list'],
    };

    expect(dedupePortCustomFieldsById([[customField], [customField]])).toEqual([customField]);

    const columns = buildPortColumnsForTarget({
      sectionKey: 'port-1',
      target: 'list',
      configMap: {
        custom_weight_note: {
          visible: true,
          sortOrder: 2,
          displayLabel: 'Custom Note',
        },
      },
      customFields: [customField],
    });

    expect(columns.some((column) => column.key === 'custom_weight_note')).toBe(true);
    expect(columns.find((column) => column.key === 'custom_weight_note')?.label).toBe('Custom Note');
  });

  it('filters visible custom and formula fields by target and visibility', () => {
    const customFields = [
      {
        id: 1,
        fieldKey: 'custom_text',
        label: 'Custom Text',
        fieldType: 'text',
        sectionKeys: ['port-1::invoice'],
        placement: 'transaction',
      },
      {
        id: 2,
        fieldKey: 'custom_formula',
        label: 'Formula',
        fieldType: 'formula',
        sectionKeys: ['port-1::invoice'],
        placement: 'transaction',
      },
      {
        id: 3,
        fieldKey: 'hidden_field',
        label: 'Hidden Field',
        fieldType: 'text',
        sectionKeys: ['port-1::invoice'],
        placement: 'transaction',
      },
    ];
    const configMap = {
      custom_text: { visible: true, sortOrder: 2, displayLabel: 'Visible Custom' },
      custom_formula: { visible: true, sortOrder: 1, displayLabel: 'Visible Formula' },
      hidden_field: { visible: false, sortOrder: 3 },
    };

    expect(getVisiblePortCustomFieldsForTarget({
      customFields,
      configMap,
      sectionKey: 'port-1',
      target: 'invoice',
    }).map((field) => field.fieldKey)).toEqual(['custom_text']);

    expect(getVisiblePortFormulaFieldsForTarget({
      customFields,
      configMap,
      sectionKey: 'port-1',
      target: 'invoice',
    }).map((field) => field.fieldKey)).toEqual(['custom_formula']);
  });
});

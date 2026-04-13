import { describe, expect, it } from 'vitest';
import {
  filterExpensesByPort,
  sumExpenseAmounts,
} from './expensesHelpers';
import {
  buildExpenseExportColumns,
  createExpenseFormFromRow,
  createInitialExpenseForm,
  EXPENSE_COLUMNS,
  getExpensePortLabel,
} from './expensesConfig';

describe('expenses helpers', () => {
  it('filters expenses by port when a port is selected', () => {
    const rows = [
      { id: 1, portId: 'general' },
      { id: 2, portId: 'port-2' },
    ];

    expect(filterExpensesByPort(rows, 'port-2')).toEqual([{ id: 2, portId: 'port-2' }]);
    expect(filterExpensesByPort(rows, '')).toEqual(rows);
  });

  it('sums usd and iqd amounts defensively', () => {
    expect(sumExpenseAmounts([
      { amountUSD: '10.5', amountIQD: '1000' },
      { amountUSD: '2', amountIQD: '250' },
    ])).toEqual({
      totalUSD: 12.5,
      totalIQD: 1250,
    });
  });

  it('provides stable config helpers for forms and labels', () => {
    expect(getExpensePortLabel('port-2')).toBe('مصاريف المنذرية');
    expect(createInitialExpenseForm()).toMatchObject({
      portId: 'general',
      chargeTarget: 'port',
      accountId: null,
      accountName: '',
      amountUSD: '',
      amountIQD: '',
      description: '',
    });
    expect(createExpenseFormFromRow({
      expenseDate: '2026-04-09 12:00:00',
      amountUSD: '5',
      amountIQD: '1000',
      description: 'نقل',
      portId: 'port-3',
      chargeTarget: 'trader',
      accountId: 14,
      accountName: 'ياسر',
    })).toEqual({
      expenseDate: '2026-04-09',
      amountUSD: '5',
      amountIQD: '1000',
      description: 'نقل',
      portId: 'port-3',
      chargeTarget: 'trader',
      accountId: 14,
      accountName: 'ياسر',
    });
  });

  it('maps expense columns to export columns', () => {
    expect(buildExpenseExportColumns(EXPENSE_COLUMNS)).toEqual([
      { key: 'expenseDate', label: 'التاريخ' },
      { key: 'description', label: 'الوصف' },
      { key: 'chargeTarget', label: 'التحميل' },
      { key: 'accountName', label: 'اسم التاجر' },
      { key: 'amountUSD', label: 'المبلغ ($)' },
      { key: 'amountIQD', label: 'المبلغ (د.ع)' },
      { key: 'portId', label: 'القسم' },
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildReportRequestPath,
  buildTraderFormForPort,
  createEmptyTraderForm,
  formatReportDate,
  formatReportNumber,
  getProfitTone,
  getReportPortById,
} from './reportsPageHelpers';

describe('reportsPageHelpers', () => {
  it('creates empty trader forms with stable defaults', () => {
    expect(createEmptyTraderForm()).toEqual({
      AccountName: '',
      AccountTypeID: 1,
      DefaultCurrencyID: 1,
    });

    expect(buildTraderFormForPort('port-2')).toEqual({
      AccountName: '',
      AccountTypeID: 1,
      DefaultCurrencyID: 1,
      DefaultPortID: 'port-2',
    });
  });

  it('resolves report ports by id', () => {
    expect(getReportPortById('port-3')).toMatchObject({ id: 'port-3' });
    expect(getReportPortById('missing')).toBeNull();
  });

  it('builds request paths for expenses and profits', () => {
    expect(buildReportRequestPath('expenses', 'port-1', { from: '2026-04-01', to: '2026-04-08' }))
      .toBe('/reports/expenses/port-1?from=2026-04-01&to=2026-04-08');
    expect(buildReportRequestPath('profits', 'port-2', { from: '2026-04-01', to: '2026-04-08' }))
      .toBe('/reports/profits?port=port-2&from=2026-04-01&to=2026-04-08');
    expect(buildReportRequestPath('other', 'port-1')).toBeNull();
  });

  it('formats numbers, dates, and profit tone consistently', () => {
    expect(formatReportNumber(12500)).toBe('12,500');
    expect(formatReportNumber(0)).toBe('0');
    expect(formatReportDate('2026-04-08 11:22:33')).toBe('2026-04-08');
    expect(formatReportDate('')).toBe('-');
    expect(getProfitTone(4)).toBe('text-[#8eb8ad]');
    expect(getProfitTone(-1)).toBe('text-[#c697a1]');
  });
});

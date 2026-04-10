import { describe, expect, it } from 'vitest';
import {
  buildPortAccountPayload,
  getPortTransactionTarget,
  sanitizePortTransactionPayload,
} from './portTransactionFormHelpers';

describe('portTransactionFormHelpers', () => {
  it('removes transient draft keys from transaction payloads', () => {
    expect(sanitizePortTransactionPayload({
      AccountID: 12,
      AmountUSD: 100,
      _driverText: 'Driver',
      _companyText: 'Company',
      _newGoodType: 'Paper',
    })).toEqual({
      AccountID: 12,
      AmountUSD: 100,
    });
  });

  it('builds account creation payloads safely', () => {
    expect(buildPortAccountPayload({
      traderText: '  تاجر جديد  ',
      accountType: 5,
      portId: null,
    })).toEqual({
      AccountName: 'تاجر جديد',
      AccountTypeID: 5,
      DefaultPortID: null,
    });
  });

  it('resolves transaction targets consistently', () => {
    expect(getPortTransactionTarget(1)).toBe('invoice');
    expect(getPortTransactionTarget(2)).toBe('payment');
    expect(getPortTransactionTarget({ TransTypeID: 1 })).toBe('invoice');
  });
});

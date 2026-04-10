import { describe, expect, it } from 'vitest';
import {
  buildAccountDefaultBadges,
  buildDefaultsPageCopy,
  buildRouteDefaultBadges,
} from './defaultsManagementPageHelpers';

describe('defaultsManagementPageHelpers', () => {
  it('builds copy for account and route tabs', () => {
    expect(buildDefaultsPageCopy({
      activeTab: 'account',
      accountFormId: null,
      routeFormId: null,
    }).saveLabel).toBe('حفظ افتراضيات التاجر');

    expect(buildDefaultsPageCopy({
      activeTab: 'route',
      accountFormId: null,
      routeFormId: 4,
    }).formTitle).toBe('تعديل افتراضيات المسار');
  });

  it('builds account badges safely', () => {
    expect(buildAccountDefaultBadges({
      sectionKey: 'port-1',
      defaultCurrency: 'USD',
      defaultDriverName: 'سائق',
      defaultGovName: '',
      defaultCompanyName: 'شركة',
    }, (key) => key)).toEqual([
      'port-1',
      'USD',
      'السائق: سائق',
      '',
      'الشركة: شركة',
    ]);
  });

  it('builds route badges safely', () => {
    expect(buildRouteDefaultBadges({
      sectionKey: 'port-2',
      currency: 'IQD',
      defaultTransPrice: 1000,
      defaultCostUsd: null,
      defaultAmountIqd: 250000,
    }, (key) => key)).toEqual([
      'port-2',
      'IQD',
      'سعر النقل: 1000',
      false,
      'مبلغ د.ع: 250000',
    ]);
  });
});

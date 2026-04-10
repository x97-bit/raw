export function buildDefaultsPageCopy({ activeTab, accountFormId, routeFormId }) {
  const isAccountTab = activeTab === 'account';

  return {
    listTitle: isAccountTab
      ? 'سجلات افتراضيات التاجر'
      : 'سجلات افتراضيات المسار',
    formTitle: isAccountTab
      ? (accountFormId
        ? 'تعديل افتراضيات التاجر'
        : 'افتراضيات تاجر جديدة')
      : (routeFormId
        ? 'تعديل افتراضيات المسار'
        : 'افتراضيات مسار جديدة'),
    formSubtitle: isAccountTab
      ? 'تُطبَّق على هذا القسم فقط.'
      : 'تُطبَّق بحسب القسم + المحافظة + العملة.',
    saveLabel: isAccountTab
      ? 'حفظ افتراضيات التاجر'
      : 'حفظ افتراضيات المسار',
    emptyLabel: isAccountTab
      ? 'لا توجد سجلات لهذا القسم.'
      : 'لا توجد مسارات محفوظة لهذا القسم.',
  };
}

export function buildAccountDefaultBadges(row, showSectionLabel) {
  return [
    showSectionLabel(row.sectionKey),
    row.defaultCurrency,
    row.defaultDriverName && `السائق: ${row.defaultDriverName}`,
    row.defaultGovName && `المحافظة: ${row.defaultGovName}`,
    row.defaultCompanyName && `الشركة: ${row.defaultCompanyName}`,
  ];
}

export function buildRouteDefaultBadges(row, showSectionLabel) {
  return [
    showSectionLabel(row.sectionKey),
    row.currency,
    row.defaultTransPrice !== null && `سعر النقل: ${row.defaultTransPrice}`,
    row.defaultCostUsd !== null && `كلفة $: ${row.defaultCostUsd}`,
    row.defaultAmountIqd !== null && `مبلغ د.ع: ${row.defaultAmountIqd}`,
  ];
}

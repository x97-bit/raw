function parsePositiveOrder(value, fallbackValue) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallbackValue;
}

export function buildOrderedFormSections({
  sections = [],
  configMap = {},
  editableCustomFields = [],
  formulaCustomFields = [],
  fallbackTitle = 'تفاصيل الحركة',
  fallbackSubtitle = '',
}) {
  const baseSections = sections.length > 0
    ? sections.map((section, sectionIndex) => ({
        ...section,
        sectionIndex,
        items: [],
      }))
    : [{
        title: fallbackTitle,
        subtitle: fallbackSubtitle,
        fields: [],
        sectionIndex: 0,
        items: [],
      }];

  const builtInAnchors = [];
  let builtInFallbackOrder = 1;

  baseSections.forEach((section) => {
    (section.fields || []).forEach((field) => {
      const sortOrder = parsePositiveOrder(configMap[field.key]?.sortOrder, builtInFallbackOrder);
      builtInFallbackOrder += 1;
      builtInAnchors.push({
        sectionIndex: section.sectionIndex,
        sortOrder,
      });
      section.items.push({
        key: field.key,
        kind: 'builtIn',
        sortOrder,
        field,
      });
    });
  });

  const resolveSectionIndex = (sortOrder) => {
    if (builtInAnchors.length === 0) return 0;

    let previousAnchor = null;
    for (const anchor of builtInAnchors) {
      if (sortOrder < anchor.sortOrder) break;
      previousAnchor = anchor;
    }

    return previousAnchor?.sectionIndex ?? builtInAnchors[0].sectionIndex;
  };

  const appendCustomItems = (fields, kind, startFallbackOrder) => {
    let fallbackOrder = startFallbackOrder;
    (fields || []).forEach((field) => {
      const fieldKey = field.fieldKey || field.key;
      const sortOrder = parsePositiveOrder(
        configMap[fieldKey]?.sortOrder,
        parsePositiveOrder(field.sortOrder, fallbackOrder),
      );
      fallbackOrder = Math.max(fallbackOrder + 1, sortOrder + 1);
      const sectionIndex = resolveSectionIndex(sortOrder);
      const section = baseSections[sectionIndex] || baseSections[0];
      section.items.push({
        key: fieldKey,
        kind,
        sortOrder,
        field,
      });
    });
    return fallbackOrder;
  };

  let nextCustomOrder = Math.max(builtInFallbackOrder, builtInAnchors.length + 1);
  nextCustomOrder = appendCustomItems(editableCustomFields, 'custom', nextCustomOrder);
  appendCustomItems(formulaCustomFields, 'formula', nextCustomOrder);

  return baseSections
    .map((section) => ({
      ...section,
      items: section.items.sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .filter((section) => section.items.length > 0);
}

export function filterSectionsByCurrency(sections, currency) {
  const normalized = String(currency || 'USD').toUpperCase();
  if (normalized === 'BOTH') return sections || [];
  const hideSuffix = normalized === 'USD' ? '_iqd' : '_usd';
  return (sections || [])
    .map((section) => ({
      ...section,
      items: (section.items || []).filter((item) => {
        const key = String(item?.key || '').toLowerCase();
        return !key.endsWith(hideSuffix);
      }),
    }))
    .filter((section) => (section.items || []).length > 0);
}

import { matchesFieldTarget } from '../../utils/fieldConfigTargets';

export function filterCompatibleSelection(selectedKeys, compatibleItems = []) {
  const allowedKeys = new Set((compatibleItems || []).map((item) => item.key));
  return (selectedKeys || []).filter((key) => allowedKeys.has(key));
}

export function ensureSelectionOrFallback(selectedKeys = [], fallbackKey) {
  if (selectedKeys.length > 0) return selectedKeys;
  return fallbackKey ? [fallbackKey] : [];
}

export function toggleMultiSelection(selectedKeys = [], key) {
  return selectedKeys.includes(key)
    ? selectedKeys.filter((item) => item !== key)
    : [...selectedKeys, key];
}

export function toggleNonEmptyTargetSelection(selectedKeys = [], key, fallbackKey) {
  const currentTargets = selectedKeys.length > 0
    ? selectedKeys
    : ensureSelectionOrFallback([], fallbackKey);
  const nextTargets = currentTargets.includes(key)
    ? currentTargets.filter((item) => item !== key)
    : [...currentTargets, key];
  return ensureSelectionOrFallback(nextTargets, key);
}

export function toggleAllSections(selectedKeys = [], compatibleSections = []) {
  const allKeys = compatibleSections.map((section) => section.key);
  return selectedKeys.length === allKeys.length ? [] : allKeys;
}

export function mergeFieldManagementFieldConfigs({
  configs = [],
  customFieldsList = [],
  sectionFields = [],
  selectedSection,
  selectedTarget,
}) {
  const scopedCustomFields = customFieldsList.filter((field) => matchesFieldTarget(field, selectedSection, selectedTarget));
  const allFields = [...sectionFields];

  scopedCustomFields.forEach((customField) => {
    if (!allFields.find((field) => field.key === customField.fieldKey)) {
      allFields.push({
        key: customField.fieldKey,
        label: customField.label,
        type: customField.fieldType,
        isCustom: true,
        customId: customField.id,
      });
    }
  });

  return allFields
    .map((field, index) => {
      const config = configs.find((entry) => entry.fieldKey === field.key);
      const baseLabel = field.baseLabel || field.label;
      return {
        ...field,
        label: baseLabel,
        baseLabel,
        displayLabel: typeof config?.displayLabel === 'string' ? config.displayLabel : '',
        visible: config
          ? (config.visible === 1 || config.visible === true)
          : (field.isCustom ? false : (field.defaultVisible ?? true)),
        sortOrder: config ? (config.sortOrder || 0) : index + 1,
      };
    })
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

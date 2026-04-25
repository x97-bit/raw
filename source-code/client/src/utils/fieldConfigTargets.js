import {
  getConfiguredTargetsForSection,
  isConfiguredTransactionSection,
} from "./sectionScreenSpecs";

export const FIELD_CONFIG_TARGETS = {
  default: { key: "default", label: "الواجهة العامة", shortLabel: "عام" },
  list: { key: "list", label: "القائمة / الكشف", shortLabel: "قائمة" },
  statement: { key: "statement", label: "كشف الحساب", shortLabel: "كشف" },
  invoice: { key: "invoice", label: "الفاتورة", shortLabel: "فاتورة" },
  payment: { key: "payment", label: "سند قبض", shortLabel: "سند قبض" },
  "debit-note": {
    key: "debit-note",
    label: "سند إضافة",
    shortLabel: "سند إضافة",
  },
};

export const INVOICE_FORM_FIELDS = [];
export const PAYMENT_FORM_FIELDS = [];

export function getAvailableFieldConfigTargets(sectionKey) {
  if (!sectionKey) return [FIELD_CONFIG_TARGETS.default];

  if (isConfiguredTransactionSection(sectionKey)) {
    return getConfiguredTargetsForSection(sectionKey)
      .map(targetKey => FIELD_CONFIG_TARGETS[targetKey])
      .filter(Boolean);
  }

  if (sectionKey === "fx" || sectionKey.startsWith("fx-")) {
    return [FIELD_CONFIG_TARGETS.list, FIELD_CONFIG_TARGETS.invoice];
  }

  return [FIELD_CONFIG_TARGETS.default];
}

export function getDefaultFieldConfigTarget(sectionKey) {
  return getAvailableFieldConfigTargets(sectionKey)[0]?.key || "default";
}

export function buildFieldConfigKey(sectionKey, targetKey) {
  if (!sectionKey) return sectionKey;
  if (!targetKey || targetKey === "default") return sectionKey;
  return `${sectionKey}::${targetKey}`;
}

export function usesLegacyFieldConfigFallback(targetKey) {
  return (
    targetKey === "default" || targetKey === "list" || targetKey === "statement"
  );
}

export function getScopedFieldSectionKeys(sectionKey, targetKey) {
  if (!sectionKey) return [];
  if (!targetKey || targetKey === "default") return [sectionKey];

  const scopedKeys = [buildFieldConfigKey(sectionKey, targetKey)];
  if (usesLegacyFieldConfigFallback(targetKey)) {
    scopedKeys.push(sectionKey);
  }
  return Array.from(new Set(scopedKeys));
}

export function isSectionTargetCompatible(sectionKey, targetKey) {
  if (!sectionKey) return false;
  return getAvailableFieldConfigTargets(sectionKey).some(
    target => target.key === (targetKey || "default")
  );
}

export function expandFieldSectionsForTarget(sectionKeys, targetKey) {
  const baseSections = Array.from(new Set((sectionKeys || []).filter(Boolean)));
  if (!targetKey || targetKey === "default") {
    return baseSections;
  }
  return baseSections.map(sectionKey =>
    buildFieldConfigKey(sectionKey, targetKey)
  );
}

export function matchesFieldTarget(field, sectionKey, targetKey) {
  const fieldSections = Array.isArray(field?.sectionKeys)
    ? field.sectionKeys
    : [];
  return getScopedFieldSectionKeys(sectionKey, targetKey).some(key =>
    fieldSections.includes(key)
  );
}

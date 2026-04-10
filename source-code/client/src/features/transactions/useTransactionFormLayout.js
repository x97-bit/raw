import { useCallback, useMemo } from 'react';
import { isEditableCustomField } from '../../utils/customFields';
import { getFieldLabel } from '../../utils/fieldConfigMetadata';
import { buildOrderedFormSections } from '../../utils/orderedFormSections';
import { getSectionFieldLabelMap, getSectionFormLayout, getSectionTargetFields } from '../../utils/sectionScreenSpecs';

export default function useTransactionFormLayout({
  sectionKey,
  formTarget,
  fieldConfigMap = {},
  customFields = [],
  fallbackTitle = 'تفاصيل الحركة',
  fallbackSubtitle = 'يعرض الحقول حسب ترتيب إدارة الحقول',
}) {
  const editableCustomFields = useMemo(
    () => customFields.filter((field) => isEditableCustomField(field) && (field.placement || 'transaction') === 'transaction'),
    [customFields],
  );

  const formulaCustomFields = useMemo(
    () => customFields.filter((field) => field.fieldType === 'formula'),
    [customFields],
  );

  const builtInFieldLabelMap = useMemo(
    () => (sectionKey ? getSectionFieldLabelMap(sectionKey, formTarget) : {}),
    [formTarget, sectionKey],
  );

  const activeBuiltInFormFields = useMemo(
    () => (sectionKey ? getSectionTargetFields(sectionKey, formTarget) : []),
    [formTarget, sectionKey],
  );

  const visibleBuiltInFieldKeys = useMemo(
    () => new Set(
      activeBuiltInFormFields
        .filter((field) => (fieldConfigMap[field.key]?.visible ?? true))
        .map((field) => field.key),
    ),
    [activeBuiltInFormFields, fieldConfigMap],
  );

  const builtInFormFieldsByKey = useMemo(
    () => Object.fromEntries(activeBuiltInFormFields.map((field) => [field.key, field])),
    [activeBuiltInFormFields],
  );

  const activeFormLayout = useMemo(
    () => (sectionKey ? getSectionFormLayout(sectionKey, formTarget) : []),
    [formTarget, sectionKey],
  );

  const visibleEditSections = useMemo(
    () => activeFormLayout
      .map((section) => ({
        ...section,
        fields: section.keys
          .map((fieldKey) => builtInFormFieldsByKey[fieldKey])
          .filter((field) => field && (fieldConfigMap[field.key]?.visible ?? true)),
      }))
      .filter((section) => section.fields.length > 0),
    [activeFormLayout, builtInFormFieldsByKey, fieldConfigMap],
  );

  const orderedSections = useMemo(
    () => buildOrderedFormSections({
      sections: visibleEditSections,
      configMap: fieldConfigMap,
      editableCustomFields,
      formulaCustomFields,
      fallbackTitle,
      fallbackSubtitle,
    }),
    [editableCustomFields, fallbackSubtitle, fallbackTitle, fieldConfigMap, formulaCustomFields, visibleEditSections],
  );

  const getBuiltInFieldLabel = useCallback(
    (fieldKey, fallbackLabel) => (
      getFieldLabel(fieldConfigMap, fieldKey, fallbackLabel || builtInFieldLabelMap[fieldKey] || fieldKey)
    ),
    [builtInFieldLabelMap, fieldConfigMap],
  );

  return {
    editableCustomFields,
    formulaCustomFields,
    visibleBuiltInFieldKeys,
    orderedSections,
    getBuiltInFieldLabel,
  };
}

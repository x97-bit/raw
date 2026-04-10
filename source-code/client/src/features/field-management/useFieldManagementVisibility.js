import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildFieldConfigKey,
  isSectionTargetCompatible,
  usesLegacyFieldConfigFallback,
} from '../../utils/fieldConfigTargets';
import { FIELD_MANAGEMENT_SECTIONS as SECTIONS } from '../../utils/fieldManagementConfig';
import {
  buildFieldConfigPayload,
  reorderFieldConfigs,
} from '../../utils/fieldManagementHelpers';
import {
  filterCompatibleSelection,
  mergeFieldManagementFieldConfigs,
  toggleAllSections,
  toggleMultiSelection,
} from './fieldManagementPageHelpers';

export default function useFieldManagementVisibility({
  api,
  customFieldsList,
  selectedSection,
  selectedTarget,
  getSectionFieldsForTarget,
  showMessage,
}) {
  const [fieldConfigs, setFieldConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [touchDragIndex, setTouchDragIndex] = useState(null);
  const dragItemRef = useRef(null);

  const [editingDisplayLabelKey, setEditingDisplayLabelKey] = useState(null);
  const [editingDisplayLabelValue, setEditingDisplayLabelValue] = useState('');

  const [showExportImport, setShowExportImport] = useState(false);
  const [targetSections, setTargetSections] = useState([]);

  const activeConfigKey = useMemo(
    () => buildFieldConfigKey(selectedSection, selectedTarget),
    [selectedSection, selectedTarget],
  );

  const compatibleTargetSections = useMemo(
    () => SECTIONS.filter(
      (section) => section.key !== selectedSection && isSectionTargetCompatible(section.key, selectedTarget),
    ),
    [selectedSection, selectedTarget],
  );

  const loadFieldConfigSet = useCallback(async (sectionKey, targetKey) => {
    const configKey = buildFieldConfigKey(sectionKey, targetKey);
    const configs = await api(`/field-config/${configKey}`);
    if (configs?.length > 0) return configs;
    if (usesLegacyFieldConfigFallback(targetKey) && configKey !== sectionKey) {
      return api(`/field-config/${sectionKey}`);
    }
    return configs || [];
  }, [api]);

  const loadFieldConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const configs = await loadFieldConfigSet(selectedSection, selectedTarget);
      const sectionFields = getSectionFieldsForTarget(selectedSection, selectedTarget);
      const merged = mergeFieldManagementFieldConfigs({
        configs,
        customFieldsList,
        sectionFields,
        selectedSection,
        selectedTarget,
      });
      setFieldConfigs(merged);
    } catch (error) {
      console.error('Failed to load field configs:', error);
    } finally {
      setLoading(false);
    }
  }, [
    customFieldsList,
    getSectionFieldsForTarget,
    loadFieldConfigSet,
    selectedSection,
    selectedTarget,
  ]);

  useEffect(() => {
    loadFieldConfigs();
  }, [loadFieldConfigs]);

  useEffect(() => {
    setTargetSections((prev) => filterCompatibleSelection(prev, compatibleTargetSections));
  }, [compatibleTargetSections]);

  const toggleVisibility = useCallback((key) => {
    setFieldConfigs((prev) => prev.map((field) => (
      field.key === key ? { ...field, visible: !field.visible } : field
    )));
  }, []);

  const updateDisplayLabel = useCallback((key, value) => {
    setFieldConfigs((prev) => prev.map((field) => (
      field.key === key ? { ...field, displayLabel: value } : field
    )));
  }, []);

  const startDisplayLabelEdit = useCallback((field) => {
    setEditingDisplayLabelKey(field.key);
    setEditingDisplayLabelValue(field.displayLabel || '');
  }, []);

  const cancelDisplayLabelEdit = useCallback(() => {
    setEditingDisplayLabelKey(null);
    setEditingDisplayLabelValue('');
  }, []);

  const saveDisplayLabelEdit = useCallback((field) => {
    updateDisplayLabel(field.key, editingDisplayLabelValue.trim());
    cancelDisplayLabelEdit();
  }, [cancelDisplayLabelEdit, editingDisplayLabelValue, updateDisplayLabel]);

  const handleDragStart = useCallback((event, index) => {
    setDragIndex(index);
    dragItemRef.current = index;
    event.dataTransfer.effectAllowed = 'move';
    const element = event.currentTarget;
    element.style.opacity = '0.5';
    setTimeout(() => {
      element.style.opacity = '1';
    }, 0);
  }, []);

  const handleDragEnter = useCallback((event, index) => {
    event.preventDefault();
    if (dragItemRef.current === null) return;
    setDragOverIndex(index);
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      setFieldConfigs((prev) => reorderFieldConfigs(prev, dragIndex, dragOverIndex));
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  }, [dragIndex, dragOverIndex]);

  const handleDragLeave = useCallback((event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDragOverIndex(null);
    }
  }, []);

  const moveTouchItem = useCallback((fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= fieldConfigs.length) return;
    setFieldConfigs((prev) => reorderFieldConfigs(prev, fromIndex, toIndex));
    setTouchDragIndex(toIndex);
  }, [fieldConfigs.length]);

  const saveConfigs = useCallback(async () => {
    setSaving(true);
    try {
      const fields = buildFieldConfigPayload(fieldConfigs);
      await api(`/field-config/${activeConfigKey}`, {
        method: 'PUT',
        body: JSON.stringify({ fields }),
      });
      showMessage('تم حفظ إعدادات الحقول بنجاح');
      cancelDisplayLabelEdit();
    } catch (error) {
      showMessage(`خطأ في الحفظ: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [activeConfigKey, api, cancelDisplayLabelEdit, fieldConfigs, showMessage]);

  const toggleTargetSection = useCallback((key) => {
    setTargetSections((prev) => toggleMultiSelection(prev, key));
  }, []);

  const selectAllTargetSections = useCallback(() => {
    setTargetSections((prev) => toggleAllSections(prev, compatibleTargetSections));
  }, [compatibleTargetSections]);

  const toggleExportImportPanel = useCallback(() => {
    setShowExportImport((prev) => !prev);
    setTargetSections([]);
  }, []);

  const copySettingsToSections = useCallback(async () => {
    if (targetSections.length === 0) {
      showMessage('يرجى اختيار قسم واحد على الأقل');
      return;
    }

    setSaving(true);
    try {
      const fields = buildFieldConfigPayload(fieldConfigs);
      let successCount = 0;

      for (const sectionKey of targetSections) {
        try {
          await api(`/field-config/${buildFieldConfigKey(sectionKey, selectedTarget)}`, {
            method: 'PUT',
            body: JSON.stringify({ fields }),
          });
          successCount += 1;
        } catch (error) {
          console.error(`Failed to copy to ${sectionKey}:`, error);
        }
      }

      showMessage(`تم نسخ الإعدادات إلى ${successCount} من ${targetSections.length} أقسام بنجاح`);
      setShowExportImport(false);
      setTargetSections([]);
    } catch (error) {
      showMessage(`خطأ في النسخ: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [api, fieldConfigs, selectedTarget, showMessage, targetSections]);

  const importFromSection = useCallback(async (sourceKey) => {
    setSaving(true);
    try {
      const sourceConfigs = await loadFieldConfigSet(sourceKey, selectedTarget);
      const fields = sourceConfigs.map((config) => ({
        fieldKey: config.fieldKey,
        visible: config.visible === 1 || config.visible === true,
        sortOrder: config.sortOrder || 0,
        displayLabel: config.displayLabel || '',
      }));

      await api(`/field-config/${activeConfigKey}`, {
        method: 'PUT',
        body: JSON.stringify({ fields }),
      });

      const sourceSectionLabel = SECTIONS.find((section) => section.key === sourceKey)?.label;
      showMessage(`تم استيراد إعدادات ${sourceSectionLabel} بنجاح`);
      setShowExportImport(false);
      await loadFieldConfigs();
    } catch (error) {
      showMessage(`خطأ في الاستيراد: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [activeConfigKey, api, loadFieldConfigSet, loadFieldConfigs, selectedTarget, showMessage]);

  const visibleCount = useMemo(
    () => fieldConfigs.filter((field) => field.visible).length,
    [fieldConfigs],
  );

  return {
    cancelDisplayLabelEdit,
    compatibleTargetSections,
    copySettingsToSections,
    dragIndex,
    dragOverIndex,
    editingDisplayLabelKey,
    editingDisplayLabelValue,
    fieldConfigs,
    handleDragEnd,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDragStart,
    importFromSection,
    loadFieldConfigs,
    loading,
    moveTouchItem,
    saveConfigs,
    saveDisplayLabelEdit,
    saving,
    selectAllTargetSections,
    setEditingDisplayLabelValue,
    showExportImport,
    startDisplayLabelEdit,
    targetSections,
    toggleExportImportPanel,
    toggleTargetSection,
    toggleVisibility,
    touchDragIndex,
    visibleCount,
  };
}

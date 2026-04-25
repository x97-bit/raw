import { useCallback, useEffect, useMemo, useState } from "react";
import {
  expandFieldSectionsForTarget,
  isSectionTargetCompatible,
  matchesFieldTarget,
} from "../../utils/fieldConfigTargets";
import {
  FIELD_MANAGEMENT_SECTIONS as SECTIONS,
  OPERATORS,
  SECTION_FIELDS_MAP,
} from "../../utils/fieldManagementConfig";
import {
  appendFormulaPart,
  buildFormulaPreview,
  collectNumericFormulaFields,
  createInitialCustomFieldForm,
  hasRequiredFormulaFields,
  parseCustomFieldOptions,
  removeFormulaPart,
  updateFormulaPart,
} from "../../utils/fieldManagementHelpers";
import {
  ensureSelectionOrFallback,
  filterCompatibleSelection,
  toggleAllSections,
  toggleMultiSelection,
  toggleNonEmptyTargetSelection,
} from "./fieldManagementPageHelpers";

export default function useFieldManagementCustomFields({
  api,
  availableTargets,
  selectedSection,
  selectedTarget,
  getSectionFieldsForTarget,
  showMessage,
}) {
  const [customFieldsList, setCustomFieldsList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newField, setNewField] = useState(() =>
    createInitialCustomFieldForm(selectedTarget)
  );

  const [editingFieldId, setEditingFieldId] = useState(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingFormula, setEditingFormula] = useState(null);
  const [editingTargets, setEditingTargets] = useState([]);
  const [editingSections, setEditingSections] = useState([]);

  const getCompatibleSectionsForTargets = useCallback(
    (targetKeys = []) => {
      const effectiveTargets = (
        targetKeys.length > 0 ? targetKeys : [selectedTarget]
      ).filter(Boolean);
      return SECTIONS.filter(section =>
        effectiveTargets.every(targetKey =>
          isSectionTargetCompatible(section.key, targetKey)
        )
      );
    },
    [selectedTarget]
  );

  const selectedNewFieldTargets = useMemo(
    () => (newField.targets.length > 0 ? newField.targets : [selectedTarget]),
    [newField.targets, selectedTarget]
  );

  const compatibleSectionsForNewFieldTargets = useMemo(
    () => getCompatibleSectionsForTargets(selectedNewFieldTargets),
    [getCompatibleSectionsForTargets, selectedNewFieldTargets]
  );

  const editingCurrentTargets = useMemo(
    () => (editingTargets.length > 0 ? editingTargets : [selectedTarget]),
    [editingTargets, selectedTarget]
  );

  const editingCompatibleSections = useMemo(
    () => getCompatibleSectionsForTargets(editingCurrentTargets),
    [editingCurrentTargets, getCompatibleSectionsForTargets]
  );

  const loadCustomFields = useCallback(async () => {
    try {
      const customs = await api("/custom-fields");
      setCustomFieldsList(customs);
    } catch (error) {
      console.error(error);
    }
  }, [api]);

  useEffect(() => {
    loadCustomFields();
  }, [loadCustomFields]);

  useEffect(() => {
    setNewField(prev => {
      const filteredTargets = filterCompatibleSelection(
        prev.targets,
        availableTargets
      );
      const nextTargets = ensureSelectionOrFallback(
        filteredTargets,
        selectedTarget
      );
      if (
        nextTargets.length === prev.targets.length &&
        nextTargets.every(
          (targetKey, index) => targetKey === prev.targets[index]
        )
      ) {
        return prev;
      }
      return { ...prev, targets: nextTargets };
    });
  }, [availableTargets, selectedTarget]);

  useEffect(() => {
    setNewField(prev => {
      const filteredSections = filterCompatibleSelection(
        prev.sections,
        compatibleSectionsForNewFieldTargets
      );
      if (
        filteredSections.length === prev.sections.length &&
        filteredSections.every(
          (sectionKey, index) => sectionKey === prev.sections[index]
        )
      ) {
        return prev;
      }
      return { ...prev, sections: filteredSections };
    });
  }, [compatibleSectionsForNewFieldTargets]);

  useEffect(() => {
    if (!editingFieldId) return;
    setEditingTargets(prev => {
      const filteredTargets = filterCompatibleSelection(prev, availableTargets);
      const nextTargets = ensureSelectionOrFallback(
        filteredTargets,
        selectedTarget
      );
      if (
        nextTargets.length === prev.length &&
        nextTargets.every((targetKey, index) => targetKey === prev[index])
      ) {
        return prev;
      }
      return nextTargets;
    });
  }, [availableTargets, editingFieldId, selectedTarget]);

  useEffect(() => {
    if (!editingFieldId) return;
    setEditingSections(prev => {
      const filteredSections = filterCompatibleSelection(
        prev,
        editingCompatibleSections
      );
      if (filteredSections.length > 0) return filteredSections;
      if (
        editingCompatibleSections.some(
          section => section.key === selectedSection
        )
      ) {
        return [selectedSection];
      }
      return editingCompatibleSections[0]
        ? [editingCompatibleSections[0].key]
        : [];
    });
  }, [editingCompatibleSections, editingFieldId, selectedSection]);

  const getCustomFieldsForSections = useCallback(
    (sectionKeys = [], targetKey = selectedTarget) => {
      const keys = sectionKeys.length > 0 ? sectionKeys : [selectedSection];
      return customFieldsList.filter(field =>
        keys.some(key => matchesFieldTarget(field, key, targetKey))
      );
    },
    [customFieldsList, selectedSection, selectedTarget]
  );

  const currentCustomFields = useMemo(
    () => getCustomFieldsForSections([selectedSection], selectedTarget),
    [getCustomFieldsForSections, selectedSection, selectedTarget]
  );

  const expandSectionsForTargets = useCallback(
    (sections, targetKeys = []) => {
      const baseSections = (
        sections.length > 0 ? sections : [selectedSection]
      ).filter(Boolean);
      const effectiveTargets = (
        targetKeys.length > 0 ? targetKeys : [selectedTarget]
      ).filter(Boolean);
      return Array.from(
        new Set(
          effectiveTargets.flatMap(targetKey =>
            expandFieldSectionsForTarget(baseSections, targetKey)
          )
        )
      );
    },
    [selectedSection, selectedTarget]
  );

  const addCustomField = useCallback(async () => {
    if (!newField.label.trim()) {
      showMessage("يرجى إدخال اسم الحقل");
      return;
    }

    if (
      newField.fieldType === "formula" &&
      !hasRequiredFormulaFields(newField.formulaParts)
    ) {
      showMessage("يرجى اختيار حقلين على الأقل في المعادلة");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        label: newField.label,
        fieldType: newField.fieldType,
        options:
          newField.fieldType === "select"
            ? parseCustomFieldOptions(newField.options)
            : null,
        defaultValue: newField.defaultValue || null,
        placement: newField.placement,
        sections: expandSectionsForTargets(
          newField.sections,
          selectedNewFieldTargets
        ),
        formula:
          newField.fieldType === "formula"
            ? { parts: newField.formulaParts }
            : null,
      };

      await api("/custom-fields", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showMessage("تم إضافة الحقل المخصص بنجاح");
      setShowAddForm(false);
      setNewField(createInitialCustomFieldForm(selectedTarget));
      await loadCustomFields();
    } catch (error) {
      showMessage(`خطأ: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [
    api,
    expandSectionsForTargets,
    loadCustomFields,
    newField,
    selectedNewFieldTargets,
    selectedTarget,
    showMessage,
  ]);

  const deleteCustomField = useCallback(
    async id => {
      if (
        !confirm(
          "هل أنت متأكد من حذف هذا الحقل المخصص؟ سيتم حذف جميع القيم المرتبطة به."
        )
      )
        return;

      try {
        await api(`/custom-fields/${id}`, { method: "DELETE" });
        showMessage("تم حذف الحقل المخصص");
        await loadCustomFields();
      } catch (error) {
        showMessage(`خطأ: ${error.message}`);
      }
    },
    [api, loadCustomFields, showMessage]
  );

  const startEditField = useCallback(
    customField => {
      const initialTargets = availableTargets
        .filter(target =>
          matchesFieldTarget(customField, selectedSection, target.key)
        )
        .map(target => target.key);
      const effectiveInitialTargets = ensureSelectionOrFallback(
        initialTargets,
        selectedTarget
      );
      const initialSections = getCompatibleSectionsForTargets(
        effectiveInitialTargets
      )
        .filter(section =>
          effectiveInitialTargets.some(targetKey =>
            matchesFieldTarget(customField, section.key, targetKey)
          )
        )
        .map(section => section.key);

      setEditingFieldId(customField.id);
      setEditingLabel(customField.label);
      setEditingTargets(effectiveInitialTargets);
      setEditingSections(
        ensureSelectionOrFallback(initialSections, selectedSection)
      );

      if (customField.fieldType === "formula" && customField.formula?.parts) {
        setEditingFormula({
          id: customField.id,
          label: customField.label,
          fieldType: customField.fieldType,
          formulaParts: [...customField.formula.parts],
          options: customField.options,
          defaultValue: customField.defaultValue,
          placement: customField.placement,
        });
        return;
      }

      setEditingFormula(null);
    },
    [
      availableTargets,
      getCompatibleSectionsForTargets,
      selectedSection,
      selectedTarget,
    ]
  );

  const cancelEditField = useCallback(() => {
    setEditingFieldId(null);
    setEditingLabel("");
    setEditingFormula(null);
    setEditingTargets([]);
    setEditingSections([]);
  }, []);

  const saveEditField = useCallback(
    async id => {
      if (!editingLabel.trim()) {
        showMessage("اسم الحقل لا يمكن أن يكون فارغًا");
        return;
      }

      const customField = customFieldsList.find(field => field.id === id);
      if (!customField) {
        showMessage("تعذر العثور على الحقل المطلوب");
        return;
      }

      if (
        editingFormula &&
        customField.fieldType === "formula" &&
        !hasRequiredFormulaFields(editingFormula.formulaParts)
      ) {
        showMessage("يرجى اختيار حقلين على الأقل في المعادلة");
        return;
      }

      try {
        const targetKeys = editingCurrentTargets;
        const baseSections = ensureSelectionOrFallback(
          editingSections,
          selectedSection
        );
        const payload = {
          label: editingLabel,
          fieldType: customField.fieldType,
          options: customField.options,
          defaultValue: customField.defaultValue,
          placement: customField.placement,
          sections: expandSectionsForTargets(baseSections, targetKeys),
        };

        if (editingFormula && customField.fieldType === "formula") {
          payload.formula = { parts: editingFormula.formulaParts };
        }

        await api(`/custom-fields/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        showMessage("تم تحديث الحقل بنجاح");
        cancelEditField();
        await loadCustomFields();
      } catch (error) {
        showMessage(`خطأ في التحديث: ${error.message}`);
      }
    },
    [
      api,
      cancelEditField,
      customFieldsList,
      editingCompatibleSections,
      editingCurrentTargets,
      editingFormula,
      editingLabel,
      editingSections,
      expandSectionsForTargets,
      loadCustomFields,
      selectedSection,
      showMessage,
    ]
  );

  const addFormulaPart = useCallback(() => {
    setNewField(prev => ({
      ...prev,
      formulaParts: appendFormulaPart(prev.formulaParts),
    }));
  }, []);

  const removeNewFormulaPart = useCallback(index => {
    setNewField(prev => ({
      ...prev,
      formulaParts: removeFormulaPart(prev.formulaParts, index),
    }));
  }, []);

  const updateNewFormulaPart = useCallback((index, value) => {
    setNewField(prev => ({
      ...prev,
      formulaParts: updateFormulaPart(prev.formulaParts, index, value),
    }));
  }, []);

  const addEditFormulaPart = useCallback(() => {
    setEditingFormula(prev => ({
      ...prev,
      formulaParts: appendFormulaPart(prev.formulaParts),
    }));
  }, []);

  const removeEditFormulaPart = useCallback(index => {
    setEditingFormula(prev => ({
      ...prev,
      formulaParts: removeFormulaPart(prev.formulaParts, index),
    }));
  }, []);

  const updateEditFormulaPart = useCallback((index, value) => {
    setEditingFormula(prev => ({
      ...prev,
      formulaParts: updateFormulaPart(prev.formulaParts, index, value),
    }));
  }, []);

  const getAvailableFormulaFields = useCallback(() => {
    const sectionKeys =
      newField.sections.length > 0 ? newField.sections : [selectedSection];
    return collectNumericFormulaFields({
      sectionKeys,
      targetKeys: selectedNewFieldTargets,
      getSectionFieldsForTarget,
      getCustomFieldsForSections,
    });
  }, [
    getCustomFieldsForSections,
    getSectionFieldsForTarget,
    newField.sections,
    selectedNewFieldTargets,
    selectedSection,
  ]);

  const getFormulaPreview = useCallback(
    () =>
      buildFormulaPreview(
        newField.formulaParts,
        getAvailableFormulaFields(),
        OPERATORS
      ),
    [getAvailableFormulaFields, newField.formulaParts]
  );

  const getEditFormulaFields = useCallback(() => {
    const sectionKeys =
      editingSections.length > 0 ? editingSections : [selectedSection];
    return collectNumericFormulaFields({
      sectionKeys,
      targetKeys: editingCurrentTargets,
      getSectionFieldsForTarget,
      getCustomFieldsForSections,
      excludeCustomFieldId: editingFieldId,
    });
  }, [
    editingCurrentTargets,
    editingFieldId,
    editingSections,
    getCustomFieldsForSections,
    getSectionFieldsForTarget,
    selectedSection,
  ]);

  const getEditFormulaPreview = useCallback(() => {
    if (!editingFormula) return "";
    return buildFormulaPreview(
      editingFormula.formulaParts,
      getEditFormulaFields(),
      OPERATORS
    );
  }, [editingFormula, getEditFormulaFields]);

  const resolveFormulaTokenLabel = useCallback(
    fieldKey => {
      const selectedField = getSectionFieldsForTarget(
        selectedSection,
        selectedTarget
      ).find(field => field.key === fieldKey);
      if (selectedField) return selectedField.label;

      for (const fields of Object.values(SECTION_FIELDS_MAP)) {
        const foundField = fields.find(field => field.key === fieldKey);
        if (foundField) return foundField.label;
      }

      const customField = customFieldsList.find(
        field => field.fieldKey === fieldKey
      );
      if (customField) return customField.label;

      return fieldKey;
    },
    [
      customFieldsList,
      getSectionFieldsForTarget,
      selectedSection,
      selectedTarget,
    ]
  );

  const toggleTarget = useCallback(
    targetKey => {
      setNewField(prev => ({
        ...prev,
        targets: toggleNonEmptyTargetSelection(
          prev.targets,
          targetKey,
          selectedTarget
        ),
      }));
    },
    [selectedTarget]
  );

  const toggleSection = useCallback(sectionKey => {
    setNewField(prev => ({
      ...prev,
      sections: toggleMultiSelection(prev.sections, sectionKey),
    }));
  }, []);

  const selectAllSections = useCallback(() => {
    setNewField(prev => ({
      ...prev,
      sections: toggleAllSections(
        prev.sections,
        compatibleSectionsForNewFieldTargets
      ),
    }));
  }, [compatibleSectionsForNewFieldTargets]);

  const toggleEditingSection = useCallback(sectionKey => {
    setEditingSections(prev => toggleMultiSelection(prev, sectionKey));
  }, []);

  const toggleEditingTarget = useCallback(
    targetKey => {
      setEditingTargets(prev =>
        toggleNonEmptyTargetSelection(prev, targetKey, selectedTarget)
      );
    },
    [selectedTarget]
  );

  const selectAllEditingSections = useCallback(() => {
    setEditingSections(prev =>
      toggleAllSections(prev, editingCompatibleSections)
    );
  }, [editingCompatibleSections]);

  return {
    addCustomField,
    addEditFormulaPart,
    addFormulaPart,
    cancelEditField,
    compatibleSectionsForNewFieldTargets,
    currentCustomFields,
    customFieldsList,
    deleteCustomField,
    editingAvailableTargets: availableTargets,
    editingCompatibleSections,
    editingCurrentTargets,
    editingFieldId,
    editingFormula,
    editingLabel,
    editingSections,
    getAvailableFormulaFields,
    getEditFormulaFields,
    getEditFormulaPreview,
    getFormulaPreview,
    loadCustomFields,
    newField,
    removeEditFormulaPart,
    removeFormulaPart: removeNewFormulaPart,
    resolveFormulaTokenLabel,
    saveEditField,
    saving,
    selectedNewFieldTargets,
    selectAllEditingSections,
    selectAllSections,
    setEditingLabel,
    setNewField,
    showAddForm,
    setShowAddForm,
    startEditField,
    toggleEditingSection,
    toggleEditingTarget,
    toggleSection,
    toggleTarget,
    updateEditFormulaPart,
    updateFormulaPart: updateNewFormulaPart,
  };
}

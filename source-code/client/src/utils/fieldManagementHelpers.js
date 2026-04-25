const EMPTY_FORMULA_FIELD_LABEL = "(اختر حقل)";

export function createFormulaParts() {
  return [{ type: "field", value: "" }];
}

export function createInitialCustomFieldForm(defaultTarget) {
  return {
    label: "",
    fieldType: "text",
    options: "",
    defaultValue: "",
    placement: "transaction",
    targets: defaultTarget ? [defaultTarget] : [],
    sections: [],
    formulaParts: createFormulaParts(),
  };
}

export function appendFormulaPart(parts) {
  return [
    ...parts,
    { type: "operator", value: "+" },
    { type: "field", value: "" },
  ];
}

export function removeFormulaPart(parts, index) {
  const nextParts = [...parts];

  if (index > 0) {
    nextParts.splice(index - 1, 2);
  } else if (nextParts.length > 1) {
    nextParts.splice(0, 2);
  }

  return nextParts.length > 0 ? nextParts : createFormulaParts();
}

export function updateFormulaPart(parts, index, value) {
  const nextParts = [...parts];

  if (!nextParts[index]) {
    return parts;
  }

  nextParts[index] = { ...nextParts[index], value };
  return nextParts;
}

export function hasRequiredFormulaFields(parts) {
  const fieldParts = parts.filter(part => part.type === "field");
  return fieldParts.length >= 2 && fieldParts.every(part => part.value);
}

export function parseCustomFieldOptions(optionsText) {
  return optionsText
    .split(",")
    .map(option => option.trim())
    .filter(Boolean);
}

export function collectNumericFormulaFields({
  sectionKeys = [],
  targetKeys = [],
  getSectionFieldsForTarget,
  getCustomFieldsForSections,
  excludeCustomFieldId = null,
}) {
  const fieldsMap = new Map();

  sectionKeys.forEach(sectionKey => {
    targetKeys.forEach(targetKey => {
      getSectionFieldsForTarget(sectionKey, targetKey)
        .filter(field => ["number", "money"].includes(field.type))
        .forEach(field => {
          if (!fieldsMap.has(field.key)) {
            fieldsMap.set(field.key, field);
          }
        });
    });
  });

  targetKeys.forEach(targetKey => {
    getCustomFieldsForSections(sectionKeys, targetKey)
      .filter(field => ["number", "money"].includes(field.fieldType))
      .filter(field => field.id !== excludeCustomFieldId)
      .forEach(field => {
        if (!fieldsMap.has(field.fieldKey)) {
          fieldsMap.set(field.fieldKey, {
            key: field.fieldKey,
            label: field.label,
            type: field.fieldType,
            isCustom: true,
          });
        }
      });
  });

  return Array.from(fieldsMap.values());
}

export function buildFormulaPreview(parts, availableFields, operators) {
  return parts
    .map(part => {
      if (part.type === "operator") {
        const operator = operators.find(item => item.value === part.value);
        return ` ${operator?.label || part.value} `;
      }

      const field = availableFields.find(item => item.key === part.value);
      return field ? field.label : EMPTY_FORMULA_FIELD_LABEL;
    })
    .join("");
}

export function reorderFieldConfigs(fieldConfigs, fromIndex, toIndex) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= fieldConfigs.length ||
    toIndex >= fieldConfigs.length ||
    fromIndex === toIndex
  ) {
    return fieldConfigs;
  }

  const nextConfigs = [...fieldConfigs];
  const [movedField] = nextConfigs.splice(fromIndex, 1);
  nextConfigs.splice(toIndex, 0, movedField);

  return nextConfigs.map((field, index) => ({
    ...field,
    sortOrder: index + 1,
  }));
}

export function buildFieldConfigPayload(fieldConfigs) {
  return fieldConfigs.map((field, index) => ({
    fieldKey: field.key,
    visible: field.visible,
    sortOrder: index + 1,
    displayLabel: field.displayLabel || "",
  }));
}

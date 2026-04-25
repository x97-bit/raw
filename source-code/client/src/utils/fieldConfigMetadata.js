export function normalizeFieldLabel(displayLabel, fallbackLabel) {
  const trimmedLabel =
    typeof displayLabel === "string" ? displayLabel.trim() : "";
  return trimmedLabel || fallbackLabel;
}

export function buildFieldConfigMap(configs = []) {
  const map = {};
  configs.forEach(config => {
    map[config.fieldKey] = {
      visible: config.visible === 1 || config.visible === true,
      sortOrder: config.sortOrder || 0,
      displayLabel:
        typeof config.displayLabel === "string" ? config.displayLabel : null,
    };
  });
  return map;
}

export function getFieldLabel(configMap, fieldKey, fallbackLabel) {
  return normalizeFieldLabel(
    configMap?.[fieldKey]?.displayLabel,
    fallbackLabel
  );
}

export function applyFieldConfigLabels(fields = [], configMap = {}) {
  return fields.map(field => ({
    ...field,
    label: getFieldLabel(configMap, field.key, field.label),
  }));
}

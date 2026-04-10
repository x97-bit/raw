import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildFieldConfigKey,
  getScopedFieldSectionKeys,
  usesLegacyFieldConfigFallback,
} from '../../utils/fieldConfigTargets';
import { buildFieldConfigMap } from '../../utils/fieldConfigMetadata';
import { getPortFormTarget, buildPortColumnsForTarget, dedupePortCustomFieldsById, getVisiblePortCustomFieldsForTarget, getVisiblePortFormulaFieldsForTarget } from './portPageHelpers';

export default function usePortFieldConfig({
  api,
  sectionKey,
  formType,
}) {
  const [viewColumns, setViewColumns] = useState({ list: [], statement: [] });
  const [customFields, setCustomFields] = useState([]);
  const [viewConfigMaps, setViewConfigMaps] = useState({ list: {}, statement: {}, invoice: {}, payment: {} });

  const activeFormTarget = useMemo(() => getPortFormTarget(formType), [formType]);
  const getFieldConfigMap = useCallback((target) => viewConfigMaps[target] || {}, [viewConfigMaps]);

  const getVisibleCustomFieldsForTarget = useCallback((target) => getVisiblePortCustomFieldsForTarget({
    customFields,
    configMap: getFieldConfigMap(target),
    sectionKey,
    target,
  }), [customFields, getFieldConfigMap, sectionKey]);

  const getVisibleFormulaFieldsForTarget = useCallback((target) => getVisiblePortFormulaFieldsForTarget({
    customFields,
    configMap: getFieldConfigMap(target),
    sectionKey,
    target,
  }), [customFields, getFieldConfigMap, sectionKey]);

  const activeFormCustomFields = useMemo(
    () => [
      ...getVisibleCustomFieldsForTarget(activeFormTarget),
      ...getVisibleFormulaFieldsForTarget(activeFormTarget),
    ],
    [activeFormTarget, getVisibleCustomFieldsForTarget, getVisibleFormulaFieldsForTarget],
  );

  const activeFormFieldConfigMap = useMemo(
    () => getFieldConfigMap(activeFormTarget),
    [activeFormTarget, getFieldConfigMap],
  );

  const loadFieldConfig = useCallback(async () => {
    try {
      const fetchTargetConfigs = async (target) => {
        const configKey = buildFieldConfigKey(sectionKey, target);
        const configs = await api(`/field-config/${configKey}`);
        if (configs?.length > 0) return configs;
        if (usesLegacyFieldConfigFallback(target) && configKey !== sectionKey) {
          return api(`/field-config/${sectionKey}`);
        }
        return configs || [];
      };

      const customFieldSectionKeys = Array.from(new Set([
        ...getScopedFieldSectionKeys(sectionKey, 'list'),
        ...getScopedFieldSectionKeys(sectionKey, 'statement'),
        ...getScopedFieldSectionKeys(sectionKey, 'invoice'),
        ...getScopedFieldSectionKeys(sectionKey, 'payment'),
      ]));

      const [listConfigs, statementConfigs, invoiceConfigs, paymentConfigs, ...customFieldGroups] = await Promise.all([
        fetchTargetConfigs('list'),
        fetchTargetConfigs('statement'),
        fetchTargetConfigs('invoice'),
        fetchTargetConfigs('payment'),
        ...customFieldSectionKeys.map((scopeKey) => api(`/custom-fields?sectionKey=${encodeURIComponent(scopeKey)}`)),
      ]);

      const dedupedCustomFields = dedupePortCustomFieldsById(customFieldGroups);
      const listConfigMap = buildFieldConfigMap(listConfigs);
      const statementConfigMap = buildFieldConfigMap(statementConfigs);
      const invoiceConfigMap = buildFieldConfigMap(invoiceConfigs);
      const paymentConfigMap = buildFieldConfigMap(paymentConfigs);

      setCustomFields(dedupedCustomFields);
      setViewConfigMaps({
        list: listConfigMap,
        statement: statementConfigMap,
        invoice: invoiceConfigMap,
        payment: paymentConfigMap,
      });
      setViewColumns({
        list: buildPortColumnsForTarget({
          sectionKey,
          target: 'list',
          configMap: listConfigMap,
          customFields: dedupedCustomFields,
        }),
        statement: buildPortColumnsForTarget({
          sectionKey,
          target: 'statement',
          configMap: statementConfigMap,
          customFields: dedupedCustomFields,
        }),
      });
    } catch (error) {
      console.error('Failed to load field config:', error);
      setCustomFields([]);
      setViewColumns({
        list: buildPortColumnsForTarget({ sectionKey, target: 'list' }),
        statement: buildPortColumnsForTarget({ sectionKey, target: 'statement' }),
      });
    }
  }, [api, sectionKey]);

  useEffect(() => {
    loadFieldConfig();
  }, [loadFieldConfig]);

  return {
    activeFormCustomFields,
    activeFormFieldConfigMap,
    activeFormTarget,
    customFields,
    getFieldConfigMap,
    getVisibleCustomFieldsForTarget,
    getVisibleFormulaFieldsForTarget,
    viewColumns,
  };
}

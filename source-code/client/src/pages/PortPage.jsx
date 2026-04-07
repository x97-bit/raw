import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { Plus, Search, CreditCard, Save, Printer, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import ExportButtons from '../components/ExportButtons';
import AutocompleteInput from '../components/AutocompleteInput';
import {
  buildCustomFieldValuePayload,
  evaluateCustomFormula,
  getInitialCustomFieldValues,
  isEditableCustomField,
  sanitizeCustomFieldValue,
} from '../utils/customFields';
import {
  buildFieldConfigKey,
  getScopedFieldSectionKeys,
  matchesFieldTarget,
  usesLegacyFieldConfigFallback,
} from '../utils/fieldConfigTargets';
import { buildFieldConfigMap, getFieldLabel } from '../utils/fieldConfigMetadata';
import {
  getSectionColumns,
  getSectionFieldLabelMap,
  getSectionFormLayout,
  getSectionTargetFields,
  STATEMENT_CORE_COLUMN_KEYS,
} from '../utils/sectionScreenSpecs';

const formatNum = n => n ? Number(n).toLocaleString('en-US') : '0';

// Render cell value based on column type
function renderCell(col, row) {
  // Handle formula columns
  if (col.type === 'formula' && col.formula) {
    const result = evaluateCustomFormula(col.formula, row);
    if (result === null) return '-';
    return <span className={`font-bold ${result < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatNum(Math.round(result * 100) / 100)}</span>;
  }

  const val = row[col.dataKey];
  switch (col.type) {
    case 'date': return val?.split(' ')[0] || '-';
    case 'badge':
      return (
        <span className={`px-2 py-0.5 rounded text-xs ${row.TransTypeID === 1 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
          {val}
        </span>
      );
    case 'currency':
      return val === 'USD' ? '$' : val === 'IQD' ? 'د.ع' : val === 'BOTH' ? 'كلاهما' : val || '-';
    case 'number': return val ? formatNum(val) : '-';
    case 'money_usd': return val ? `$${formatNum(val)}` : '-';
    case 'money_generic': return val ? formatNum(val) : '-';
    case 'money_usd_bold':
      return <span className={`font-bold ${(val || 0) < 0 ? 'text-red-600' : 'text-green-700'}`}>{val ? `$${formatNum(val)}` : '-'}</span>;
    case 'money_iqd': return val ? formatNum(val) : '-';
    case 'money_iqd_bold':
      return <span className={`${(val || 0) < 0 ? 'text-red-600' : 'text-gray-700'}`}>{val ? formatNum(val) : '-'}</span>;
    case 'notes': return <span className="text-gray-500 text-xs max-w-[200px] truncate block">{val || row.TraderNote || '-'}</span>;
    default: return val || '-';
  }
}


function FormSection({ title, subtitle, children }) {
  return (
    <section className="rounded-[1.25rem] border border-slate-200/80 bg-white/85 p-4 md:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-4 border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-primary-900">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const EMPTY_SUMMARY = {
  count: 0,
  shipmentCount: 0,
  totalInvoicesUSD: 0,
  totalInvoicesIQD: 0,
  totalPaymentsUSD: 0,
  totalPaymentsIQD: 0,
  totalCostUSD: 0,
  totalCostIQD: 0,
  totalProfitUSD: 0,
  totalProfitIQD: 0,
  balanceUSD: 0,
  balanceIQD: 0,
};

const SECTION_SUMMARY_META = {
  'transport-1': {
    list: [
      { key: 'totalInvoicesUSD', label: 'إجمالي الدولار', format: 'usd' },
      { key: 'totalInvoicesIQD', label: 'إجمالي الدينار', format: 'iqd' },
    ],
    statement: [
      { key: 'balanceUSD', label: 'إجمالي الدولار', format: 'usd', accent: 'text-emerald-600' },
      { key: 'balanceIQD', label: 'إجمالي الدينار', format: 'iqd', accent: 'text-primary-800' },
    ],
  },
  'port-1': {
    list: [
      { key: 'totalInvoicesUSD', label: 'الطلب الكلي دولار', format: 'usd' },
      { key: 'totalInvoicesIQD', label: 'الطلب الكلي دينار', format: 'iqd' },
      { key: 'balanceUSD', label: 'مبلغ المفلتر دولار', format: 'usd', accent: 'text-emerald-600' },
      { key: 'balanceIQD', label: 'مبلغ المفلتر دينار', format: 'iqd', accent: 'text-primary-800' },
    ],
    statement: [
      { key: 'totalInvoicesUSD', label: 'الطلب الكلي دولار', format: 'usd' },
      { key: 'totalInvoicesIQD', label: 'الطلب الكلي دينار', format: 'iqd' },
      { key: 'balanceUSD', label: 'مبلغ المفلتر دولار', format: 'usd', accent: 'text-emerald-600' },
      { key: 'balanceIQD', label: 'مبلغ المفلتر دينار', format: 'iqd', accent: 'text-primary-800' },
    ],
  },
  'port-2': {
    list: [
      { key: 'totalInvoicesUSD', label: 'الطلب الكلي دولار', format: 'usd' },
      { key: 'totalInvoicesIQD', label: 'الطلب الكلي دينار', format: 'iqd' },
      { key: 'balanceUSD', label: 'مبلغ المفلتر دولار', format: 'usd', accent: 'text-emerald-600' },
      { key: 'balanceIQD', label: 'مبلغ المفلتر دينار', format: 'iqd', accent: 'text-primary-800' },
    ],
    statement: [
      { key: 'totalInvoicesUSD', label: 'الطلب الكلي دولار', format: 'usd' },
      { key: 'totalInvoicesIQD', label: 'الطلب الكلي دينار', format: 'iqd' },
      { key: 'balanceUSD', label: 'مبلغ المفلتر دولار', format: 'usd', accent: 'text-emerald-600' },
      { key: 'balanceIQD', label: 'مبلغ المفلتر دينار', format: 'iqd', accent: 'text-primary-800' },
    ],
  },
  'port-3': {
    list: [
      { key: 'totalInvoicesUSD', label: 'الطلب الكلي دولار', format: 'usd' },
      { key: 'totalInvoicesIQD', label: 'الطلب الكلي دينار', format: 'iqd' },
      { key: 'balanceUSD', label: 'مبلغ المحدد دولار', format: 'usd', accent: 'text-emerald-600' },
      { key: 'balanceIQD', label: 'مبلغ المحدد دينار', format: 'iqd', accent: 'text-primary-800' },
    ],
    statement: [
      { key: 'balanceUSD', label: 'مبلغ المحدد دولار', format: 'usd', accent: 'text-emerald-600' },
      { key: 'balanceIQD', label: 'مبلغ المحدد دينار', format: 'iqd', accent: 'text-primary-800' },
    ],
  },
  'partnership-1': {
    list: [
      { key: 'totalInvoicesUSD', label: 'إجمالي الدولار', format: 'usd' },
      { key: 'totalInvoicesIQD', label: 'إجمالي الدينار', format: 'iqd' },
    ],
    statement: [
      { key: 'balanceUSD', label: 'إجمالي الدولار', format: 'usd', accent: 'text-emerald-600' },
      { key: 'balanceIQD', label: 'إجمالي الدينار', format: 'iqd', accent: 'text-primary-800' },
    ],
  },
};

function formatSummaryValue(value, format) {
  if (format === 'usd') return `$${formatNum(value)}`;
  if (format === 'iqd') return formatNum(value);
  return value;
}

export default function PortPage({ portId, portName, accountType, initialView = 'list', initialFormType, onBack, onHome }) {
  const { api, user, can } = useAuth();
  const [view, setView] = useState(initialView === 'statement-select' ? 'list' : initialView);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [goods, setGoods] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [govs, setGovs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formType, setFormType] = useState(initialFormType || 1);
  const [showStatementSelect, setShowStatementSelect] = useState(initialView === 'statement-select');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [stAccount, setStAccount] = useState(null);
  const [statement, setStatement] = useState(null);
  const [msg, setMsg] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [traderText, setTraderText] = useState('');
  const [filters, setFilters] = useState({ accountId: '', from: '', to: '' });
  const [listSummary, setListSummary] = useState(EMPTY_SUMMARY);

  // Dynamic field config
  const [viewColumns, setViewColumns] = useState({ list: [], statement: [] });
  const [customFields, setCustomFields] = useState([]);
  const [viewConfigMaps, setViewConfigMaps] = useState({ list: {}, statement: {}, invoice: {}, payment: {} });
  const [fieldConfigLoaded, setFieldConfigLoaded] = useState(false);

  const LIMIT = 30;

  // Map portId to field config section key
  // SectionPage passes portId as string like 'port-1', 'transport-1', etc.
  const getSectionKey = useCallback(() => {
    // Direct match if portId is already a section key like 'port-1', 'transport-1'
    if (typeof portId === 'string' && portId.includes('-')) return portId;
    // Legacy numeric fallback
    if (portId === 1 || portId === '1') return 'port-1';
    if (portId === 2 || portId === '2') return 'port-2';
    if (portId === 3 || portId === '3') return 'port-3';
    if (portId === 'null' || !portId) {
      if (accountType === 2 || accountType === '2') return 'transport-1';
      if (accountType === 5 || accountType === '5') return 'partnership-1';
      if (accountType === 3 || accountType === '3') return 'fx-1';
    }
    return 'port-1';
  }, [portId, accountType]);
  const sectionKey = getSectionKey();
  const getFieldConfigMap = useCallback((target) => viewConfigMaps[target] || {}, [viewConfigMaps]);
  const getFormTarget = useCallback((type = formType) => (type === 1 ? 'invoice' : 'payment'), [formType]);
  const getBuiltInFieldLabelMap = useCallback((target) => getSectionFieldLabelMap(sectionKey, target), [sectionKey]);
  const getBuiltInFieldsForTarget = useCallback((target) => getSectionTargetFields(sectionKey, target), [sectionKey]);
  const getBuiltInFormFieldLabel = useCallback((fieldKey, fallbackLabel, type = formType) => {
    const target = getFormTarget(type);
    const configMap = getFieldConfigMap(target);
    return getFieldLabel(
      configMap,
      fieldKey,
      fallbackLabel || getBuiltInFieldLabelMap(target)?.[fieldKey] || fieldKey,
    );
  }, [formType, getBuiltInFieldLabelMap, getFieldConfigMap, getFormTarget]);
  const isBuiltInFormFieldVisible = useCallback((fieldKey, type = formType) => {
    const config = getFieldConfigMap(getFormTarget(type))[fieldKey];
    return config ? config.visible : true;
  }, [formType, getFieldConfigMap, getFormTarget]);
  const activeFormLayout = useMemo(
    () => getSectionFormLayout(sectionKey, getFormTarget(formType)),
    [formType, getFormTarget, sectionKey],
  );

  const buildColumnsForTarget = useCallback((target, configMap, customs = []) => {
    const builtInColumns = getSectionColumns(sectionKey, target)
      .map((col, index) => {
        const isRequiredStatementColumn = target === 'statement' && STATEMENT_CORE_COLUMN_KEYS.includes(col.key);
        return {
          ...col,
          label: getFieldLabel(configMap, col.key, col.label),
          sortOrder: isRequiredStatementColumn ? index + 1 : (configMap[col.key]?.sortOrder ?? index + 1),
          visible: isRequiredStatementColumn ? true : (configMap[col.key]?.visible ?? true),
        };
      })
      .filter((col) => col.visible);

    (customs || []).forEach((field) => {
      if (!matchesFieldTarget(field, sectionKey, target)) return;
      if (configMap[field.fieldKey]?.visible !== true) return;
      if (builtInColumns.find((col) => col.key === field.fieldKey)) return;
      builtInColumns.push({
        key: field.fieldKey,
        dataKey: field.fieldKey,
        label: getFieldLabel(configMap, field.fieldKey, field.label),
        type: field.fieldType === 'formula'
          ? 'formula'
          : field.fieldType === 'money'
            ? 'money_generic'
            : field.fieldType === 'number'
              ? 'number'
              : 'text',
        fieldType: field.fieldType,
        isCustom: true,
        isFormula: field.fieldType === 'formula',
        formula: field.formula,
        sortOrder: configMap[field.fieldKey]?.sortOrder ?? field.sortOrder ?? 999,
      });
    });

    builtInColumns.sort((a, b) => a.sortOrder - b.sortOrder);
    return builtInColumns;
  }, [sectionKey]);

  const getVisibleCustomFieldsForTarget = useCallback((target) => {
    const configMap = getFieldConfigMap(target);
    return customFields
      .filter((field) => {
        if (!matchesFieldTarget(field, sectionKey, target)) return false;
        if (field.fieldType === 'formula') return false;
        if (!isEditableCustomField(field)) return false;
        if ((field.placement || 'transaction') !== 'transaction') return false;
        return configMap[field.fieldKey]?.visible === true;
      })
      .map((field) => ({
        ...field,
        label: getFieldLabel(configMap, field.fieldKey, field.label),
      }))
      .sort((a, b) => (configMap[a.fieldKey]?.sortOrder || 999) - (configMap[b.fieldKey]?.sortOrder || 999));
  }, [customFields, getFieldConfigMap, sectionKey]);
  const getVisibleFormulaFieldsForTarget = useCallback((target) => {
    const configMap = getFieldConfigMap(target);
    return customFields
      .filter((field) => matchesFieldTarget(field, sectionKey, target) && field.fieldType === 'formula' && configMap[field.fieldKey]?.visible === true)
      .map((field) => ({
        ...field,
        label: getFieldLabel(configMap, field.fieldKey, field.label),
      }))
      .sort((a, b) => (configMap[a.fieldKey]?.sortOrder || 999) - (configMap[b.fieldKey]?.sortOrder || 999));
  }, [customFields, getFieldConfigMap, sectionKey]);
  const editableCustomFields = useMemo(
    () => getVisibleCustomFieldsForTarget(getFormTarget(formType)),
    [formType, getFormTarget, getVisibleCustomFieldsForTarget],
  );
  const formulaCustomFields = useMemo(
    () => getVisibleFormulaFieldsForTarget(getFormTarget(formType)),
    [formType, getFormTarget, getVisibleFormulaFieldsForTarget],
  );
  const activeBuiltInFormFields = useMemo(
    () => getBuiltInFieldsForTarget(getFormTarget(formType)),
    [formType, getBuiltInFieldsForTarget, getFormTarget],
  );
  const builtInFormFieldsByKey = useMemo(
    () => Object.fromEntries(activeBuiltInFormFields.map((field) => [field.key, field])),
    [activeBuiltInFormFields],
  );
  const visibleFormSections = useMemo(
    () => activeFormLayout
      .map((section) => ({
        ...section,
        fields: section.keys
          .map((fieldKey) => builtInFormFieldsByKey[fieldKey])
          .filter((field) => field && isBuiltInFormFieldVisible(field.key, formType)),
      }))
      .filter((section) => section.fields.length > 0),
    [activeFormLayout, builtInFormFieldsByKey, formType, isBuiltInFormFieldVisible],
  );
  const listSummaryCards = useMemo(() => {
    const summaryMeta = SECTION_SUMMARY_META[sectionKey]?.list || [];
    return summaryMeta.map((card) => ({
      ...card,
      value: formatSummaryValue(listSummary?.[card.key] || 0, card.format),
    }));
  }, [listSummary, sectionKey]);
  const statementSummaryCards = useMemo(() => {
    const summaryMeta = SECTION_SUMMARY_META[sectionKey]?.statement || [];
    const totals = statement?.totals || EMPTY_SUMMARY;
    return summaryMeta.map((card) => ({
      ...card,
      value: formatSummaryValue(totals?.[card.key] || 0, card.format),
    }));
  }, [sectionKey, statement]);

  // Load field config for this port/section
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

      const customs = customFieldGroups
        .flat()
        .filter((field, index, fields) => fields.findIndex((item) => item.id === field.id) === index);

      setCustomFields(customs || []);
      const listConfigMap = buildFieldConfigMap(listConfigs);
      const statementConfigMap = buildFieldConfigMap(statementConfigs);
      const invoiceConfigMap = buildFieldConfigMap(invoiceConfigs);
      const paymentConfigMap = buildFieldConfigMap(paymentConfigs);
      setViewConfigMaps({
        list: listConfigMap,
        statement: statementConfigMap,
        invoice: invoiceConfigMap,
        payment: paymentConfigMap,
      });
      setViewColumns({
        list: buildColumnsForTarget('list', listConfigMap, customs),
        statement: buildColumnsForTarget('statement', statementConfigMap, customs),
      });
    } catch (e) {
      console.error('Failed to load field config:', e);
      setCustomFields([]);
      setViewColumns({
        list: getSectionColumns(sectionKey, 'list'),
        statement: getSectionColumns(sectionKey, 'statement'),
      });
    }
    setFieldConfigLoaded(true);
  }, [api, buildColumnsForTarget, sectionKey]);

  useEffect(() => { loadFieldConfig(); }, [loadFieldConfig]);
  useEffect(() => { loadData(); }, [portId, page, search, filters.accountId, filters.from, filters.to]);

  useEffect(() => {
    if (view !== 'form' || editableCustomFields.length === 0) return;
    setForm((prev) => ({ ...getInitialCustomFieldValues(editableCustomFields), ...prev }));
  }, [editableCustomFields, view]);

  useEffect(() => {
    if (initialView === 'form' && initialFormType) {
      openForm(initialFormType);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const portParam = portId ? `port=${portId}` : '';
      const acctTypeParam = accountType ? `&accountType=${accountType}` : '';
      const acctPortParam = portId ? `port=${portId}` : '';
      const acctTypeOnlyParam = accountType ? `${acctPortParam ? '&' : ''}accountType=${accountType}` : '';
      const accountFilterParam = filters.accountId ? `&accountId=${filters.accountId}` : '';
      const fromParam = filters.from ? `&startDate=${filters.from}` : '';
      const toParam = filters.to ? `&endDate=${filters.to}` : '';
      const [txRes, accs, gds, govData, companyData] = await Promise.all([
        api(`/transactions?${portParam}${acctTypeParam}${accountFilterParam}${fromParam}${toParam}&search=${search}&limit=${LIMIT}&offset=${page * LIMIT}`),
        api(`/accounts?${acctPortParam}${acctTypeOnlyParam}`),
        api(`/lookups/goods-types?port=${portId || ''}`),
        api('/lookups/governorates'),
        api('/lookups/companies'),
      ]);
      setTransactions(txRes.transactions);
      setTotal(txRes.total);
      setListSummary({ ...EMPTY_SUMMARY, ...(txRes.summary || {}) });
      setAccounts(accs);
      setGoods(gds);
      setGovs(govData);
      setCompanies(companyData);
    } catch (e) {
      console.error(e);
      setListSummary(EMPTY_SUMMARY);
    }
    setLoading(false);
  };

  const loadDriversVehicles = async () => {
    const [d, v] = await Promise.all([api('/lookups/drivers'), api('/lookups/vehicles')]);
    setDrivers(d); setVehicles(v);
  };

  const applySuggestedDefaults = useCallback((defaults) => {
    if (!defaults) return;

    const isEmpty = (value) => value === undefined || value === null || value === '';

    setForm((prev) => {
      const next = { ...prev };
      const fill = (key, value) => {
        if (!isEmpty(value) && isEmpty(next[key])) next[key] = value;
      };

      fill('Currency', defaults.Currency);
      fill('DriverID', defaults.DriverID);
      fill('VehicleID', defaults.VehicleID);
      fill('GoodTypeID', defaults.GoodTypeID);
      fill('GovID', defaults.GovID);
      fill('CompanyID', defaults.CompanyID);
      fill('CompanyName', defaults.CompanyName);
      fill('CarrierID', defaults.CarrierID);
      fill('FeeUSD', defaults.FeeUSD);
      fill('SyrCus', defaults.SyrCus);
      fill('CarQty', defaults.CarQty);
      fill('TransPrice', defaults.TransPrice);

      if (isEmpty(next._driverText) && defaults.DriverName && (!next.DriverID || next.DriverID === defaults.DriverID)) next._driverText = defaults.DriverName;
      if (isEmpty(next._vehicleText) && defaults.VehiclePlate && (!next.VehicleID || next.VehicleID === defaults.VehicleID)) next._vehicleText = defaults.VehiclePlate;
      if (isEmpty(next._goodText) && defaults.GoodTypeName && (!next.GoodTypeID || next.GoodTypeID === defaults.GoodTypeID)) next._goodText = defaults.GoodTypeName;
      if (isEmpty(next._govText) && defaults.GovName && (!next.GovID || next.GovID === defaults.GovID)) next._govText = defaults.GovName;
      if (isEmpty(next._companyText) && defaults.CompanyName && (!next.CompanyID || next.CompanyID === defaults.CompanyID)) next._companyText = defaults.CompanyName;
      if (isEmpty(next._carrierText) && defaults.CarrierName && (!next.CarrierID || next.CarrierID === defaults.CarrierID)) next._carrierText = defaults.CarrierName;

      return next;
    });
  }, []);

  const openForm = (type) => {
    const target = type === 1 ? 'invoice' : 'payment';
    setFormType(type);
    setMsg('');
    setTraderText('');
    setForm({
      ...getInitialCustomFieldValues(getVisibleCustomFieldsForTarget(target)),
      TransDate: new Date().toISOString().split('T')[0],
      TransTypeID: type,
      Currency: 'USD',
      PortID: portId || null,
    });
    loadDriversVehicles();
    setView('form');
  };

  useEffect(() => {
    if (view !== 'form' || !form.AccountID) return;

    let cancelled = false;

    const loadSuggestedDefaults = async () => {
      try {
        const params = new URLSearchParams({
          accountId: String(form.AccountID),
          sectionKey,
          formType: getFormTarget(formType),
        });

        if (form.GovID) params.set('govId', String(form.GovID));

        const defaults = await api(`/defaults/transaction-form?${params.toString()}`);
        if (!cancelled) applySuggestedDefaults(defaults);
      } catch (error) {
        console.error('Failed to load transaction form defaults:', error);
      }
    };

    loadSuggestedDefaults();
    return () => {
      cancelled = true;
    };
  }, [api, applySuggestedDefaults, form.AccountID, form.GovID, formType, getFormTarget, sectionKey, view]);

  const openStatement = async (accountId) => {
    setStAccount(accountId);
    try {
      const params = new URLSearchParams();
      if (portId) params.set('portId', portId);
      if (accountType) params.set('accountType', String(accountType));
      if (filters.from) params.set('startDate', filters.from);
      if (filters.to) params.set('endDate', filters.to);
      const query = params.toString();
      const data = await api(`/reports/account-statement/${accountId}${query ? `?${query}` : ''}`);
      setStatement(data);
      setView('statement');
    } catch (e) { console.error(e); }
  };

  const saveCustomFieldValues = async (transactionId, source, fields = editableCustomFields) => {
    if (!transactionId) return;
    const values = buildCustomFieldValuePayload(fields, source);
    await api(`/custom-field-values/transaction/${transactionId}`, {
      method: 'POST',
      body: JSON.stringify({ values }),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalForm = { ...form };
      if (!finalForm.AccountID && traderText.trim()) {
        const newAcc = await api('/accounts', {
          method: 'POST',
          body: JSON.stringify({
            AccountName: traderText.trim(),
            AccountTypeID: accountType || 1,
            DefaultPortID: portId || null,
          })
        });
        finalForm.AccountID = newAcc.id;
      }
      if (!finalForm.AccountID) {
        setMsg('يرجى ادخال اسم التاجر');
        setSaving(false);
        return;
      }
      if (!finalForm.DriverID && finalForm._newDriverName?.trim()) {
        const r = await api('/lookups/drivers', { method: 'POST', body: JSON.stringify({ DriverName: finalForm._newDriverName.trim() }) });
        finalForm.DriverID = r.id;
      }
      if (!finalForm.VehicleID && finalForm._newPlateNumber?.trim()) {
        const r = await api('/lookups/vehicles', { method: 'POST', body: JSON.stringify({ PlateNumber: finalForm._newPlateNumber.trim() }) });
        finalForm.VehicleID = r.id;
      }
      if (!finalForm.GoodTypeID && finalForm._newGoodType?.trim()) {
        const r = await api('/lookups/goods-types', { method: 'POST', body: JSON.stringify({ TypeName: finalForm._newGoodType.trim() }) });
        finalForm.GoodTypeID = r.id;
      }
      if (!finalForm.CompanyID && finalForm._companyText?.trim()) {
        const r = await api('/lookups/companies', { method: 'POST', body: JSON.stringify({ CompanyName: finalForm._companyText.trim() }) });
        finalForm.CompanyID = r.id;
        finalForm.CompanyName = r.CompanyName;
      }
      delete finalForm._driverText; delete finalForm._vehicleText; delete finalForm._goodText; delete finalForm._govText;
      delete finalForm._carrierText; delete finalForm._companyText;
      delete finalForm._newDriverName; delete finalForm._newPlateNumber; delete finalForm._newGoodType;

      const result = await api('/transactions', { method: 'POST', body: JSON.stringify(finalForm) });
      await saveCustomFieldValues(result.id, finalForm, editableCustomFields);
      alert(`تم الحفظ بنجاح - ${result.refNo}`);
      if (onBack) onBack();
      else { setView('list'); loadData(); }
    } catch (e) {
      setMsg(e.message);
    }
    setSaving(false);
  };

  const handleUpdate = async (formData) => {
    const data = formData || editForm;
    try {
      await api(`/transactions/${data.TransID}`, { method: 'PUT', body: JSON.stringify(data) });
      const updateTarget = data.TransTypeID === 1 ? 'invoice' : 'payment';
      await saveCustomFieldValues(data.TransID, data, getVisibleCustomFieldsForTarget(updateTarget));
      alert('تم التحديث بنجاح');
      setSelectedTx(null);
      loadData();
    } catch (e) { setMsg(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
    try {
      await api(`/transactions/${id}`, { method: 'DELETE' });
      alert('تم الحذف');
      setSelectedTx(null);
      loadData();
    } catch (e) { setMsg(e.message); }
  };

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const setNumericField = (fieldKey, rawValue, parser = parseFloat) => {
    if (rawValue === '') {
      setField(fieldKey, '');
      return;
    }
    const parsed = parser(rawValue);
    setField(fieldKey, Number.isNaN(parsed) ? '' : parsed);
  };

  const renderBuiltInField = (field, type = formType) => {
    const label = getBuiltInFormFieldLabel(field.key, field.label, type);

    switch (field.key) {
      case 'ref_no':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <input
              type="text"
              value={form.RefNo || ''}
              placeholder={type === 1 ? 'سيولد رقم الفاتورة تلقائياً' : 'سيولد رقم السند تلقائياً'}
              className="input-field bg-gray-50 text-gray-400"
              disabled
            />
          </div>
        );
      case 'trans_date':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label} *</label>
            <input type="date" value={form.TransDate || ''} onChange={(e) => setField('TransDate', e.target.value)} className="input-field" />
          </div>
        );
      case 'account_name':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label} *</label>
            <AutocompleteInput
              value={traderText}
              options={accounts}
              labelKey="AccountName"
              valueKey="AccountID"
              addNewLabel="إضافة تاجر جديد"
              onChange={(text) => { setTraderText(text); setField('AccountID', null); }}
              onSelect={(acc) => { setTraderText(acc.AccountName); setField('AccountID', acc.AccountID); }}
              onAddNew={async (name) => {
                try {
                  const newAcc = await api('/accounts', {
                    method: 'POST',
                    body: JSON.stringify({
                      AccountName: name,
                      AccountTypeID: accountType || 1,
                      DefaultPortID: portId || null,
                    }),
                  });
                  if (newAcc.existing) {
                    setTraderText(name);
                    setField('AccountID', newAcc.id);
                    setMsg('التاجر موجود مسبقاً، تم اختياره: ' + name);
                  } else {
                    const newAccount = { AccountID: newAcc.id, AccountName: name };
                    setAccounts((prev) => [...prev, newAccount]);
                    setTraderText(name);
                    setField('AccountID', newAcc.id);
                    setMsg('تم إضافة التاجر بنجاح: ' + name);
                  }
                } catch (e) {
                  console.error(e);
                  setMsg('حدث خطأ أثناء إضافة التاجر');
                }
              }}
              placeholder="اكتب اسم التاجر..."
              className="input-field"
            />
          </div>
        );
      case 'currency':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <select value={form.Currency || 'USD'} onChange={(e) => setField('Currency', e.target.value)} className="input-field">
              <option value="USD">دولار</option>
              <option value="IQD">دينار</option>
              <option value="BOTH">دولار ودينار</option>
            </select>
          </div>
        );
      case 'driver_name':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <AutocompleteInput
              value={form._driverText || ''}
              options={drivers.map((driver) => ({ AccountID: driver.DriverID, AccountName: driver.DriverName }))}
              labelKey="AccountName"
              valueKey="AccountID"
              onChange={(text) => { setField('_driverText', text); setField('DriverID', null); setField('_newDriverName', text); }}
              onSelect={(driver) => { setField('_driverText', driver.AccountName); setField('DriverID', driver.AccountID); setField('_newDriverName', ''); }}
              placeholder="اكتب اسم السائق..."
              className="input-field"
            />
          </div>
        );
      case 'vehicle_plate':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <AutocompleteInput
              value={form._vehicleText || ''}
              options={vehicles.map((vehicle) => ({ AccountID: vehicle.VehicleID, AccountName: vehicle.PlateNumber }))}
              labelKey="AccountName"
              valueKey="AccountID"
              onChange={(text) => { setField('_vehicleText', text); setField('VehicleID', null); setField('_newPlateNumber', text); }}
              onSelect={(vehicle) => { setField('_vehicleText', vehicle.AccountName); setField('VehicleID', vehicle.AccountID); setField('_newPlateNumber', ''); }}
              placeholder="اكتب رقم السيارة..."
              className="input-field"
            />
          </div>
        );
      case 'good_type':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <AutocompleteInput
              value={form._goodText || ''}
              options={goods.map((good) => ({ AccountID: good.GoodTypeID, AccountName: good.TypeName }))}
              labelKey="AccountName"
              valueKey="AccountID"
              onChange={(text) => { setField('_goodText', text); setField('GoodTypeID', null); setField('_newGoodType', text); }}
              onSelect={(good) => { setField('_goodText', good.AccountName); setField('GoodTypeID', good.AccountID); setField('_newGoodType', ''); }}
              placeholder="اكتب نوع البضاعة..."
              className="input-field"
            />
          </div>
        );
      case 'carrier_name':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <AutocompleteInput
              value={form._carrierText || ''}
              options={accounts}
              labelKey="AccountName"
              valueKey="AccountID"
              onChange={(text) => { setField('_carrierText', text); setField('CarrierID', null); }}
              onSelect={(acc) => { setField('_carrierText', acc.AccountName); setField('CarrierID', acc.AccountID); }}
              placeholder="اكتب اسم الناقل..."
              className="input-field"
            />
          </div>
        );
      case 'gov_name':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <AutocompleteInput
              value={form._govText || ''}
              options={govs.map((gov) => ({ AccountID: gov.GovID, AccountName: gov.GovName }))}
              labelKey="AccountName"
              valueKey="AccountID"
              onChange={(text) => { setField('_govText', text); setField('GovID', null); }}
              onSelect={(gov) => { setField('_govText', gov.AccountName); setField('GovID', gov.AccountID); }}
              placeholder="اكتب الجهة الحكومية أو المحافظة..."
              className="input-field"
            />
          </div>
        );
      case 'weight':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <input type="number" value={form.Weight || ''} onChange={(e) => setNumericField('Weight', e.target.value)} className="input-field" />
          </div>
        );
      case 'meters':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <input type="number" value={form.Meters || ''} onChange={(e) => setNumericField('Meters', e.target.value)} className="input-field" />
          </div>
        );
      case 'qty':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <input type="number" value={form.Qty || ''} onChange={(e) => setNumericField('Qty', e.target.value, parseInt)} className="input-field" />
          </div>
        );
      case 'cost_usd':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <input type="number" step="0.01" value={form.CostUSD || ''} onChange={(e) => setNumericField('CostUSD', e.target.value)} className="input-field" />
          </div>
        );
      case 'cost_iqd':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <input type="number" step="0.01" value={form.CostIQD || ''} onChange={(e) => setNumericField('CostIQD', e.target.value)} className="input-field" />
          </div>
        );
      case 'amount_usd':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label} *</label>
            <input type="number" step="0.01" value={form.AmountUSD || ''} onChange={(e) => setNumericField('AmountUSD', e.target.value)} className="input-field text-xl font-bold" />
          </div>
        );
      case 'amount_iqd':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <input type="number" step="0.01" value={form.AmountIQD || ''} onChange={(e) => setNumericField('AmountIQD', e.target.value)} className="input-field text-xl font-bold" />
          </div>
        );
      case 'fee_usd':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <input type="number" step="0.01" value={form.FeeUSD || ''} onChange={(e) => setNumericField('FeeUSD', e.target.value)} className="input-field" />
          </div>
        );
      case 'syr_cus':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <input type="number" step="0.01" value={form.SyrCus || ''} onChange={(e) => setNumericField('SyrCus', e.target.value)} className="input-field" />
          </div>
        );
      case 'car_qty':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <input type="number" value={form.CarQty || ''} onChange={(e) => setNumericField('CarQty', e.target.value, parseInt)} className="input-field" />
          </div>
        );
      case 'trans_price':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <input type="number" step="0.01" value={form.TransPrice || ''} onChange={(e) => setNumericField('TransPrice', e.target.value)} className="input-field" />
          </div>
        );
      case 'company_name':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <AutocompleteInput
              value={form._companyText || form.CompanyName || ''}
              options={companies}
              labelKey="CompanyName"
              valueKey="CompanyID"
              addNewLabel="إضافة شركة جديدة"
              onChange={(text) => {
                setField('_companyText', text);
                setField('CompanyID', null);
                setField('CompanyName', text);
              }}
              onSelect={(company) => {
                setField('_companyText', company.CompanyName);
                setField('CompanyID', company.CompanyID);
                setField('CompanyName', company.CompanyName);
              }}
              onAddNew={async (name) => {
                try {
                  const newCompany = await api('/lookups/companies', {
                    method: 'POST',
                    body: JSON.stringify({ CompanyName: name }),
                  });
                  const companyRow = { CompanyID: newCompany.id, CompanyName: newCompany.CompanyName };
                  setCompanies((prev) => prev.some((item) => item.CompanyID === companyRow.CompanyID) ? prev : [...prev, companyRow]);
                  setField('_companyText', companyRow.CompanyName);
                  setField('CompanyID', companyRow.CompanyID);
                  setField('CompanyName', companyRow.CompanyName);
                } catch (error) {
                  console.error(error);
                  setMsg('حدث خطأ أثناء إضافة الشركة');
                }
              }}
              placeholder="اكتب اسم الشركة..."
              className="input-field"
            />
          </div>
        );
      case 'trader_note':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <textarea value={form.TraderNote || ''} onChange={(e) => setField('TraderNote', e.target.value)} className="input-field min-h-[112px] resize-y" rows="4" />
          </div>
        );
      case 'notes':
        return (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <textarea value={form.Notes || ''} onChange={(e) => setField('Notes', e.target.value)} className="input-field min-h-[112px] resize-y" rows="4" />
          </div>
        );
      default:
        return null;
    }
  };

  const renderCustomFieldInput = (field, values, onChange) => {
    const value = values?.[field.fieldKey] ?? '';

    if (field.fieldType === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => onChange(field.fieldKey, e.target.value)}
          className="input-field"
        >
          <option value="">اختر...</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    const isNumericField = field.fieldType === 'number' || field.fieldType === 'money';
    return (
      <input
        type={isNumericField ? 'number' : 'text'}
        step={field.fieldType === 'money' ? '0.01' : 'any'}
        value={value}
        onChange={(e) => onChange(field.fieldKey, sanitizeCustomFieldValue(field, e.target.value))}
        className="input-field"
      />
    );
  };

  const renderFormulaFieldCard = (field, values) => {
    const result = evaluateCustomFormula(field.formula, values);
    return (
      <div key={field.fieldKey} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <span className="mb-1 block text-xs font-semibold text-slate-500">{field.label}</span>
        <p className={`text-lg font-bold ${result === null ? 'text-slate-400' : result < 0 ? 'text-red-600' : 'text-green-700'}`}>
          {result === null ? '-' : formatNum(Math.round(result * 100) / 100)}
        </p>
      </div>
    );
  };

  const getTransactionCustomFields = useCallback((transaction) => {
    if (!transaction) return [];
    return transaction.TransTypeID === 1
      ? [...getVisibleCustomFieldsForTarget('invoice'), ...getVisibleFormulaFieldsForTarget('invoice')]
      : [...getVisibleCustomFieldsForTarget('payment'), ...getVisibleFormulaFieldsForTarget('payment')];
  }, [getVisibleCustomFieldsForTarget, getVisibleFormulaFieldsForTarget]);

  // ===== STATEMENT SELECT VIEW =====
  if (showStatementSelect || (view === 'list' && initialView === 'statement-select')) return (
    <div className="page-shell">
      <PageHeader title={`كشف حساب - ${portName}`} subtitle={portName} onBack={onBack} onHome={onHome} />
      <div className="p-5">
        <div className="mb-4">
          <div className="relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pr-10" placeholder="بحث عن تاجر..." />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {accounts.filter(a => !search || a.AccountName.includes(search)).map(a => (
            <button key={a.AccountID} onClick={() => { setShowStatementSelect(false); openStatement(a.AccountID); }}
              className="section-btn-sm">
              {a.AccountName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ===== LIST VIEW =====
  if (view === 'list') return (
    <div className="page-shell">
      <PageHeader title={`${portName} - قائمة الحركات`} subtitle={`${total} معاملة`} onBack={onBack} onHome={onHome}>
        {can.addInvoice && (
          <button onClick={() => openForm(1)} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all text-sm font-medium">
            <Plus size={16} /> فاتورة
          </button>
        )}
        {can.addPayment && (
          <button onClick={() => openForm(2)} className="flex items-center gap-1.5 bg-emerald-500/80 hover:bg-emerald-500 px-3 py-2 rounded-lg transition-all text-sm font-medium">
            <CreditCard size={16} /> تسديد
          </button>
        )}
      </PageHeader>

      <div className="p-5 space-y-4">
        {msg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">{msg}</div>}

        <div className="relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="input-field pr-10" placeholder="بحث بالمرجع، الملاحظات، اسم التاجر..." />
        </div>

        <div className="surface-card grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">اسم التاجر</label>
            <select
              value={filters.accountId}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, accountId: e.target.value }));
                setPage(0);
              }}
              className="input-field"
            >
              <option value="">كل التجار</option>
              {accounts.map((account) => (
                <option key={account.AccountID} value={account.AccountID}>{account.AccountName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">من تاريخ</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, from: e.target.value }));
                setPage(0);
              }}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">إلى تاريخ</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, to: e.target.value }));
                setPage(0);
              }}
              className="input-field"
            />
          </div>
          <div className="flex flex-col justify-end gap-2 sm:flex-row xl:flex-col">
            <button
              onClick={() => setFilters({ accountId: '', from: '', to: '' })}
              className="btn-outline w-full"
            >
              إعادة تعيين
            </button>
            <button
              onClick={() => filters.accountId && openStatement(filters.accountId)}
              disabled={!filters.accountId}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              كشف الحساب
            </button>
          </div>
        </div>

        {listSummaryCards.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {listSummaryCards.map((card) => (
              <div key={`${card.key}-${card.label}`} className="stat-card-modern text-center">
                <span className="text-xs text-gray-500">{card.label}</span>
                <p className={`mt-1 text-2xl font-bold ${card.accent || 'text-primary-900'}`}>{card.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="surface-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                  {viewColumns.list.map(col => (
                    <th key={col.key} className="px-3 py-3 whitespace-nowrap">{col.label}</th>
                  ))}
                  <th className="px-3 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.TransID} onClick={() => setSelectedTx(t)} className="border-b border-gray-50 hover:bg-primary-50/50 cursor-pointer transition-colors group">
                    {viewColumns.list.map(col => (
                      <td key={col.key} className="px-3 py-2">{renderCell(col, t)}</td>
                    ))}
                    <td className="px-3 py-2">
                      <Eye size={14} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
            <p className="text-sm text-gray-500">عرض {page * LIMIT + 1} - {Math.min((page + 1) * LIMIT, total)} من {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-outline text-sm px-3 py-1.5 disabled:opacity-50">
                <ChevronRight size={16} />
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= total} className="btn-outline text-sm px-3 py-1.5 disabled:opacity-50">
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <TransactionModal
        transaction={selectedTx}
        accounts={accounts}
        customFields={getTransactionCustomFields(selectedTx)}
        onClose={() => setSelectedTx(null)}
        onUpdate={can.editTransaction ? async (form) => { await handleUpdate(form); setSelectedTx(null); } : null}
        onDelete={can.deleteTransaction ? (id) => { handleDelete(id); setSelectedTx(null); } : null}
      />
    </div>
  );

  // ===== FORM VIEW =====
  if (view === 'form') return (
    <div className="page-shell">
      <PageHeader
        title={`${formType === 1 ? 'فاتورة' : 'تسديد'} - ${portName}`}
        onBack={() => onBack ? onBack() : setView('list')}
        onHome={onHome}
      />

      <div className="mx-auto max-w-5xl p-5 md:p-6">
        {msg && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{msg}</div>}

        <div className="surface-card overflow-visible p-4 md:p-5 lg:p-6">
          <div className="mb-5 rounded-[1.25rem] border border-primary-100/80 bg-gradient-to-r from-primary-50 via-white to-slate-50 px-4 py-4 md:px-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-primary-900">
                  {formType === 1 ? 'تسجيل فاتورة جديدة' : 'تسجيل تسديد جديد'}
                </h2>
              </div>
              <div className={`inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-bold ${formType === 1 ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}> 
                {formType === 1 ? 'فاتورة' : 'تسديد'}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {visibleFormSections.map((section) => {
              const gridClass = section.fields.length <= 2
                ? 'grid-cols-1 md:grid-cols-2'
                : section.fields.length === 3
                  ? 'grid-cols-1 md:grid-cols-3'
                  : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4';

              return (
                <FormSection key={section.title} title={section.title} subtitle={section.subtitle}>
                  <div className={`grid gap-4 ${gridClass}`}>
                    {section.fields.map((field) => renderBuiltInField(field, formType))}
                  </div>
                </FormSection>
              );
            })}

            {(editableCustomFields.length > 0 || formulaCustomFields.length > 0) && (
              <FormSection title="حقول إضافية" subtitle="حقول مخصصة لهذا القسم">
                {editableCustomFields.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {editableCustomFields.map((field) => (
                      <div key={field.fieldKey}>
                        <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
                        {renderCustomFieldInput(field, form, setField)}
                      </div>
                    ))}
                  </div>
                )}

                {formulaCustomFields.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {formulaCustomFields.map((field) => renderFormulaFieldCard(field, form))}
                  </div>
                )}
              </FormSection>
            )}

            <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/85 p-4 md:p-5">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button onClick={() => onBack ? onBack() : setView('list')} className="btn-outline w-full sm:w-auto">إلغاء</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 px-8 text-lg sm:w-auto">
                  <Save size={20} /> {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ===== STATEMENT VIEW (Dynamic Columns) =====
  if (view === 'statement' && statement) {
    const cols = viewColumns.statement;
    const exportColumns = cols.map(c => ({
      key: c.dataKey,
      label: c.label,
      format: c.type === 'money_iqd'
        ? 'money_iqd'
        : c.type === 'money_generic'
          ? 'number'
          : c.type.includes('money')
            ? 'money'
            : c.type === 'number'
              ? 'number'
              : c.type === 'date'
                ? 'date'
                : undefined,
    }));

    return (
      <div className="page-shell">
        <PageHeader
          title={`كشف حساب - ${statement.account.AccountName}`}
          subtitle={portName}
          onBack={() => onBack ? onBack() : setView('list')}
          onHome={onHome}
        >
          <ExportButtons inHeader
            rows={statement.statement}
            columns={exportColumns}
            title={`كشف حساب - ${statement.account.AccountName}`}
            subtitle={portName}
            filename={`كشف_حساب_${statement.account.AccountName}`}
            summaryCards={statementSummaryCards.map((card) => ({ label: card.label, value: card.value }))}
            totalsRow={{ AmountUSD: statement.totals?.balanceUSD, AmountIQD: statement.totals?.balanceIQD }}
          />
        </PageHeader>

        <div className="p-5">
          {statementSummaryCards.length > 0 && (
            <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {statementSummaryCards.map((card) => (
                <div key={`${card.key}-${card.label}`} className="stat-card-modern text-center">
                  <span className="text-xs text-gray-500">{card.label}</span>
                  <p className={`mt-1 text-2xl font-bold ${card.accent || 'text-primary-900'}`}>{card.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Dynamic Statement Table */}
          <div className="surface-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                    {cols.map(col => (
                      <th key={col.key} className="px-2 py-3 whitespace-nowrap">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(statement.statement || []).map((t, i) => (
                    <tr key={i} onClick={() => setSelectedTx(t)} className={`border-b border-gray-50 hover:bg-primary-50/50 cursor-pointer transition-colors ${t.TransTypeID === 2 ? 'bg-orange-50/50' : ''}`}>
                      {cols.map(col => (
                        <td key={col.key} className="px-2 py-2">{renderCell(col, t)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    {cols.map((col, idx) => {
                      if (idx === 0) return <td key={col.key} className="px-2 py-3">المجموع</td>;
                      if (col.key === 'amount_usd') return <td key={col.key} className="px-2 py-3">${formatNum(statement.totals?.balanceUSD || 0)}</td>;
                      if (col.key === 'amount_iqd') return <td key={col.key} className="px-2 py-3">{formatNum(statement.totals?.balanceIQD || 0)}</td>;
                      if (col.key === 'cost_usd') return <td key={col.key} className="px-2 py-3">${formatNum(statement.totals?.totalCostUSD || 0)}</td>;
                      if (col.key === 'cost_iqd') return <td key={col.key} className="px-2 py-3">{formatNum(statement.totals?.totalCostIQD || 0)}</td>;
                      if (col.key === 'fee_usd') return <td key={col.key} className="px-2 py-3">${formatNum(statement.totals?.totalFeeUSD || 0)}</td>;
                      if (col.key === 'profit_usd') return <td key={col.key} className={`px-2 py-3 ${(statement.totals?.totalProfitUSD || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>${formatNum(statement.totals?.totalProfitUSD || 0)}</td>;
                      if (col.key === 'profit_iqd') return <td key={col.key} className={`px-2 py-3 ${(statement.totals?.totalProfitIQD || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatNum(statement.totals?.totalProfitIQD || 0)}</td>;
                      return <td key={col.key} className="px-2 py-3"></td>;
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <TransactionModal
            transaction={selectedTx}
            accounts={accounts}
            customFields={getTransactionCustomFields(selectedTx)}
            onClose={() => setSelectedTx(null)}
            onUpdate={can.editTransaction ? async (form) => { await handleUpdate(form); setSelectedTx(null); } : null}
            onDelete={can.deleteTransaction ? (id) => { handleDelete(id); setSelectedTx(null); } : null}
          />
        </div>
      </div>
    );
  }

  return null;
}

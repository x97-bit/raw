import { isEditableCustomField } from '../../utils/customFields';
import { matchesFieldTarget } from '../../utils/fieldConfigTargets';
import { getFieldLabel } from '../../utils/fieldConfigMetadata';
import { getSectionColumns, STATEMENT_CORE_COLUMN_KEYS } from '../../utils/sectionScreenSpecs';

export const PORT_PAGE_LIMIT = 30;
export const TRANSPORT_TRADER_GROUPS = [
  {
    canonical: 'ابراهيم سعد',
    aliases: ['ابراهيم سعد', 'إبراهيم سعد', 'ابراهيم سعد رمضان', 'إبراهيم سعد رمضان'],
  },
  {
    canonical: 'عبدالعزيز',
    aliases: ['عبدالعزيز', 'عبد العزيز', 'عبدالعزيز احمد', 'عبد العزيز احمد'],
  },
  {
    canonical: 'صباح اسماعيل',
    aliases: ['صباح اسماعيل', 'صباح إسماعيل'],
  },
];

export const normalizePortTraderName = (value = '') => String(value)
  .trim()
  .replace(/[إأآ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/\s+/g, ' ');

export const CANONICAL_TRANSPORT_TRADER_NAMES = TRANSPORT_TRADER_GROUPS.map((group) => group.canonical);

export const isTransportSectionScope = ({ sectionKey, portId, accountType } = {}) => (
  resolvePortSectionKey(portId, accountType) === 'transport-1' || sectionKey === 'transport-1'
);

export const getPortViewLabels = ({ sectionKey, formType = 1 } = {}) => {
  const isTransport = sectionKey === 'transport-1';
  const isInvoice = formType === 1;

  if (!isTransport) {
    return {
      invoiceLabel: 'فاتورة',
      paymentLabel: 'سند قبض',
      invoiceIntro: 'تسجيل فاتورة جديدة',
      paymentIntro: 'تسجيل سند قبض جديد',
      invoiceHint: 'أدخل تفاصيل الفاتورة بنفس الثيم الموحد للنظام.',
      paymentHint: 'أدخل بيانات سند القبض بشكل واضح ومتناسق.',
      statementTitlePrefix: 'كشف حساب',
      statementButtonLabel: 'كشف الحساب',
      statementOpenLabel: 'عرض كشف الحساب',
      statementRefreshLabel: 'تحديث كشف الحساب',
      statementBalanceLabel: 'المجموع',
      listTitleSuffix: 'قائمة الحركات',
      activeFormLabel: isInvoice ? 'فاتورة' : 'سند قبض',
    };
  }

  return {
    invoiceLabel: 'استحقاق نقل',
    paymentLabel: 'دفعة نقل',
    invoiceIntro: 'تسجيل استحقاق نقل جديد',
    paymentIntro: 'تسجيل دفعة نقل جديدة',
    invoiceHint: 'أدخل تفاصيل الاستحقاق الذي يترتب لصالح الناقل.',
    paymentHint: 'أدخل تفاصيل الدفعة المسددة للناقل بشكل واضح ومتناسق.',
    statementTitlePrefix: 'كشف ذمة النقل',
    statementButtonLabel: 'كشف ذمة النقل',
    statementOpenLabel: 'عرض كشف ذمة النقل',
    statementRefreshLabel: 'تحديث كشف ذمة النقل',
    statementBalanceLabel: 'المتبقي علينا',
    listTitleSuffix: 'ذمم النقل',
    activeFormLabel: isInvoice ? 'استحقاق نقل' : 'دفعة نقل',
  };
};

export const relabelPortColumnsForSection = (columns = [], sectionKey) => {
  if (sectionKey !== 'transport-1') {
    return columns;
  }

  return (columns || []).map((column) => {
    const key = String(column?.key || '').toLowerCase();
    if (key !== 'ref_no') {
      return column;
    }

    return {
      ...column,
      label: 'رقم المستند',
    };
  });
};

export const getPortBuiltInFieldLabel = (sectionKey, fieldKey, formType, fallbackLabel) => {
  if (sectionKey !== 'transport-1' || fieldKey !== 'ref_no') {
    return fallbackLabel;
  }

  return formType === 2 ? 'رقم سند الصرف' : 'رقم استحقاق النقل';
};

export const isAllowedTransportTraderName = (name) => {
  const normalizedName = normalizePortTraderName(name);
  return TRANSPORT_TRADER_GROUPS.some((group) => group.aliases.some((alias) => normalizePortTraderName(alias) === normalizedName));
};

export const getCanonicalTransportTraderName = (name) => {
  const normalizedName = normalizePortTraderName(name);
  const match = TRANSPORT_TRADER_GROUPS.find((group) => group.aliases.some((alias) => normalizePortTraderName(alias) === normalizedName));
  return match?.canonical || String(name || '').trim();
};

export const getTransportTraderOrderIndex = (name) => {
  const canonicalName = getCanonicalTransportTraderName(name);
  return CANONICAL_TRANSPORT_TRADER_NAMES
    .map(normalizePortTraderName)
    .indexOf(normalizePortTraderName(canonicalName));
};

export const filterScopedPortAccounts = (accounts = [], scope = {}) => {
  if (!isTransportSectionScope(scope)) {
    return accounts;
  }

  return (accounts || [])
    .filter((account) => isAllowedTransportTraderName(account?.AccountName || account?.name))
    .map((account) => {
      const canonicalName = getCanonicalTransportTraderName(account?.AccountName || account?.name);
      return {
        ...account,
        AccountName: canonicalName,
        name: canonicalName,
      };
    })
    .sort((left, right) => {
      const leftIndex = getTransportTraderOrderIndex(left?.AccountName || left?.name);
      const rightIndex = getTransportTraderOrderIndex(right?.AccountName || right?.name);
      const normalizedLeftIndex = leftIndex >= 0 ? leftIndex : Number.MAX_SAFE_INTEGER;
      const normalizedRightIndex = rightIndex >= 0 ? rightIndex : Number.MAX_SAFE_INTEGER;
      return normalizedLeftIndex - normalizedRightIndex;
    })
    .filter((account, index, list) => {
      const currentName = normalizePortTraderName(account?.AccountName || account?.name);
      return list.findIndex((item) => normalizePortTraderName(item?.AccountName || item?.name) === currentName) === index;
    });
};

function shouldUseTransportAccountTypeOnly({ portId, accountType }) {
  return resolvePortSectionKey(portId, accountType) === 'transport-1';
}

export const buildPortAccountsQuery = ({ portId, accountType }) => {
  const params = new URLSearchParams();
  if (shouldUseTransportAccountTypeOnly({ portId, accountType })) {
    appendQueryValue(params, 'accountType', accountType);
    return params.toString();
  }

  appendQueryValue(params, 'port', portId);
  appendQueryValue(params, 'accountType', accountType);
  return params.toString();
};

export const formatPortNumber = (value) => (
  value ? Number(value).toLocaleString('en-US') : '0'
);

export const getPortFormTarget = (type = 1) => (type === 1 ? 'invoice' : 'payment');

export const createPortFilters = (accountId = '') => ({
  accountId: accountId ? String(accountId) : '',
  from: '',
  to: '',
});

export const resolvePortSectionKey = (portId, accountType) => {
  if (typeof portId === 'string' && portId.includes('-')) return portId;
  if (portId === 1 || portId === '1') return 'port-1';
  if (portId === 2 || portId === '2') return 'port-2';
  if (portId === 3 || portId === '3') return 'port-3';

  if (portId === 'null' || portId === null || portId === undefined || portId === '') {
    if (accountType === 2 || accountType === '2') return 'transport-1';
    if (accountType === 5 || accountType === '5') return 'partnership-1';
    if (accountType === 3 || accountType === '3') return 'fx-1';
  }

  return 'port-1';
};

function appendQueryValue(params, key, value, fallback = null) {
  const normalizedValue = value ?? fallback;
  if (normalizedValue === undefined || normalizedValue === null || normalizedValue === '') return;
  params.set(key, String(normalizedValue));
}

function appendPayloadValue(payload, key, value) {
  if (value !== undefined && value !== null && value !== '') {
    payload[key] = value;
  }
}

function canFillBuiltInField(visibleBuiltInFieldKeys, fieldKey) {
  if (!visibleBuiltInFieldKeys) return false;
  if (visibleBuiltInFieldKeys instanceof Set) return visibleBuiltInFieldKeys.has(fieldKey);
  return Array.isArray(visibleBuiltInFieldKeys) ? visibleBuiltInFieldKeys.includes(fieldKey) : false;
}

function isEmptyValue(value) {
  return value === undefined || value === null || value === '';
}

export const buildPortTransactionsQuery = ({
  portId,
  accountType,
  filters = createPortFilters(),
  search = '',
  limit = PORT_PAGE_LIMIT,
  page = 0,
}) => {
  const params = new URLSearchParams();
  appendQueryValue(params, 'port', portId);
  appendQueryValue(params, 'accountType', accountType);
  appendQueryValue(params, 'accountId', filters.accountId);
  appendQueryValue(params, 'startDate', filters.from);
  appendQueryValue(params, 'endDate', filters.to);
  params.set('search', search || '');
  params.set('limit', String(limit));
  params.set('offset', String(page * limit));
  return params.toString();
};

export const buildPortStatementQuery = ({ portId, accountType, from, to }) => {
  const params = new URLSearchParams();
  appendQueryValue(params, 'portId', portId);
  appendQueryValue(params, 'accountType', accountType);
  appendQueryValue(params, 'startDate', from);
  appendQueryValue(params, 'endDate', to);
  return params.toString();
};

export const dedupePortCustomFieldsById = (fieldGroups = []) => (
  (fieldGroups || [])
    .flat()
    .filter((field, index, fields) => fields.findIndex((item) => item.id === field.id) === index)
);

export const buildPortColumnsForTarget = ({
  sectionKey,
  target,
  configMap = {},
  customFields = [],
}) => {
  const builtInColumns = getSectionColumns(sectionKey, target)
    .map((column, index) => {
      const isRequiredStatementColumn = target === 'statement' && STATEMENT_CORE_COLUMN_KEYS.includes(column.key);
      return {
        ...column,
        label: getFieldLabel(configMap, column.key, column.label),
        sortOrder: configMap[column.key]?.sortOrder ?? index + 1,
        visible: isRequiredStatementColumn ? true : (configMap[column.key]?.visible ?? column.defaultVisible ?? true),
      };
    })
    .filter((column) => column.visible);

  (customFields || []).forEach((field) => {
    if (!matchesFieldTarget(field, sectionKey, target)) return;
    if (configMap[field.fieldKey]?.visible !== true) return;
    if (builtInColumns.find((column) => column.key === field.fieldKey)) return;
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

  builtInColumns.sort((left, right) => left.sortOrder - right.sortOrder);
  return builtInColumns;
};

export const getVisiblePortCustomFieldsForTarget = ({
  customFields = [],
  configMap = {},
  sectionKey,
  target,
}) => (
  (customFields || [])
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
    .sort((left, right) => (configMap[left.fieldKey]?.sortOrder || 999) - (configMap[right.fieldKey]?.sortOrder || 999))
);

export const getVisiblePortFormulaFieldsForTarget = ({
  customFields = [],
  configMap = {},
  sectionKey,
  target,
}) => (
  (customFields || [])
    .filter((field) => matchesFieldTarget(field, sectionKey, target) && field.fieldType === 'formula' && configMap[field.fieldKey]?.visible === true)
    .map((field) => ({
      ...field,
      label: getFieldLabel(configMap, field.fieldKey, field.label),
    }))
    .sort((left, right) => (configMap[left.fieldKey]?.sortOrder || 999) - (configMap[right.fieldKey]?.sortOrder || 999))
);

export const buildInitialPortForm = ({
  formType,
  portId,
  customFieldValues = {},
  today = new Date(),
}) => ({
  ...customFieldValues,
  TransDate: today.toISOString().split('T')[0],
  TransTypeID: formType,
  Currency: 'USD',
  PortID: portId || null,
});

export const applySuggestedDefaultsToForm = ({
  currentForm = {},
  defaults,
  visibleBuiltInFieldKeys,
}) => {
  if (!defaults) return { ...currentForm };

  const next = { ...currentForm };
  const fill = (key, value) => {
    if (!isEmptyValue(value) && isEmptyValue(next[key])) {
      next[key] = value;
    }
  };

  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'currency')) fill('Currency', defaults.Currency);
  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'driver_name')) fill('DriverID', defaults.DriverID);
  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'vehicle_plate')) fill('VehicleID', defaults.VehicleID);
  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'good_type')) fill('GoodTypeID', defaults.GoodTypeID);
  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'gov_name')) fill('GovID', defaults.GovID);
  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'company_name')) {
    fill('CompanyID', defaults.CompanyID);
    fill('CompanyName', defaults.CompanyName);
  }
  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'carrier_name')) fill('CarrierID', defaults.CarrierID);
  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'cost_usd')) fill('CostUSD', defaults.CostUSD);
  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'amount_usd')) fill('AmountUSD', defaults.AmountUSD);
  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'cost_iqd')) fill('CostIQD', defaults.CostIQD);
  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'amount_iqd')) fill('AmountIQD', defaults.AmountIQD);
  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'fee_usd')) fill('FeeUSD', defaults.FeeUSD);
  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'syr_cus')) fill('SyrCus', defaults.SyrCus);
  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'car_qty')) fill('CarQty', defaults.CarQty);
  if (canFillBuiltInField(visibleBuiltInFieldKeys, 'trans_price')) fill('TransPrice', defaults.TransPrice);

  if (
    canFillBuiltInField(visibleBuiltInFieldKeys, 'driver_name')
    && isEmptyValue(next._driverText)
    && defaults.DriverName
    && (!next.DriverID || next.DriverID === defaults.DriverID)
  ) {
    next._driverText = defaults.DriverName;
  }

  if (
    canFillBuiltInField(visibleBuiltInFieldKeys, 'vehicle_plate')
    && isEmptyValue(next._vehicleText)
    && defaults.VehiclePlate
    && (!next.VehicleID || next.VehicleID === defaults.VehicleID)
  ) {
    next._vehicleText = defaults.VehiclePlate;
  }

  if (
    canFillBuiltInField(visibleBuiltInFieldKeys, 'good_type')
    && isEmptyValue(next._goodText)
    && defaults.GoodTypeName
    && (!next.GoodTypeID || next.GoodTypeID === defaults.GoodTypeID)
  ) {
    next._goodText = defaults.GoodTypeName;
  }

  if (
    canFillBuiltInField(visibleBuiltInFieldKeys, 'gov_name')
    && isEmptyValue(next._govText)
    && defaults.GovName
    && (!next.GovID || next.GovID === defaults.GovID)
  ) {
    next._govText = defaults.GovName;
  }

  if (
    canFillBuiltInField(visibleBuiltInFieldKeys, 'company_name')
    && isEmptyValue(next._companyText)
    && defaults.CompanyName
    && (!next.CompanyID || next.CompanyID === defaults.CompanyID)
  ) {
    next._companyText = defaults.CompanyName;
  }

  if (
    canFillBuiltInField(visibleBuiltInFieldKeys, 'carrier_name')
    && isEmptyValue(next._carrierText)
    && defaults.CarrierName
    && (!next.CarrierID || next.CarrierID === defaults.CarrierID)
  ) {
    next._carrierText = defaults.CarrierName;
  }

  return next;
};

export const buildAccountDefaultsPayload = ({ form, sectionKey }) => {
  const payload = {
    accountId: form.AccountID,
    sectionKey,
  };

  appendPayloadValue(payload, 'defaultCurrency', form.Currency);
  appendPayloadValue(payload, 'defaultDriverId', form.DriverID);
  appendPayloadValue(payload, 'defaultVehicleId', form.VehicleID);
  appendPayloadValue(payload, 'defaultGoodTypeId', form.GoodTypeID);
  appendPayloadValue(payload, 'defaultGovId', form.GovID);
  appendPayloadValue(payload, 'defaultCompanyId', form.CompanyID);
  appendPayloadValue(payload, 'defaultCarrierId', form.CarrierID);
  appendPayloadValue(payload, 'defaultFeeUsd', form.FeeUSD);
  appendPayloadValue(payload, 'defaultSyrCus', form.SyrCus);
  appendPayloadValue(payload, 'defaultCarQty', form.CarQty);

  return payload;
};

export const buildRouteDefaultsPayload = ({ form, sectionKey }) => {
  const payload = {
    sectionKey,
    govId: form.GovID,
    currency: form.Currency || 'IQD',
  };

  appendPayloadValue(payload, 'defaultTransPrice', form.TransPrice);
  appendPayloadValue(payload, 'defaultFeeUsd', form.FeeUSD);
  appendPayloadValue(payload, 'defaultCostUsd', form.CostUSD);
  appendPayloadValue(payload, 'defaultAmountUsd', form.AmountUSD);
  appendPayloadValue(payload, 'defaultCostIqd', form.CostIQD);
  appendPayloadValue(payload, 'defaultAmountIqd', form.AmountIQD);

  return payload;
};

export const getPortStatementFooterCell = (column, index, totals = {}, options = {}) => {
  const metricKey = String(column?.dataKey || column?.key || '').toLowerCase();
  const isTransport = isTransportSectionScope(options);

  if (isTransport && index === 0) {
    return {
      value: 'المتبقي علينا',
      className: 'px-3 py-3',
    };
  }

  if (isTransport && (metricKey === 'amount_usd' || metricKey === 'amountusd')) {
    return {
      value: `$${formatPortNumber(totals.balanceUSD || 0)}`,
      className: 'px-3 py-3 text-rose-700',
    };
  }

  if (isTransport && (metricKey === 'amount_iqd' || metricKey === 'amountiqd')) {
    return {
      value: formatPortNumber(totals.balanceIQD || 0),
      className: 'px-3 py-3 text-rose-700',
    };
  }

  if (index === 0) {
    return {
      value: 'المجموع',
      className: 'px-3 py-3',
    };
  }

  if (metricKey === 'amount_usd' || metricKey === 'amountusd') {
    return { value: `$${formatPortNumber(totals.balanceUSD || 0)}`, className: 'px-3 py-3' };
  }
  if (metricKey === 'amount_iqd' || metricKey === 'amountiqd') {
    return { value: formatPortNumber(totals.balanceIQD || 0), className: 'px-3 py-3' };
  }
  if (metricKey === 'cost_usd' || metricKey === 'costusd') {
    return { value: `$${formatPortNumber(totals.totalCostUSD || 0)}`, className: 'px-3 py-3' };
  }
  if (metricKey === 'cost_iqd' || metricKey === 'costiqd') {
    return { value: formatPortNumber(totals.totalCostIQD || 0), className: 'px-3 py-3' };
  }
  if (metricKey === 'fee_usd' || metricKey === 'feeusd') {
    return { value: `$${formatPortNumber(totals.totalFeeUSD || 0)}`, className: 'px-3 py-3' };
  }
  if (metricKey === 'profit_usd' || metricKey === 'profitusd') {
    return {
      value: `$${formatPortNumber(totals.totalProfitUSD || 0)}`,
      className: `px-3 py-3 ${(totals.totalProfitUSD || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`,
    };
  }
  if (metricKey === 'profit_iqd' || metricKey === 'profitiqd') {
    return {
      value: formatPortNumber(totals.totalProfitIQD || 0),
      className: `px-3 py-3 ${(totals.totalProfitIQD || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`,
    };
  }

  return { value: '', className: 'px-3 py-3' };
};

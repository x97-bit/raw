import { buildFieldConfigMap, getFieldLabel } from '../../utils/fieldConfigMetadata';
import {
  formatTrialBalanceNumber,
  TRIAL_BALANCE_ALL_COLUMNS,
} from './trialBalanceConfig';

const POSITIVE_TONE = 'text-[#8eb8ad]';
const NEGATIVE_TONE = 'text-[#c697a1]';

function getFinancialTone(value) {
  return (value || 0) >= 0 ? POSITIVE_TONE : NEGATIVE_TONE;
}

export function buildTrialBalanceQuery(filters = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.set('startDate', filters.from);
  if (filters.to) params.set('endDate', filters.to);
  if (filters.port) params.set('portId', filters.port);
  if (filters.accountType) params.set('accountType', filters.accountType);
  return params.toString();
}

export function createTrialBalanceFieldConfigState(config = []) {
  if (!Array.isArray(config) || config.length === 0) {
    return {
      fieldConfigMap: {},
      visibleColumns: TRIAL_BALANCE_ALL_COLUMNS.map((column) => column.key),
    };
  }

  return {
    fieldConfigMap: buildFieldConfigMap(config),
    visibleColumns: config
      .filter((field) => field.visible)
      .sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0))
      .map((field) => field.fieldKey),
  };
}

export function buildTrialBalanceColumns(visibleColumns = [], fieldConfigMap = {}) {
  return visibleColumns
    .map((key) => {
      const column = TRIAL_BALANCE_ALL_COLUMNS.find((item) => item.key === key);
      return column ? { ...column, label: getFieldLabel(fieldConfigMap, key, column.label) } : null;
    })
    .filter(Boolean);
}

export function groupTrialBalanceRows(rows = []) {
  return rows.reduce((groups, row) => {
    const groupKey = row.AccountTypeName || 'أخرى';
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(row);
    return groups;
  }, {});
}

export function hasTrialBalancePeriodFilter(filters = {}) {
  return Boolean(filters.from || filters.to);
}

export function buildTrialBalanceSummaryCards(totals = {}) {
  return [
    { label: 'عدد الحسابات', value: totals.account_count || 0, valueClassName: 'text-[#eef3f7]' },
    { label: 'عدد الشحنات', value: totals.shipment_count || 0, valueClassName: 'text-[#9ab6ca]' },
    { label: 'إجمالي المدين ($)', value: `$${formatTrialBalanceNumber(Math.round(totals.debit_usd || 0))}`, valueClassName: POSITIVE_TONE },
    { label: 'إجمالي الدائن ($)', value: `$${formatTrialBalanceNumber(Math.round(totals.credit_usd || 0))}`, valueClassName: NEGATIVE_TONE },
    { label: 'صافي الرصيد ($)', value: `$${formatTrialBalanceNumber(Math.round(totals.balance_usd || 0))}`, valueClassName: getFinancialTone(totals.balance_usd || 0) },
    { label: 'إجمالي الربح ($)', value: `$${formatTrialBalanceNumber(Math.round(totals.profit_usd || 0))}`, valueClassName: getFinancialTone(totals.profit_usd || 0) },
    { label: 'صافي الرصيد (د.ع)', value: formatTrialBalanceNumber(Math.round(totals.balance_iqd || 0)), valueClassName: getFinancialTone(totals.balance_iqd || 0) },
  ];
}

export function buildTrialBalanceExportSummary(totals = {}) {
  return [
    { label: 'عدد الحسابات', value: totals.account_count },
    { label: 'عدد الشحنات', value: totals.shipment_count },
    { label: 'مدين ($)', value: `$${formatTrialBalanceNumber(totals.debit_usd)}` },
    { label: 'دائن ($)', value: `$${formatTrialBalanceNumber(totals.credit_usd)}` },
    { label: 'صافي ($)', value: `$${formatTrialBalanceNumber(totals.balance_usd)}` },
    { label: 'الربح ($)', value: `$${formatTrialBalanceNumber(totals.profit_usd)}` },
  ];
}

export function buildTrialBalanceTotalsRow(totals = {}) {
  return {
    debit_usd: totals.debit_usd,
    credit_usd: totals.credit_usd,
    balance_usd: totals.balance_usd,
    debit_iqd: totals.debit_iqd,
    credit_iqd: totals.credit_iqd,
    balance_iqd: totals.balance_iqd,
    profit_usd: totals.profit_usd,
    profit_iqd: totals.profit_iqd,
    trans_count: totals.trans_count,
  };
}

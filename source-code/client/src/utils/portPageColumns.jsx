import { getCurrencyLabel } from './currencyLabels';
import { getTransactionTypeLabel, isTransportSectionKey } from './transactionTypeLabels';
import { evaluateCustomFormula } from './customFields';

const formatNum = (value) => (value ? Number(value).toLocaleString('en-US') : '0');

function mapColumnTypeToExportFormat(type) {
  if (type === 'currency') return 'currency';
  if (type === 'money_iqd' || type === 'money_iqd_bold') return 'money_iqd';
  if (type === 'money_generic') return 'number';
  if (type?.includes('money')) return 'money';
  if (type === 'number') return 'number';
  if (type === 'date') return 'date';
  return undefined;
}

function mapExportFormatToViewType(format) {
  if (format === 'currency') return 'currency';
  if (format === 'money_iqd') return 'money_iqd';
  if (format === 'money') return 'money_usd';
  if (format === 'number') return 'number';
  if (format === 'date') return 'date';
  return 'text';
}

function isTransportAmountColumn(column, options = {}) {
  if (!isTransportSectionKey(options.sectionKey)) {
    return false;
  }

  const key = String(column?.key || column?.dataKey || '').toLowerCase();
  return key === 'amount_usd' || key === 'amount_iqd' || key === 'amountusd' || key === 'amountiqd';
}

export function toExportColumn(column, options = {}) {
  const exportColumn = {
    key: column.dataKey,
    label: column.label,
    format: mapColumnTypeToExportFormat(column.type),
  };

  if (typeof column.getValue === 'function') {
    exportColumn.getValue = column.getValue;
  } else if (column.key === 'direction') {
    exportColumn.getValue = (row) => getTransactionTypeLabel(row?.TransTypeName, row?.TransTypeID, {
      ...options,
      recordType: row?.RecordType,
    });
  }

  return exportColumn;
}

export function toPreviewColumn(column, index) {
  const key = column.key || `preview-column-${index}`;
  return {
    key,
    dataKey: key,
    label: column.label,
    type: mapExportFormatToViewType(column.format),
    getValue: column.getValue,
  };
}

export function renderPortCell(column, row, options = {}) {
  if (column.type === 'formula' && column.formula) {
    const result = evaluateCustomFormula(column.formula, row);
    if (result === null) return '-';
    return <span className={`font-bold ${result < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatNum(Math.round(result * 100) / 100)}</span>;
  }

  const value = typeof column.getValue === 'function' ? column.getValue(row) : row[column.dataKey];
  const transportAmountTone = isTransportAmountColumn(column, options)
    ? ((value || 0) < 0 ? 'text-emerald-700' : 'text-rose-700')
    : ((value || 0) < 0 ? 'text-red-600' : 'text-green-700');

  switch (column.type) {
    case 'date':
      return <span className="whitespace-nowrap">{value?.split(' ')[0] || '-'}</span>;
    case 'badge':
      return (
        <span className={`rounded px-2 py-0.5 text-xs ${
          row.TransTypeID === 2
            ? 'bg-orange-100 text-orange-700'
            : row.TransTypeID === 3
              ? 'bg-amber-100 text-amber-700'
              : 'bg-blue-100 text-blue-700'
        }`}>
          {getTransactionTypeLabel(value, row.TransTypeID, { ...options, recordType: row?.RecordType })}
        </span>
      );
    case 'currency':
      return getCurrencyLabel(value);
    case 'number':
      return value ? formatNum(value) : '-';
    case 'money_usd':
      return value ? `$${formatNum(value)}` : '-';
    case 'money_generic':
      return value ? formatNum(value) : '-';
    case 'money_usd_bold':
      return <span className={`font-bold ${transportAmountTone}`}>{value ? `$${formatNum(value)}` : '-'}</span>;
    case 'money_iqd':
      return value ? formatNum(value) : '-';
    case 'money_iqd_bold':
      return <span className={isTransportAmountColumn(column, options) ? transportAmountTone : `${(value || 0) < 0 ? 'text-red-600' : 'text-gray-700'}`}>{value ? formatNum(value) : '-'}</span>;
    case 'notes':
      return <span className="block max-w-[200px] truncate text-xs text-gray-500">{value || row.TraderNote || '-'}</span>;
    default:
      return value || '-';
  }
}

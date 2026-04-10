import { Fragment } from 'react';
import { formatTrialBalanceNumber, TRIAL_BALANCE_SUMMABLE_KEYS } from '../trialBalanceConfig';

export default function TrialBalanceTable({
  loading,
  data,
  columns,
  groupedRows,
}) {
  const colCount = columns.length;

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/[0.12] border-t-[#9ab6ca]" />
        <p className="text-sm text-[#91a0ad]">جارِ التحميل...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="surface-card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-3 py-3 font-semibold">{column.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Object.entries(groupedRows).map(([typeName, rows]) => (
              <Fragment key={`group-${typeName}`}>
                <tr className="bg-white/[0.04]">
                  <td colSpan={colCount} className="px-4 py-2.5 text-sm font-bold text-[#dce8f2]">{typeName}</td>
                </tr>

                {rows.map((row) => (
                  <tr
                    key={row.AccountID}
                    className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.04] ${
                      ((row.balance_usd || 0) < 0 || (row.balance_iqd || 0) < 0) ? 'bg-[#c697a1]/[0.06]' : ''
                    }`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-3 py-2.5 ${column.isBold ? 'font-bold' : ''} ${column.isMedium ? 'font-semibold' : ''} ${column.isSmall ? 'text-xs text-[#91a0ad]' : ''} ${column.isCenter ? 'text-center' : ''} ${column.colorFn ? column.colorFn(row[column.dataKey]) : (column.colorClass || '')}`}
                      >
                        {column.render(row[column.dataKey])}
                      </td>
                    ))}
                  </tr>
                ))}

                <tr className="border-b border-white/[0.05] bg-white/[0.03] text-sm font-semibold">
                  {columns.map((column, index) => {
                    if (TRIAL_BALANCE_SUMMABLE_KEYS.includes(column.key)) {
                      const sum = rows.reduce((total, row) => total + (row[column.dataKey] || 0), 0);
                      return (
                        <td key={column.key} className={`px-3 py-2 ${column.isCenter ? 'text-center' : ''} ${column.colorFn ? column.colorFn(sum) : (column.colorClass || '')}`}>
                          {column.key === 'shipment_count' || column.key === 'transaction_count' ? sum : formatTrialBalanceNumber(sum)}
                        </td>
                      );
                    }

                    if (index === 0) {
                      return <td key={column.key} className="px-3 py-2 text-[#dce8f2]">{`مجموع ${typeName}`}</td>;
                    }

                    return <td key={column.key} className="px-3 py-2"></td>;
                  })}
                </tr>
              </Fragment>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t border-white/[0.08] bg-white/[0.05] font-bold">
              {columns.map((column, index) => {
                if (TRIAL_BALANCE_SUMMABLE_KEYS.includes(column.key) && data.totals[column.dataKey] !== undefined) {
                  const value = data.totals[column.dataKey] || 0;
                  return (
                    <td key={column.key} className={`px-3 py-3 ${column.isCenter ? 'text-center' : ''} ${column.colorFn ? column.colorFn(value) : (column.colorClass || '')}`}>
                      {column.key === 'shipment_count' || column.key === 'transaction_count' ? value : formatTrialBalanceNumber(value)}
                    </td>
                  );
                }

                if (index === 0) {
                  return <td key={column.key} className="px-3 py-3 text-[#eef3f7]">الإجمالي الكلي</td>;
                }

                return <td key={column.key} className="px-3 py-3"></td>;
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

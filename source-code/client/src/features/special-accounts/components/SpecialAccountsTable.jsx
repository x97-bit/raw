import { Pencil, Trash2 } from 'lucide-react';
import { isSpecialHaiderSettlementRow } from '../../../utils/specialHaiderMath';
import {
  getAccountAccentLineStyle,
  getAccountCardOutlineStyle,
  getAccountEditButtonStyle,
  getAccountSettlementRowStyle,
  getAccountTableFooterStyle,
  getAccountTableHeaderStyle,
} from '../specialAccountsTheme';

export default function SpecialAccountsTable({
  account,
  accountId,
  visibleColumns,
  rows,
  canEdit,
  deletingId,
  derivedTotals,
  getFooterValue,
  onEdit,
  onDelete,
}) {
  const surfaceStyle = getAccountCardOutlineStyle(account, '12');
  const accentLineStyle = getAccountAccentLineStyle(account);
  const headerStyle = getAccountTableHeaderStyle(account);
  const editButtonStyle = getAccountEditButtonStyle(account);
  const footerStyle = getAccountTableFooterStyle(account);
  const isDateColumn = (column) => column?.format === 'date' || column?.key === 'trans_date' || column?.dataKey === 'TransDate';

  return (
    <div
      className="surface-card relative overflow-hidden p-0"
      style={surfaceStyle}
    >
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={accentLineStyle}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
              <tr className="text-right" style={headerStyle}>
              {visibleColumns.map((column) => (
                <th key={column.key} className={`px-4 py-3 font-semibold ${isDateColumn(column) ? 'whitespace-nowrap' : ''}`}>
                  {column.label}
                </th>
              ))}
              {canEdit && <th className="w-24 px-4 py-3 font-semibold">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={(visibleColumns.length || 1) + (canEdit ? 1 : 0)}
                  className="py-12 text-center text-[#8f9daa]"
                >
                  لا توجد نتائج مطابقة.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const isSettlement = accountId === 'haider' && isSpecialHaiderSettlementRow(row);
                const settlementStyle = isSettlement ? getAccountSettlementRowStyle(account) : undefined;

                return (
                  <tr
                    key={row.id || `${accountId}-${index}`}
                    className="border-b border-white/[0.05] transition-colors hover:bg-white/[0.035]"
                    style={settlementStyle}
                  >
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-[#e6edf4] ${column.isBold ? 'font-bold text-[#f4f8fb]' : ''} ${column.isMedium ? 'font-semibold' : ''} ${column.colorFn ? column.colorFn(row[column.dataKey]) : ''} ${column.isNotes ? 'max-w-[220px] truncate text-xs text-[#91a0ad]' : ''} ${isDateColumn(column) ? 'whitespace-nowrap' : ''}`}
                      >
                        {column.render(row[column.dataKey])}
                      </td>
                    ))}
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onEdit(row)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                            style={editButtonStyle}
                            title="تعديل"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => onDelete(row)}
                            disabled={deletingId === row.id}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#d8a2a8] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
                            style={{
                              background: 'rgba(183,97,105,0.12)',
                              border: '1px solid rgba(183,97,105,0.2)',
                            }}
                            title="حذف"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
          {derivedTotals && rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-white/[0.08] font-bold" style={footerStyle}>
                {visibleColumns.map((column, index) => {
                  const footerValue = getFooterValue(column.key, derivedTotals);

                  if (footerValue !== undefined) {
                    return (
                      <td key={column.key} className="px-4 py-3 text-[#eef3f7]">
                        {footerValue}
                      </td>
                    );
                  }

                  if (index === 0) {
                    return (
                      <td key={column.key} className="px-4 py-3 text-[#eef3f7]">
                        المجموع
                      </td>
                    );
                  }

                  return <td key={column.key} className="px-4 py-3" />;
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

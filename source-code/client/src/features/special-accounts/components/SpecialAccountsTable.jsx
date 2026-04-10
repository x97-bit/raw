import { Pencil, Trash2 } from 'lucide-react';
import { isSpecialHaiderSettlementRow } from '../../../utils/specialHaiderMath';

export default function SpecialAccountsTable({
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
  return (
    <div className="surface-card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
              {visibleColumns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold">{column.label}</th>
              ))}
              {canEdit && <th className="w-24 px-4 py-3 font-semibold">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={(visibleColumns.length || 1) + (canEdit ? 1 : 0)} className="py-12 text-center text-gray-400">
                  لا توجد نتائج مطابقة.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id || `${accountId}-${index}`}
                  className={`border-b border-gray-50 transition-colors hover:bg-primary-50/50 ${accountId === 'haider' && isSpecialHaiderSettlementRow(row) ? 'bg-amber-50/70 font-semibold' : ''}`}
                >
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 ${column.isBold ? 'font-bold' : ''} ${column.isMedium ? 'font-semibold' : ''} ${column.colorFn ? column.colorFn(row[column.dataKey]) : ''} ${column.isNotes ? 'max-w-[200px] truncate text-xs text-gray-400' : ''}`}
                    >
                      {column.render(row[column.dataKey])}
                    </td>
                  ))}
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEdit(row)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-primary-50"
                          title="تعديل"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => onDelete(row)}
                          disabled={deletingId === row.id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                          title="حذف"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {derivedTotals && rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                {visibleColumns.map((column, index) => {
                  const footerValue = getFooterValue(column.key, derivedTotals);

                  if (footerValue !== undefined) {
                    return (
                      <td key={column.key} className="px-4 py-3">
                        {footerValue}
                      </td>
                    );
                  }

                  if (index === 0) {
                    return (
                      <td key={column.key} className="px-4 py-3 text-primary-900">
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

import EmptyTableRow from "../../../components/EmptyTableRow";

function resolveDebtCellClass(column, debt) {
  const amountValue = Number(debt[column.dataKey] || 0);
  const isDateColumn =
    column?.format === "date" ||
    column?.key === "trans_date" ||
    column?.dataKey === "TransDate";

  return [
    "px-4 py-3",
    isDateColumn ? "whitespace-nowrap min-w-[110px] text-center" : "text-center",
    column.bold ? "font-bold" : "",
    column.color && amountValue < 0
      ? "text-red-600"
      : column.color
        ? "text-emerald-600"
        : "",
    column.isNotes ? "max-w-[220px] truncate text-xs text-gray-500" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function DebtTable({ activeColumns, debts, onSelectDebt }) {
  return (
    <div className="surface-card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
              {activeColumns.map(column => (
                <th
                  key={column.key}
                  className={`px-4 py-3 font-semibold text-center ${column?.key === "trans_date" || column?.dataKey === "TransDate" ? "whitespace-nowrap min-w-[110px]" : ""}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {debts.length === 0 ? (
              <EmptyTableRow
                colSpan={activeColumns.length}
                message="لا توجد نتائج مطابقة."
                className="py-12 text-center text-gray-400"
              />
            ) : (
              debts.map(debt => (
                <tr
                  key={debt.DebtID}
                  onClick={() => onSelectDebt(debt)}
                  className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-primary-50/50"
                >
                  {activeColumns.map(column => (
                    <td
                      key={column.key}
                      className={resolveDebtCellClass(column, debt)}
                    >
                      {column.render(debt[column.dataKey])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { Edit, Trash2 } from "lucide-react";
import EmptyTableRow from "../../../components/EmptyTableRow";

export default function ExpensesTable({ columns, rows, onEdit, onDelete }) {
  return (
    <div className="surface-card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
              {columns.map(column => (
                <th key={column.key} className="px-4 py-3 font-semibold">
                  {column.label}
                </th>
              ))}
              <th className="w-20 px-4 py-3 font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyTableRow
                colSpan={columns.length + 1}
                message="لا توجد مصاريف."
              />
            ) : (
              rows.map(expense => (
                <tr
                  key={expense.id}
                  className="border-b border-gray-50 transition-colors hover:bg-primary-50/50"
                >
                  {columns.map(column => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 ${column.bold ? "font-bold text-accent-600" : ""}`}
                    >
                      {column.render(expense[column.dataKey])}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEdit(expense)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-accent-600 transition-colors hover:bg-accent-50"
                        title="تعديل"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(expense.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

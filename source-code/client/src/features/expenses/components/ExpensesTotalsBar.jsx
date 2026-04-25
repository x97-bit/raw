import { formatExpenseNumber } from "../expensesConfig";

export default function ExpensesTotalsBar({ totalUSD, totalIQD, count }) {
  return (
    <div className="surface-card flex items-center gap-4 px-5 py-3.5">
      <span className="text-sm text-gray-500">المجموع:</span>
      <span className="font-bold text-accent-600">
        ${formatExpenseNumber(totalUSD)}
      </span>
      {totalIQD !== 0 && (
        <span className="font-bold text-gray-700">
          {formatExpenseNumber(totalIQD)} د.ع
        </span>
      )}
      <span className="mr-auto text-xs text-gray-400">{count} مصروف</span>
    </div>
  );
}

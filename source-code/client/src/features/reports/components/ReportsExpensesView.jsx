import { useMemo, useState } from 'react';
import { Receipt } from 'lucide-react';
import DateRangeFilters from '../../../components/DateRangeFilters';
import EmptyTableRow from '../../../components/EmptyTableRow';
import ExportButtons from '../../../components/ExportButtons';
import LoadingSpinner from '../../../components/LoadingSpinner';
import PageHeader from '../../../components/PageHeader';
import SummaryCard from '../../../components/SummaryCard';
import TransactionModal from '../../../components/TransactionModal';
import {
  buildReportPrintMetaItems,
  buildExpensesSummaryCards,
  EXPENSES_EXPORT_COLUMNS,
} from '../../../utils/reportsConfig';
import { formatReportDate, formatReportNumber } from '../reportsPageHelpers';

export default function ReportsExpensesView({
  activePort,
  data,
  filters,
  loading,
  onBack,
  onFilterChange,
  onRefresh,
}) {
  const [selectedTx, setSelectedTx] = useState(null);
  const expenseSummaryCards = useMemo(() => buildExpensesSummaryCards(data), [data]);

  return (
    <div className="page-shell">
      <PageHeader
        title={`المصاريف - ${activePort?.name || ''}`}
        subtitle="التقارير"
        onBack={onBack}
      >
        {data?.rows?.length > 0 && (
          <ExportButtons
            inHeader
            rows={data.rows}
            columns={EXPENSES_EXPORT_COLUMNS}
            title={`المصاريف - ${activePort?.name || ''}`}
            subtitle="التقارير"
            filename={`مصاريف_${activePort?.name || ''}`}
            summaryCards={expenseSummaryCards}
            totalsRow={{ CostUSD: data.totals.totalCostUSD, AmountUSD: data.totals.totalAmountUSD }}
            printStrategy="table"
            printMetaItems={buildReportPrintMetaItems(activePort, filters)}
          />
        )}
      </PageHeader>

      <div className="space-y-4 p-5">
        <DateRangeFilters filters={filters} onChange={onFilterChange} onSubmit={onRefresh} />

        {loading ? <LoadingSpinner /> : data && (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <SummaryCard label="عدد الفواتير" value={data.rows.length} tone="text-[#eef3f7]" />
              <SummaryCard label="إجمالي التكلفة" value={`$${formatReportNumber(data.totals.totalCostUSD)}`} tone="text-[#c8d4df]" />
              <SummaryCard label="إجمالي المبلغ" value={`$${formatReportNumber(data.totals.totalAmountUSD)}`} tone="text-[#9ab6ca]" />
            </div>

            <div className="surface-card overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-5 py-3.5">
                <span className="flex items-center gap-2 font-bold text-[#eef3f7]">
                  <Receipt size={16} className="text-[#c8d4df]" />
                  المصاريف ({data.rows.length} معاملة)
                </span>
                <span className="font-bold text-[#c8d4df]">
                  إجمالي التكلفة: ${formatReportNumber(data.totals.totalCostUSD)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                      <th className="px-4 py-3 font-semibold">التاريخ</th>
                      <th className="px-4 py-3 font-semibold">المرجع</th>
                      <th className="px-4 py-3 font-semibold">التاجر</th>
                      <th className="px-4 py-3 font-semibold">البضاعة</th>
                      <th className="px-4 py-3 font-semibold">الوزن</th>
                      <th className="px-4 py-3 font-semibold">التكلفة ($)</th>
                      <th className="px-4 py-3 font-semibold">المبلغ ($)</th>
                      <th className="px-4 py-3 font-semibold">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.length === 0 ? (
                      <EmptyTableRow colSpan={8} message="لا توجد مصاريف مطابقة." />
                    ) : (
                      data.rows.map((row, index) => (
                        <tr
                          key={index}
                          onClick={() => setSelectedTx(row)}
                          className="cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.04]"
                        >
                          <td className="px-4 py-3">{formatReportDate(row.TransDate)}</td>
                          <td className="px-4 py-3 text-xs text-[#91a0ad]">{row.RefNo}</td>
                          <td className="px-4 py-3 font-semibold text-[#eef3f7]">{row.AccountName}</td>
                          <td className="px-4 py-3">{row.GoodType || '-'}</td>
                          <td className="px-4 py-3">{row.Weight ? formatReportNumber(row.Weight) : '-'}</td>
                          <td className="px-4 py-3 font-bold text-[#c8d4df]">${formatReportNumber(row.CostUSD)}</td>
                          <td className="px-4 py-3 text-[#9ab6ca]">${formatReportNumber(row.AmountUSD)}</td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-xs text-[#91a0ad]">{row.Notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/[0.08] bg-white/[0.03] font-bold">
                      <td colSpan="5" className="px-4 py-3 text-[#eef3f7]">المجموع</td>
                      <td className="px-4 py-3 text-[#c8d4df]">${formatReportNumber(data.totals.totalCostUSD)}</td>
                      <td className="px-4 py-3 text-[#9ab6ca]">${formatReportNumber(data.totals.totalAmountUSD)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}

        <TransactionModal transaction={selectedTx} onClose={() => setSelectedTx(null)} readOnly />
      </div>
    </div>
  );
}

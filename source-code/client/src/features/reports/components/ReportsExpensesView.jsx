import { useMemo } from 'react';
import { Receipt } from 'lucide-react';
import DateRangeFilters from '../../../components/DateRangeFilters';
import EmptyTableRow from '../../../components/EmptyTableRow';
import ExportButtons from '../../../components/ExportButtons';
import LoadingSpinner from '../../../components/LoadingSpinner';
import PageHeader from '../../../components/PageHeader';
import SummaryCard from '../../../components/SummaryCard';
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
            totalsRow={{ amountUSD: data.totals.totalUSD, amountIQD: data.totals.totalIQD }}
            printStrategy="table"
            printMetaItems={buildReportPrintMetaItems(activePort, filters)}
          />
        )}
      </PageHeader>

      <div className="space-y-4 p-5">
        <DateRangeFilters filters={filters} onChange={onFilterChange} onSubmit={onRefresh} />

        {loading ? <LoadingSpinner /> : data && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <SummaryCard label="عدد المصاريف" value={data.totals.count || data.rows.length} tone="text-[#eef3f7]" />
              <SummaryCard label="على المنفذ ($)" value={`$${formatReportNumber(data.totals.directExpenseUSD)}`} tone="text-[#c8d4df]" />
              <SummaryCard label="على المنفذ (د.ع)" value={formatReportNumber(data.totals.directExpenseIQD)} tone="text-[#9ab6ca]" />
              <SummaryCard label="محمل على التاجر ($)" value={`$${formatReportNumber(data.totals.chargedToTraderUSD)}`} tone="text-[#8eb8ad]" />
              <SummaryCard label="محمل على التاجر (د.ع)" value={formatReportNumber(data.totals.chargedToTraderIQD)} tone="text-[#d1b58b]" />
            </div>

            <div className="surface-card overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-5 py-3.5">
                <span className="flex items-center gap-2 font-bold text-[#eef3f7]">
                  <Receipt size={16} className="text-[#c8d4df]" />
                  المصاريف ({data.rows.length} معاملة)
                </span>
                <span className="font-bold text-[#c8d4df]">
                  الإجمالي: ${formatReportNumber(data.totals.totalUSD)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                      <th className="px-4 py-3 font-semibold">التاريخ</th>
                      <th className="px-4 py-3 font-semibold">البيان</th>
                      <th className="px-4 py-3 font-semibold">التحميل</th>
                      <th className="px-4 py-3 font-semibold">التاجر</th>
                      <th className="px-4 py-3 font-semibold">المبلغ ($)</th>
                      <th className="px-4 py-3 font-semibold">المبلغ (د.ع)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.length === 0 ? (
                      <EmptyTableRow colSpan={6} message="لا توجد مصاريف مطابقة." />
                    ) : (
                      data.rows.map((row, index) => (
                        <tr key={index} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.04]">
                          <td className="px-4 py-3">{formatReportDate(row.expenseDate)}</td>
                          <td className="max-w-[260px] truncate px-4 py-3 text-xs text-[#91a0ad]">{row.description || '-'}</td>
                          <td className="px-4 py-3 font-semibold text-[#c8d4df]">{row.chargeTarget === 'trader' ? 'على التاجر' : 'على المنفذ'}</td>
                          <td className="px-4 py-3 font-semibold text-[#eef3f7]">{row.accountName || '-'}</td>
                          <td className="px-4 py-3 font-bold text-[#c8d4df]">{row.amountUSD ? `$${formatReportNumber(row.amountUSD)}` : '-'}</td>
                          <td className="px-4 py-3 text-[#9ab6ca]">{row.amountIQD ? formatReportNumber(row.amountIQD) : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/[0.08] bg-white/[0.03] font-bold">
                      <td colSpan="4" className="px-4 py-3 text-[#eef3f7]">المجموع</td>
                      <td className="px-4 py-3 text-[#c8d4df]">{data.totals.totalUSD ? `$${formatReportNumber(data.totals.totalUSD)}` : '-'}</td>
                      <td className="px-4 py-3 text-[#9ab6ca]">{data.totals.totalIQD ? formatReportNumber(data.totals.totalIQD) : '-'}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

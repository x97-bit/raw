import { useMemo, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import DateRangeFilters from '../../../components/DateRangeFilters';
import EmptyTableRow from '../../../components/EmptyTableRow';
import ExportButtons from '../../../components/ExportButtons';
import LoadingSpinner from '../../../components/LoadingSpinner';
import PageHeader from '../../../components/PageHeader';
import SummaryCard from '../../../components/SummaryCard';
import TransactionModal from '../../../components/TransactionModal';
import {
  buildProfitsPrintSections,
  buildReportPrintMetaItems,
  buildProfitSummaryCards,
  PROFITS_EXPORT_COLUMNS,
} from '../../../utils/reportsConfig';
import {
  formatReportDate,
  formatReportNumber,
  getProfitTone,
} from '../reportsPageHelpers';

export default function ReportsProfitsView({
  activePort,
  data,
  filters,
  loading,
  onBack,
  onFilterChange,
  onRefresh,
}) {
  const [selectedTx, setSelectedTx] = useState(null);
  const profitRows = data?.rows || [];
  const profitTotals = data?.totals || {};
  const traderProfits = data?.traderProfits || [];
  const profitSummaryCards = useMemo(() => buildProfitSummaryCards(profitTotals), [profitTotals]);
  const profitTone = getProfitTone(profitTotals.totalProfitUSD);
  const profitIqdTone = getProfitTone(profitTotals.totalProfitIQD);

  return (
    <div className="page-shell">
      <PageHeader
        title={`الأرباح - ${activePort?.name || ''}`}
        subtitle="التقارير"
        onBack={onBack}
      >
        {profitRows.length > 0 && (
          <ExportButtons
            inHeader
            rows={profitRows}
            columns={PROFITS_EXPORT_COLUMNS}
            title={`الأرباح - ${activePort?.name || ''}`}
            subtitle="التقارير"
            filename={`أرباح_${activePort?.name || ''}`}
            summaryCards={profitSummaryCards}
            totalsRow={{
              CostUSD: profitTotals.totalCostUSD,
              AmountUSD: profitTotals.totalAmountUSD,
              ProfitUSD: profitTotals.totalProfitUSD,
            }}
            printStrategy="table"
            printMetaItems={buildReportPrintMetaItems(activePort, filters)}
            printSections={buildProfitsPrintSections({
              traderProfits,
              profitRows,
              profitTotals,
            })}
          />
        )}
      </PageHeader>

      <div className="space-y-4 p-5">
        <DateRangeFilters filters={filters} onChange={onFilterChange} onSubmit={onRefresh} />

        {loading ? <LoadingSpinner /> : data && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <SummaryCard label="عدد الشحنات" value={profitTotals.shipmentCount || 0} tone="text-[#9ab6ca]" />
              <SummaryCard label="إجمالي التكلفة ($)" value={`$${formatReportNumber(profitTotals.totalCostUSD)}`} tone="text-[#c8d4df]" />
              <SummaryCard label="إجمالي المبلغ ($)" value={`$${formatReportNumber(profitTotals.totalAmountUSD)}`} tone="text-[#eef3f7]" />
              <SummaryCard label="إجمالي الربح ($)" value={`$${formatReportNumber(profitTotals.totalProfitUSD)}`} tone={profitTone} />
            </div>

            {traderProfits.length > 0 && (
              <div className="surface-card overflow-hidden p-0">
                <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.03] px-5 py-3.5">
                  <BarChart3 size={16} className="text-[#9ab6ca]" />
                  <span className="font-bold text-[#eef3f7]">
                    ملخص الأرباح حسب التاجر
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                        <th className="px-4 py-3 font-semibold">التاجر</th>
                        <th className="px-4 py-3 font-semibold">عدد الشحنات</th>
                        <th className="px-4 py-3 font-semibold">التكلفة ($)</th>
                        <th className="px-4 py-3 font-semibold">المبلغ ($)</th>
                        <th className="px-4 py-3 font-semibold">الربح ($)</th>
                        <th className="px-4 py-3 font-semibold">الربح (د.ع)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {traderProfits.length === 0 ? (
                        <EmptyTableRow colSpan={6} message="لا توجد أرباح مجمعة حسب التاجر." />
                      ) : (
                        traderProfits.map((trader, index) => (
                          <tr key={index} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.04]">
                            <td className="px-4 py-3 font-semibold text-[#eef3f7]">{trader.AccountName}</td>
                            <td className="px-4 py-3 text-center font-semibold text-[#9ab6ca]">{trader.shipmentCount}</td>
                            <td className="px-4 py-3 text-[#c8d4df]">${formatReportNumber(trader.totalCostUSD)}</td>
                            <td className="px-4 py-3">${formatReportNumber(trader.totalAmountUSD)}</td>
                            <td className={`px-4 py-3 font-bold ${getProfitTone(trader.totalProfitUSD)}`}>${formatReportNumber(trader.totalProfitUSD)}</td>
                            <td className={`px-4 py-3 ${getProfitTone(trader.totalProfitIQD)}`}>{formatReportNumber(trader.totalProfitIQD)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-white/[0.08] bg-white/[0.03] font-bold">
                        <td className="px-4 py-3 text-[#eef3f7]">المجموع</td>
                        <td className="px-4 py-3 text-center text-[#9ab6ca]">{profitTotals.shipmentCount}</td>
                        <td className="px-4 py-3 text-[#c8d4df]">${formatReportNumber(profitTotals.totalCostUSD)}</td>
                        <td className="px-4 py-3">${formatReportNumber(profitTotals.totalAmountUSD)}</td>
                        <td className={`px-4 py-3 ${profitTone}`}>${formatReportNumber(profitTotals.totalProfitUSD)}</td>
                        <td className={`px-4 py-3 ${profitIqdTone}`}>{formatReportNumber(profitTotals.totalProfitIQD)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <div className="surface-card overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-5 py-3.5">
                <span className="flex items-center gap-2 font-bold text-[#eef3f7]">
                  <TrendingUp size={16} className="text-[#8eb8ad]" />
                  تفاصيل الشحنات ({profitRows.length} شحنة)
                </span>
                <span className={`font-bold ${profitTone}`}>
                  إجمالي الربح: ${formatReportNumber(profitTotals.totalProfitUSD)}
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
                      <th className="px-4 py-3 font-semibold">التكلفة ($)</th>
                      <th className="px-4 py-3 font-semibold">المبلغ ($)</th>
                      <th className="px-4 py-3 font-semibold">الربح ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitRows.length === 0 ? (
                      <EmptyTableRow colSpan={7} message="لا توجد شحنات مطابقة." />
                    ) : (
                      profitRows.map((row, index) => (
                        <tr
                          key={index}
                          onClick={() => setSelectedTx(row)}
                          className="cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.04]"
                        >
                          <td className="px-4 py-3">{formatReportDate(row.TransDate)}</td>
                          <td className="px-4 py-3 text-xs text-[#91a0ad]">{row.RefNo}</td>
                          <td className="px-4 py-3 font-semibold text-[#eef3f7]">{row.AccountName}</td>
                          <td className="px-4 py-3">{row.GoodTypeName || row.GoodType || '-'}</td>
                          <td className="px-4 py-3 text-[#c8d4df]">${formatReportNumber(row.CostUSD)}</td>
                          <td className="px-4 py-3">${formatReportNumber(row.AmountUSD)}</td>
                          <td className={`px-4 py-3 font-bold ${getProfitTone(row.ProfitUSD)}`}>${formatReportNumber(row.ProfitUSD)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/[0.08] bg-white/[0.03] font-bold">
                      <td colSpan="4" className="px-4 py-3 text-[#eef3f7]">المجموع</td>
                      <td className="px-4 py-3 text-[#c8d4df]">${formatReportNumber(profitTotals.totalCostUSD)}</td>
                      <td className="px-4 py-3">${formatReportNumber(profitTotals.totalAmountUSD)}</td>
                      <td className={`px-4 py-3 ${profitTone}`}>${formatReportNumber(profitTotals.totalProfitUSD)}</td>
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

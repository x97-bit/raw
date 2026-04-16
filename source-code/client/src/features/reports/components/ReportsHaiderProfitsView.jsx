import { useMemo, useState } from 'react';
import { Building2, TrendingUp } from 'lucide-react';
import DateRangeFilters from '../../../components/DateRangeFilters';
import EmptyTableRow from '../../../components/EmptyTableRow';
import ExportButtons from '../../../components/ExportButtons';
import LoadingSpinner from '../../../components/LoadingSpinner';
import PageHeader from '../../../components/PageHeader';
import SummaryCard from '../../../components/SummaryCard';
import {
  buildHaiderReportSummaryCards,
  buildHaiderReportPrintSections,
  buildReportPrintMetaItems,
  HAIDER_REPORT_EXPORT_COLUMNS,
} from '../../../utils/reportsConfig';
import {
  formatReportDate,
  formatReportNumber,
  getProfitTone,
} from '../reportsPageHelpers';

export default function ReportsHaiderProfitsView({
  activeAccount,
  data,
  filters,
  loading,
  onBack,
  onFilterChange,
  onRefresh,
}) {
  const rows = data?.statement || [];
  const totals = data?.totals || {};
  const summaryCards = useMemo(() => buildHaiderReportSummaryCards(totals), [totals]);
  const profitUsdTone = getProfitTone(totals.totalProfitUSD);
  const netIqdTone = getProfitTone(totals.totalNetIQD);

  const printMeta = [
    { label: 'الحساب', value: activeAccount?.name || 'حيدر شركة الأنوار' },
    { label: 'من تاريخ', value: filters?.from || 'كل الفترة' },
    { label: 'إلى تاريخ', value: filters?.to || 'كل الفترة' },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title={`الأرباح - ${activeAccount?.name || 'حيدر شركة الأنوار'}`}
        subtitle="التقارير"
        onBack={onBack}
      >
        {rows.length > 0 && (
          <ExportButtons
            inHeader
            rows={rows}
            columns={HAIDER_REPORT_EXPORT_COLUMNS}
            title={`الأرباح - ${activeAccount?.name || 'حيدر شركة الأنوار'}`}
            subtitle="التقارير"
            filename="أرباح_حيدر_شركة_الأنوار"
            summaryCards={summaryCards}
            totalsRow={{
              Weight: totals.totalWeight,
              CostUSD: totals.totalCostUSD,
              AmountUSD: totals.totalAmountUSD,
              ProfitUSD: totals.totalProfitUSD,
              CostIQD: totals.totalCostIQD,
              AmountIQD: totals.totalAmountIQD,
              DifferenceIQD: totals.totalDifferenceIQD,
              NetIQD: totals.totalNetIQD,
            }}
            printStrategy="table"
            printMetaItems={printMeta}
            printSections={buildHaiderReportPrintSections({ rows, totals })}
          />
        )}
      </PageHeader>

      <div className="space-y-4 p-5">
        <DateRangeFilters filters={filters} onChange={onFilterChange} onSubmit={onRefresh} />

        {loading ? <LoadingSpinner /> : data && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              <SummaryCard label="عدد العمليات" value={totals.count || 0} tone="text-[#9ab6ca]" />
              <SummaryCard label="إجمالي الكلفة ($)" value={`$${formatReportNumber(totals.totalCostUSD)}`} tone="text-[#c8d4df]" />
              <SummaryCard label="إجمالي المبلغ ($)" value={`$${formatReportNumber(totals.totalAmountUSD)}`} tone="text-[#eef3f7]" />
              <SummaryCard label="إجمالي الربح ($)" value={`$${formatReportNumber(totals.totalProfitUSD)}`} tone={profitUsdTone} />
              <SummaryCard label="إجمالي الربح (د.ع)" value={formatReportNumber(totals.totalNetIQD)} tone={netIqdTone} />
              <SummaryCard label="إجمالي الفرق (د.ع)" value={formatReportNumber(totals.totalDifferenceIQD)} tone="text-[#d1b58b]" />
            </div>

            <div className="surface-card overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-5 py-3.5">
                <span className="flex items-center gap-2 font-bold text-[#eef3f7]">
                  <Building2 size={16} className="text-[#648ea9]" />
                  تفاصيل العمليات ({rows.length} عملية)
                </span>
                <div className="flex items-center gap-4">
                  <span className={`font-bold ${profitUsdTone}`}>
                    الربح ($): ${formatReportNumber(totals.totalProfitUSD)}
                  </span>
                  <span className={`font-bold ${netIqdTone}`}>
                    الربح (د.ع): {formatReportNumber(totals.totalNetIQD)}
                  </span>
                  <span className="font-bold text-[#d1b58b]">
                    الفرق (د.ع): {formatReportNumber(totals.totalDifferenceIQD)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                      <th className="px-4 py-3 font-semibold">التاريخ</th>
                      <th className="px-4 py-3 font-semibold">الوجهة</th>
                      <th className="px-4 py-3 font-semibold">السائق</th>
                      <th className="px-4 py-3 font-semibold">رقم السيارة</th>
                      <th className="px-4 py-3 font-semibold">البضاعة</th>
                      <th className="px-4 py-3 font-semibold">الوزن</th>
                      <th className="px-4 py-3 font-semibold">الكلفة ($)</th>
                      <th className="px-4 py-3 font-semibold">المبلغ ($)</th>
                      <th className="px-4 py-3 font-semibold">الربح ($)</th>
                      <th className="px-4 py-3 font-semibold">الكلفة (د.ع)</th>
                      <th className="px-4 py-3 font-semibold">المبلغ (د.ع)</th>
                      <th className="px-4 py-3 font-semibold">الفرق (د.ع)</th>
                      <th className="px-4 py-3 font-semibold">الصافي (د.ع)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <EmptyTableRow colSpan={13} message="لا توجد عمليات مطابقة." />
                    ) : (
                      rows.map((row, index) => (
                        <tr
                          key={index}
                          className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.04]"
                        >
                          <td className="px-4 py-3">{formatReportDate(row.TransDate)}</td>
                          <td className="px-4 py-3">{row.Destination || '-'}</td>
                          <td className="px-4 py-3">{row.DriverName || '-'}</td>
                          <td className="px-4 py-3">{row.PlateNumber || '-'}</td>
                          <td className="px-4 py-3">{row.GoodType || '-'}</td>
                          <td className="px-4 py-3">{row.Weight ? formatReportNumber(row.Weight) : '-'}</td>
                          <td className="px-4 py-3 text-[#c8d4df]">${formatReportNumber(row.CostUSD)}</td>
                          <td className="px-4 py-3">${formatReportNumber(row.AmountUSD)}</td>
                          <td className={`px-4 py-3 font-bold ${getProfitTone(row.ProfitUSD)}`}>${formatReportNumber(row.ProfitUSD)}</td>
                          <td className="px-4 py-3 text-[#c8d4df]">{formatReportNumber(row.CostIQD)}</td>
                          <td className="px-4 py-3">{formatReportNumber(row.AmountIQD)}</td>
                          <td className="px-4 py-3 text-[#d1b58b]">{formatReportNumber(row.DifferenceIQD)}</td>
                          <td className={`px-4 py-3 font-bold ${getProfitTone(row.NetIQD)}`}>{formatReportNumber(row.NetIQD)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/[0.08] bg-white/[0.03] font-bold">
                      <td colSpan="5" className="px-4 py-3 text-[#eef3f7]">المجموع</td>
                      <td className="px-4 py-3">{formatReportNumber(totals.totalWeight)}</td>
                      <td className="px-4 py-3 text-[#c8d4df]">${formatReportNumber(totals.totalCostUSD)}</td>
                      <td className="px-4 py-3">${formatReportNumber(totals.totalAmountUSD)}</td>
                      <td className={`px-4 py-3 ${profitUsdTone}`}>${formatReportNumber(totals.totalProfitUSD)}</td>
                      <td className="px-4 py-3 text-[#c8d4df]">{formatReportNumber(totals.totalCostIQD)}</td>
                      <td className="px-4 py-3">{formatReportNumber(totals.totalAmountIQD)}</td>
                      <td className="px-4 py-3 text-[#d1b58b]">{formatReportNumber(totals.totalDifferenceIQD)}</td>
                      <td className={`px-4 py-3 ${netIqdTone}`}>{formatReportNumber(totals.totalNetIQD)}</td>
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

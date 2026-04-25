import { useMemo, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import DateRangeFilters from "../../../components/DateRangeFilters";
import EmptyTableRow from "../../../components/EmptyTableRow";
import ExportButtons from "../../../components/ExportButtons";
import LoadingSpinner from "../../../components/LoadingSpinner";
import PageHeader from "../../../components/PageHeader";
import SummaryCard from "../../../components/SummaryCard";
import TransactionModal from "../../../components/TransactionModal";
import {
  buildProfitsPrintSections,
  buildReportPrintMetaItems,
  buildProfitSummaryCards,
  PROFITS_EXPORT_COLUMNS,
} from "../../../utils/reportsConfig";
import {
  formatReportDate,
  formatReportNumber,
  getProfitTone,
} from "../reportsPageHelpers";

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
  const profitSummaryCards = useMemo(
    () => buildProfitSummaryCards(profitTotals),
    [profitTotals]
  );
  const profitTone = getProfitTone(profitTotals.totalProfitUSD);
  const profitIqdTone = getProfitTone(profitTotals.totalProfitIQD);

  return (
    <div className="page-shell">
      <PageHeader
        title={`الأرباح - ${activePort?.name || ""}`}
        subtitle="التقارير"
        onBack={onBack}
      >
        {profitRows.length > 0 && (
          <ExportButtons
            inHeader
            rows={profitRows}
            columns={PROFITS_EXPORT_COLUMNS}
            title={`الأرباح - ${activePort?.name || ""}`}
            subtitle="التقارير"
            filename={`أرباح_${activePort?.name || ""}`}
            summaryCards={profitSummaryCards}
            totalsRow={{
              CostUSD: profitTotals.totalCostUSD,
              AmountUSD: profitTotals.totalAmountUSD,
              ProfitUSD: profitTotals.totalProfitUSD,
              ProfitIQD: profitTotals.totalProfitIQD,
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
        <DateRangeFilters
          filters={filters}
          onChange={onFilterChange}
          onSubmit={onRefresh}
        />

        {loading ? (
          <LoadingSpinner />
        ) : (
          data && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <SummaryCard
                  label="عدد الشحنات"
                  value={profitTotals.shipmentCount || 0}
                  tone="text-utility-accent-text"
                />
                <SummaryCard
                  label="إجمالي التكلفة ($)"
                  value={`$${formatReportNumber(profitTotals.totalCostUSD)}`}
                  tone="text-utility-muted"
                />
                <SummaryCard
                  label="إجمالي المبلغ ($)"
                  value={`$${formatReportNumber(profitTotals.totalAmountUSD)}`}
                  tone="text-utility-strong"
                />
                <SummaryCard
                  label="إجمالي الربح ($)"
                  value={`$${formatReportNumber(profitTotals.totalProfitUSD)}`}
                  tone={profitTone}
                />
                <SummaryCard
                  label="إجمالي الربح (د.ع)"
                  value={formatReportNumber(profitTotals.totalProfitIQD)}
                  tone={profitIqdTone}
                />
              </div>

              {traderProfits.length > 0 && (
                <div className="surface-card overflow-hidden p-0">
                  <div className="flex items-center gap-2 border-b border-utility-soft-border bg-utility-soft-bg px-5 py-3.5">
                    <BarChart3 size={16} className="text-utility-accent-text" />
                    <span className="font-bold text-utility-strong">
                      ملخص الأرباح حسب التاجر
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="table-header text-right">
                          <th className="px-4 py-3 font-semibold">التاجر</th>
                          <th className="px-4 py-3 font-semibold">
                            عدد الشحنات
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            التكلفة ($)
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            المبلغ ($)
                          </th>
                          <th className="px-4 py-3 font-semibold">الربح ($)</th>
                          <th className="px-4 py-3 font-semibold">
                            الربح (د.ع)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {traderProfits.length === 0 ? (
                          <EmptyTableRow
                            colSpan={6}
                            message="لا توجد أرباح مجمعة حسب التاجر."
                          />
                        ) : (
                          traderProfits.map((trader, index) => (
                            <tr
                              key={index}
                              className="border-b border-utility-panel-border transition-colors hover:bg-utility-soft-bg-hover"
                            >
                              <td className="px-4 py-3 font-semibold text-utility-strong">
                                {trader.AccountName}
                              </td>
                              <td className="px-4 py-3 text-center font-semibold text-utility-accent-text">
                                {trader.shipmentCount}
                              </td>
                              <td className="px-4 py-3 text-utility-muted">
                                ${formatReportNumber(trader.totalCostUSD)}
                              </td>
                              <td className="px-4 py-3">
                                ${formatReportNumber(trader.totalAmountUSD)}
                              </td>
                              <td
                                className={`px-4 py-3 font-bold ${getProfitTone(trader.totalProfitUSD)}`}
                              >
                                ${formatReportNumber(trader.totalProfitUSD)}
                              </td>
                              <td
                                className={`px-4 py-3 ${getProfitTone(trader.totalProfitIQD)}`}
                              >
                                {formatReportNumber(trader.totalProfitIQD)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-utility-panel-border bg-utility-soft-bg font-bold">
                          <td className="px-4 py-3 text-utility-strong">
                            المجموع
                          </td>
                          <td className="px-4 py-3 text-center text-utility-accent-text">
                            {profitTotals.shipmentCount}
                          </td>
                          <td className="px-4 py-3 text-utility-muted">
                            ${formatReportNumber(profitTotals.totalCostUSD)}
                          </td>
                          <td className="px-4 py-3">
                            ${formatReportNumber(profitTotals.totalAmountUSD)}
                          </td>
                          <td className={`px-4 py-3 ${profitTone}`}>
                            ${formatReportNumber(profitTotals.totalProfitUSD)}
                          </td>
                          <td className={`px-4 py-3 ${profitIqdTone}`}>
                            {formatReportNumber(profitTotals.totalProfitIQD)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              <div className="surface-card overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-utility-soft-border bg-utility-soft-bg px-5 py-3.5">
                  <span className="flex items-center gap-2 font-bold text-utility-strong">
                    <TrendingUp
                      size={16}
                      className="text-utility-success-text"
                    />
                    تفاصيل الشحنات ({profitRows.length} شحنة)
                  </span>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold ${profitTone}`}>
                      الربح ($): $
                      {formatReportNumber(profitTotals.totalProfitUSD)}
                    </span>
                    <span className={`font-bold ${profitIqdTone}`}>
                      الربح (د.ع):{" "}
                      {formatReportNumber(profitTotals.totalProfitIQD)}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="table-header text-right">
                        <th className="px-4 py-3 font-semibold">التاريخ</th>
                        <th className="px-4 py-3 font-semibold">المرجع</th>
                        <th className="px-4 py-3 font-semibold">التاجر</th>
                        <th className="px-4 py-3 font-semibold">البضاعة</th>
                        <th className="px-4 py-3 font-semibold">التكلفة ($)</th>
                        <th className="px-4 py-3 font-semibold">المبلغ ($)</th>
                        <th className="px-4 py-3 font-semibold">الربح ($)</th>
                        <th className="px-4 py-3 font-semibold">الربح (د.ع)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profitRows.length === 0 ? (
                        <EmptyTableRow
                          colSpan={8}
                          message="لا توجد شحنات مطابقة."
                        />
                      ) : (
                        profitRows.map((row, index) => (
                          <tr
                            key={index}
                            onClick={() => setSelectedTx(row)}
                            className="cursor-pointer border-b border-utility-panel-border transition-colors hover:bg-utility-soft-bg-hover"
                          >
                            <td className="px-4 py-3">
                              {formatReportDate(row.TransDate)}
                            </td>
                            <td className="px-4 py-3 text-xs text-utility-muted">
                              {row.RefNo}
                            </td>
                            <td className="px-4 py-3 font-semibold text-utility-strong">
                              {row.AccountName}
                            </td>
                            <td className="px-4 py-3">
                              {row.GoodTypeName || row.GoodType || "-"}
                            </td>
                            <td className="px-4 py-3 text-utility-muted">
                              ${formatReportNumber(row.CostUSD)}
                            </td>
                            <td className="px-4 py-3">
                              ${formatReportNumber(row.AmountUSD)}
                            </td>
                            <td
                              className={`px-4 py-3 font-bold ${getProfitTone(row.ProfitUSD)}`}
                            >
                              ${formatReportNumber(row.ProfitUSD)}
                            </td>
                            <td
                              className={`px-4 py-3 ${getProfitTone(row.ProfitIQD)}`}
                            >
                              {formatReportNumber(row.ProfitIQD)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-utility-panel-border bg-utility-soft-bg font-bold">
                        <td
                          colSpan="4"
                          className="px-4 py-3 text-utility-strong"
                        >
                          المجموع
                        </td>
                        <td className="px-4 py-3 text-utility-muted">
                          ${formatReportNumber(profitTotals.totalCostUSD)}
                        </td>
                        <td className="px-4 py-3">
                          ${formatReportNumber(profitTotals.totalAmountUSD)}
                        </td>
                        <td className={`px-4 py-3 ${profitTone}`}>
                          ${formatReportNumber(profitTotals.totalProfitUSD)}
                        </td>
                        <td className={`px-4 py-3 ${profitIqdTone}`}>
                          {formatReportNumber(profitTotals.totalProfitIQD)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )
        )}

        <TransactionModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          readOnly
        />
      </div>
    </div>
  );
}

import { useMemo } from "react";
import { Receipt } from "lucide-react";
import DateRangeFilters from "../../../components/DateRangeFilters";
import EmptyTableRow from "../../../components/EmptyTableRow";
import ExportButtons from "../../../components/ExportButtons";
import LoadingSpinner from "../../../components/LoadingSpinner";
import PageHeader from "../../../components/PageHeader";
import SummaryCard from "../../../components/SummaryCard";
import {
  buildReportPrintMetaItems,
  buildExpensesSummaryCards,
  EXPENSES_EXPORT_COLUMNS,
} from "../../../utils/reportsConfig";
import { formatReportDate, formatReportNumber } from "../reportsPageHelpers";

export default function ReportsExpensesView({
  activePort,
  data,
  filters,
  loading,
  onBack,
  onFilterChange,
  onRefresh,
}) {
  const expenseSummaryCards = useMemo(
    () => buildExpensesSummaryCards(data),
    [data]
  );

  return (
    <div className="page-shell">
      <PageHeader
        title={`المصاريف - ${activePort?.name || ""}`}
        subtitle="التقارير"
        onBack={onBack}
      >
        {data?.rows?.length > 0 && (
          <ExportButtons
            inHeader
            rows={data.rows}
            columns={EXPENSES_EXPORT_COLUMNS}
            title={`المصاريف - ${activePort?.name || ""}`}
            subtitle="التقارير"
            filename={`مصاريف_${activePort?.name || ""}`}
            summaryCards={expenseSummaryCards}
            totalsRow={{
              amountUSD: data.totals.totalUSD,
              amountIQD: data.totals.totalIQD,
            }}
            printStrategy="table"
            printMetaItems={buildReportPrintMetaItems(activePort, filters)}
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
                  label="عدد المصاريف"
                  value={data.totals.count || data.rows.length}
                  tone="text-foreground"
                />
                <SummaryCard
                  label="على المنفذ ($)"
                  value={`$${formatReportNumber(data.totals.directExpenseUSD)}`}
                  tone="text-primary"
                />
                <SummaryCard
                  label="على المنفذ (د.ع)"
                  value={formatReportNumber(data.totals.directExpenseIQD)}
                  tone="text-muted-foreground"
                />
                <SummaryCard
                  label="محمل على التاجر ($)"
                  value={`$${formatReportNumber(data.totals.chargedToTraderUSD)}`}
                  tone="text-success"
                />
                <SummaryCard
                  label="محمل على التاجر (د.ع)"
                  value={formatReportNumber(data.totals.chargedToTraderIQD)}
                  tone="text-warning"
                />
              </div>

              <div className="card border border-border shadow-sm overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-border bg-secondary/20 px-5 py-3.5">
                  <span className="flex items-center gap-2 font-bold text-foreground">
                    <Receipt size={16} className="text-primary" />
                    المصاريف ({data.rows.length} معاملة)
                  </span>
                  <span className="font-bold text-primary">
                    الإجمالي: ${formatReportNumber(data.totals.totalUSD)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="table-header text-right">
                        <th className="px-4 py-3 font-semibold">التاريخ</th>
                        <th className="px-4 py-3 font-semibold">البيان</th>
                        <th className="px-4 py-3 font-semibold">التحميل</th>
                        <th className="px-4 py-3 font-semibold">التاجر</th>
                        <th className="px-4 py-3 font-semibold">المبلغ ($)</th>
                        <th className="px-4 py-3 font-semibold">
                          المبلغ (د.ع)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.length === 0 ? (
                        <EmptyTableRow
                          colSpan={6}
                          message="لا توجد مصاريف مطابقة."
                        />
                      ) : (
                        data.rows.map((row, index) => (
                          <tr
                            key={index}
                            className="border-b border-border transition-colors hover:bg-secondary/40"
                          >
                            <td className="px-4 py-3">
                              {formatReportDate(row.expenseDate)}
                            </td>
                            <td className="max-w-[260px] truncate px-4 py-3 text-xs text-muted-foreground">
                              {row.description || "-"}
                            </td>
                            <td className="px-4 py-3 font-semibold text-primary">
                              {row.chargeTarget === "trader"
                                ? "على التاجر"
                                : "على المنفذ"}
                            </td>
                            <td className="px-4 py-3 font-semibold text-foreground">
                              {row.accountName || "-"}
                            </td>
                            <td className="px-4 py-3 font-bold text-primary">
                              {row.amountUSD
                                ? `$${formatReportNumber(row.amountUSD)}`
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {row.amountIQD
                                ? formatReportNumber(row.amountIQD)
                                : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-secondary/20 font-bold">
                        <td colSpan="4" className="px-4 py-3 text-foreground">
                          المجموع
                        </td>
                        <td className="px-4 py-3 text-primary">
                          {data.totals.totalUSD
                            ? `$${formatReportNumber(data.totals.totalUSD)}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {data.totals.totalIQD
                            ? formatReportNumber(data.totals.totalIQD)
                            : "-"}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}

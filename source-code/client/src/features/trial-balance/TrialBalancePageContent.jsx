import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../../components/PageHeader";
import ExportButtons from "../../components/ExportButtons";
import useTrialBalancePageData from "./useTrialBalancePageData";
import {
  buildTrialBalanceColumns,
  buildTrialBalanceExportSummary,
  buildTrialBalanceSummaryCards,
  buildTrialBalanceTotalsRow,
  groupTrialBalanceRows,
  hasTrialBalancePeriodFilter,
} from "./trialBalanceHelpers";
import TrialBalanceFiltersBar from "./components/TrialBalanceFiltersBar";
import TrialBalanceSummaryGrid from "./components/TrialBalanceSummaryGrid";
import TrialBalanceTable from "./components/TrialBalanceTable";

export default function TrialBalancePage({ onBack }) {
  const { api } = useAuth();
  const {
    accountTypes,
    data,
    fieldConfigMap,
    filters,
    loadData,
    loading,
    error,
    ports,
    setFilters,
    visibleColumns,
  } = useTrialBalancePageData({ api });

  const columns = buildTrialBalanceColumns(visibleColumns, fieldConfigMap);
  const groupedRows = groupTrialBalanceRows(data?.rows || []);
  const summaryCards = buildTrialBalanceSummaryCards(data?.totals || {});
  const exportSummary = buildTrialBalanceExportSummary(data?.totals || {});
  const totalsRow = buildTrialBalanceTotalsRow(data?.totals || {});
  const hasPeriodFilter = hasTrialBalancePeriodFilter(filters);

  return (
    <div className="page-shell">
      <PageHeader title="ميزان المراجعة" subtitle="التقارير" onBack={onBack}>
        {data?.rows && data?.totals && (
          <ExportButtons
            inHeader
            rows={data.rows}
            columns={columns.map(column => ({
              key: column.dataKey,
              label: column.label,
              format: column.format,
            }))}
            title="ميزان المراجعة"
            filename="ميزان_المراجعة"
            summaryCards={exportSummary}
            totalsRow={totalsRow}
            printStrategy="table"
          />
        )}
      </PageHeader>

      <div className="p-5 space-y-4">
        <TrialBalanceFiltersBar
          filters={filters}
          setFilters={setFilters}
          ports={ports}
          accountTypes={accountTypes}
          onSubmit={loadData}
        />

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm font-semibold text-red-500 shadow-sm">
            {error}
          </div>
        )}

        {data?.totals && (
          <TrialBalanceSummaryGrid
            totals={data.totals}
            summaryCards={summaryCards}
            hasPeriodFilter={hasPeriodFilter}
            filters={filters}
          />
        )}

        <TrialBalanceTable
          loading={loading}
          data={data}
          columns={columns}
          groupedRows={groupedRows}
        />
      </div>
    </div>
  );
}

import { Plus } from "lucide-react";
import ExportButtons from "../../components/ExportButtons";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageHeader from "../../components/PageHeader";
import SpecialAccountFormModal from "./components/SpecialAccountFormModal";
import SpecialAccountsFiltersBar from "./components/SpecialAccountsFiltersBar";
import SpecialAccountsLandingView from "./components/SpecialAccountsLandingView";
import SpecialAccountsResultsMeta from "./components/SpecialAccountsResultsMeta";
import SpecialAccountsSummaryGrid from "./components/SpecialAccountsSummaryGrid";
import SpecialAccountsTable from "./components/SpecialAccountsTable";
import useSpecialAccountsPageState from "./useSpecialAccountsPageState";
import { useAuth } from "../../contexts/AuthContext";
import { SPECIAL_ACCOUNT_DEFS } from "../../utils/specialAccountsConfig";
import {
  getAccountHeaderActionStyle,
  getAccountMessageStyle,
} from "./specialAccountsTheme";

export default function AccountsPage({ onBack }) {
  const { api, can } = useAuth();
  const {
    activeDef,
    activeRows,
    closeForm,
    deletingId,
    derivedTotals,
    editingRecord,
    exportColumns,
    filteredRows,
    filters,
    form,
    formFields,
    handleDelete,
    handleFilterChange,
    handleFormChange,
    handleResetFilters,
    handleSave,
    loading,
    message,
    openAccount,
    openCreateModal,
    openEditModal,
    openPaymentModal,
    isPaymentMode,
    resetView,
    saving,
    showForm,
    summaryCards,
    batchOptions,
    view,
    visibleColumns,
    printContext,
    exportRows,
  } = useSpecialAccountsPageState({ api });

  if (view === "main") {
    return (
      <SpecialAccountsLandingView
        onBack={onBack}
        accounts={Object.values(SPECIAL_ACCOUNT_DEFS)}
        onOpenAccount={openAccount}
      />
    );
  }

  if (!activeDef) {
    return null;
  }

  const addButtonStyle = getAccountHeaderActionStyle(activeDef);
  const messageStyle = getAccountMessageStyle(activeDef);

  return (
    <div className="page-shell">
      <PageHeader
        title={activeDef.label}
        subtitle="حسابات خاصة"
        onBack={resetView}
      >
        {filteredRows.length > 0 &&
          derivedTotals &&
          (() => {
            const PRINT_HIDDEN = new Set(["CostUSD", "CostIQD"]);
            const printColumns = exportColumns.filter(
              col => !PRINT_HIDDEN.has(col.key)
            );
            return (
              <ExportButtons
                inHeader
                rows={exportRows}
                columns={printColumns}
                title={activeDef.label}
                subtitle="حسابات خاصة"
                filename={activeDef.label.replace(/\s+/g, "_")}
                summaryCards={
                  activeDef.buildExportSummaryCards
                    ? activeDef.buildExportSummaryCards(
                        derivedTotals,
                        activeDef.label
                      )
                    : summaryCards.map(card => ({
                        label: card.label,
                        value: card.value,
                      }))
                }
                totalsRow={activeDef.buildExportTotalsRow(derivedTotals)}
                summaryStyle={
                  activeDef.buildExportSummaryCards ? "text-lines" : undefined
                }
                printStrategy="table"
                sectionKey={activeDef.sectionKey}
                printContext={printContext}
                themeAccent={activeDef.accent}
                themeAccentSoft={activeDef.accentSoft}
              />
            );
          })()}

        {can.isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={openPaymentModal}
              className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 bg-[#d8a2a8]/10 text-[#d8a2a8] hover:bg-[#d8a2a8]/20 border border-[#d8a2a8]/20"
            >
              <Plus size={16} /> سند قبض / تسديد
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#eef3f7] transition-all duration-200 hover:-translate-y-0.5"
              style={addButtonStyle}
            >
              <Plus size={16} /> إضافة سجل
            </button>
          </div>
        )}
      </PageHeader>

      <div className="space-y-4 p-5">
        {message && (
          <div
            className="rounded-[24px] px-4 py-3 text-sm font-semibold text-[#eef3f7]"
            style={messageStyle}
          >
            {message}
          </div>
        )}

        <SpecialAccountsFiltersBar
          account={activeDef}
          batchOptions={batchOptions}
          filters={filters}
          onFieldChange={handleFilterChange}
          onApply={() => openAccount(activeDef.id)}
          onReset={handleResetFilters}
        />

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <SpecialAccountsSummaryGrid cards={summaryCards} />

            <SpecialAccountsResultsMeta
              account={activeDef}
              filteredCount={filteredRows.length}
              totalCount={activeRows.length}
              search={filters.search}
            />

            <SpecialAccountsTable
              account={activeDef}
              accountId={activeDef.id}
              visibleColumns={visibleColumns}
              rows={filteredRows}
              canEdit={can.isAdmin}
              deletingId={deletingId}
              derivedTotals={derivedTotals}
              getFooterValue={activeDef.getFooterValue}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          </>
        )}
      </div>

      {showForm && (
        <SpecialAccountFormModal
          account={activeDef}
          activeLabel={activeDef.label}
          editingRecord={editingRecord}
          formFields={formFields}
          form={form}
          saving={saving}
          isPaymentMode={isPaymentMode}
          onClose={closeForm}
          onSave={handleSave}
          onFormChange={handleFormChange}
        />
      )}
    </div>
  );
}

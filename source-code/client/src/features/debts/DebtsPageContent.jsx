import { Plus, Trash2 } from "lucide-react";
import ExportButtons from "../../components/ExportButtons";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageHeader from "../../components/PageHeader";
import DebtFiltersPanel from "./components/DebtFiltersPanel";
import DebtFormModal from "./components/DebtFormModal";
import DebtPreviewModal from "./components/DebtPreviewModal";
import DebtSummaryGrid from "./components/DebtSummaryGrid";
import DebtTable from "./components/DebtTable";
import DebtTotalsCards from "./components/DebtTotalsCards";
import useDebtsPageState from "./useDebtsPageState";
import { useAuth } from "../../contexts/AuthContext";

export default function DebtsPage({ onBack }) {
  const { api, can } = useAuth();
  const {
    accountOptions,
    accountText,
    activeColumns,
    closeForm,
    deleting,
    editingDebt,
    exportColumns,
    filteredDebts,
    filterText,
    filters,
    form,
    formFields,
    handleAccountSelect,
    handleAccountTextChange,
    handleAddAccountName,
    handleDelete,
    handleFilterDateChange,
    handleFilterSelect,
    handleFilterTextChange,
    handleFormChange,
    handleResetFilters,
    handleSave,
    handleToggleSummaryAccount,
    handleDeleteAccount,
    loading,
    message,
    openCreateModal,
    openEditModal,
    previewItems,
    saving,
    selectedDebt,
    setSelectedDebt,
    showForm,
    summaryRows,
    totals,
  } = useDebtsPageState({ api });

  return (
    <div className="page-shell">
      <PageHeader
        title="الديون"
        subtitle="قائمة الديون والحركات"
        onBack={onBack}
      >
        <div className="flex items-center gap-2">
          {can.isAdmin && filters.accountName && handleDeleteAccount && (
            <button
              onClick={() => {
                const acc = accountOptions.find(o => o.name === filters.accountName);
                if (acc && acc.id) handleDeleteAccount(acc.id);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:hover:bg-red-900/40"
              title="حذف الحساب"
            >
              <Trash2 size={16} /> حذف الحساب
            </button>
          )}
          {filteredDebts.length > 0 && (
            <ExportButtons
              inHeader
              rows={filteredDebts}
              columns={exportColumns}
              title="الديون"
              filename="الديون"
              printStrategy="table"
            />
          )}
          {can.manageDebts && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition-all hover:bg-white/20"
            >
              <Plus size={16} /> إضافة دين
            </button>
          )}
        </div>
      </PageHeader>

      <div className="space-y-5 p-5">
        {message && (
          <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800">
            {message}
          </div>
        )}

        {loading ? (
          <LoadingSpinner label="جارٍ تحميل بيانات الديون..." />
        ) : (
          <>
            <DebtTotalsCards totals={totals} />

            <DebtFiltersPanel
              filterText={filterText}
              accountOptions={accountOptions}
              filters={filters}
              onFilterTextChange={handleFilterTextChange}
              onAccountSelect={handleFilterSelect}
              onDateChange={handleFilterDateChange}
              onReset={handleResetFilters}
              onDeleteAccount={handleDeleteAccount}
            />

            <DebtSummaryGrid
              summaryRows={summaryRows}
              activeAccountName={filters.accountName}
              onToggleAccount={handleToggleSummaryAccount}
            />

            <DebtTable
              activeColumns={activeColumns}
              debts={filteredDebts}
              onSelectDebt={setSelectedDebt}
            />
          </>
        )}
      </div>

      <DebtPreviewModal
        debt={selectedDebt}
        previewItems={previewItems}
        canManageDebts={can.manageDebts}
        deleting={deleting}
        onClose={() => setSelectedDebt(null)}
        onEdit={() => openEditModal(selectedDebt)}
        onDelete={() => handleDelete(selectedDebt)}
      />

      {showForm && (
        <DebtFormModal
          editingDebt={editingDebt}
          accountText={accountText}
          accountOptions={accountOptions}
          form={form}
          formFields={formFields}
          saving={saving}
          onClose={closeForm}
          onSave={handleSave}
          onFormChange={handleFormChange}
          onAccountTextChange={handleAccountTextChange}
          onAccountSelect={handleAccountSelect}
          onAddAccountName={handleAddAccountName}
        />
      )}
    </div>
  );
}

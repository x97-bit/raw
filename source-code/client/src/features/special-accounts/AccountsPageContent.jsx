import { Plus } from 'lucide-react';
import ExportButtons from '../../components/ExportButtons';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import SpecialAccountFormModal from './components/SpecialAccountFormModal';
import SpecialAccountsFiltersBar from './components/SpecialAccountsFiltersBar';
import SpecialAccountsLandingView from './components/SpecialAccountsLandingView';
import SpecialAccountsResultsMeta from './components/SpecialAccountsResultsMeta';
import SpecialAccountsSummaryGrid from './components/SpecialAccountsSummaryGrid';
import SpecialAccountsTable from './components/SpecialAccountsTable';
import useSpecialAccountsPageState from './useSpecialAccountsPageState';
import { useAuth } from '../../contexts/AuthContext';
import { SPECIAL_ACCOUNT_DEFS } from '../../utils/specialAccountsConfig';

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
    resetView,
    saving,
    showForm,
    summaryCards,
    view,
    visibleColumns,
  } = useSpecialAccountsPageState({ api });

  if (view === 'main') {
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

  return (
    <div className="page-shell">
      <PageHeader title={activeDef.label} subtitle="حسابات خاصة" onBack={resetView}>
        {filteredRows.length > 0 && derivedTotals && (
          <ExportButtons
            inHeader
            rows={filteredRows}
            columns={exportColumns}
            title={activeDef.label}
            subtitle="حسابات خاصة"
            filename={activeDef.label.replace(/\s+/g, '_')}
            summaryCards={summaryCards.map((card) => ({ label: card.label, value: card.value }))}
            totalsRow={activeDef.buildExportTotalsRow(derivedTotals)}
            printStrategy="table"
          />
        )}
        {can.isAdmin && (
          <button onClick={openCreateModal} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition-all hover:bg-white/20">
            <Plus size={16} /> إضافة سجل
          </button>
        )}
      </PageHeader>

      <div className="space-y-4 p-5">
        {message && (
          <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800">
            {message}
          </div>
        )}

        <SpecialAccountsFiltersBar
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
              filteredCount={filteredRows.length}
              totalCount={activeRows.length}
              search={filters.search}
            />

            <SpecialAccountsTable
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
          activeLabel={activeDef.label}
          editingRecord={editingRecord}
          formFields={formFields}
          form={form}
          saving={saving}
          onClose={closeForm}
          onSave={handleSave}
          onFormChange={handleFormChange}
        />
      )}
    </div>
  );
}

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

  const addButtonStyle = {
    background: `linear-gradient(135deg, ${activeDef.accent}24 0%, rgba(18,22,28,0.96) 100%)`,
    border: `1px solid ${activeDef.accent}30`,
    boxShadow: '0 16px 34px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05)',
  };

  const messageStyle = {
    background: `linear-gradient(135deg, ${activeDef.accentSoft} 0%, rgba(18,22,28,0.94) 72%)`,
    border: `1px solid ${activeDef.accent}26`,
    boxShadow: '0 14px 28px rgba(0,0,0,0.2)',
  };

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
            themeAccent={activeDef.accent}
            themeAccentSoft={activeDef.accentSoft}
          />
        )}
        {can.isAdmin && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#eef3f7] transition-all duration-200 hover:-translate-y-0.5"
            style={addButtonStyle}
          >
            <Plus size={16} /> إضافة سجل
          </button>
        )}
      </PageHeader>

      <div className="space-y-4 p-5">
        {message && (
          <div className="rounded-[24px] px-4 py-3 text-sm font-semibold text-[#eef3f7]" style={messageStyle}>
            {message}
          </div>
        )}

        <SpecialAccountsFiltersBar
          account={activeDef}
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
          onClose={closeForm}
          onSave={handleSave}
          onFormChange={handleFormChange}
        />
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import TransactionModal from "../../components/TransactionModal";
import { useAuth } from "../../contexts/AuthContext";
import PortFormView from "./components/PortFormView";
import PortListView from "./components/PortListView";
import PortStatementSelectView from "./components/PortStatementSelectView";
import PortStatementView from "./components/PortStatementView";
import {
  PORT_PAGE_LIMIT,
  buildPortStatementQuery,
  createPortFilters,
  getPortBuiltInFieldLabel,
  getPortViewLabels,
  relabelPortColumnsForSection,
  resolvePortSectionKey,
} from "./portPageHelpers";
import {
  getPortTransactionTarget,
  buildPortAccountPayload,
} from "./portTransactionFormHelpers";
import usePortData from "./usePortData";
import usePortFieldConfig from "./usePortFieldConfig";
import usePortTransactionForm from "./usePortTransactionForm";
import useTransactionFormLayout from "../transactions/useTransactionFormLayout";
import { filterSectionsByCurrency } from "../../utils/orderedFormSections";
import {
  buildListExportTemplates,
  buildStatementExportTemplates,
  buildListScreenTemplates,
  buildStatementScreenTemplates,
} from "../../utils/portExportTemplates";
import {
  renderPortCell,
  toExportColumn,
  toPreviewColumn,
} from "../../utils/portPageColumns";
import {
  EMPTY_PORT_SUMMARY,
  formatPortSummaryValue,
  PORT_SECTION_SUMMARY_META,
} from "../../utils/portSummaryConfig";

export default function PortPage({
  portId,
  portName,
  accountType,
  initialView = "list",
  initialFormType,
  onBack,
  onHome,
}) {
  const { api, can } = useAuth();
  const [view, setView] = useState(
    initialView === "statement-select" ? "list" : initialView
  );
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [formType, setFormType] = useState(initialFormType || 1);
  const [showStatementSelect, setShowStatementSelect] = useState(
    initialView === "statement-select"
  );
  const [stAccount, setStAccount] = useState(null);
  const [statement, setStatement] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [filters, setFilters] = useState(createPortFilters());
  const [selectedListTemplateId, setSelectedListTemplateId] =
    useState("current-list");
  const [selectedStatementTemplateId, setSelectedStatementTemplateId] =
    useState("current-statement");

  const sectionKey = useMemo(
    () => resolvePortSectionKey(portId, accountType),
    [accountType, portId]
  );
  const portViewLabels = useMemo(
    () => getPortViewLabels({ sectionKey, formType }),
    [formType, sectionKey]
  );

  const {
    accounts,
    companies,
    drivers,
    goods,
    govs,
    listSummary,
    loadData,
    loadDriversVehicles,
    merchants,
    setAccounts,
    setCompanies,
    setMerchants,
    total,
    transactions,
    vehicles,
  } = usePortData({
    api,
    portId,
    accountType,
    filters,
    search,
    page,
  });

  const {
    activeFormCustomFields,
    activeFormFieldConfigMap,
    activeFormTarget,
    getFieldConfigMap,
    getVisibleCustomFieldsForTarget,
    getVisibleFormulaFieldsForTarget,
    viewColumns,
  } = usePortFieldConfig({
    api,
    sectionKey,
    formType,
  });

  const {
    editableCustomFields,
    visibleBuiltInFieldKeys: visibleBuiltInFormFieldKeys,
    orderedSections: orderedFormSections,
    getBuiltInFieldLabel: getBuiltInFormFieldLabel,
  } = useTransactionFormLayout({
    sectionKey,
    formTarget: activeFormTarget,
    fieldConfigMap: activeFormFieldConfigMap,
    customFields: activeFormCustomFields,
    fallbackTitle: "تفاصيل الحركة",
    fallbackSubtitle: "اعرض الحقول حسب ترتيب إدارة الحقول",
  });
  const getScopedBuiltInFormFieldLabel = useCallback(
    (fieldKey, fallbackLabel) =>
      getPortBuiltInFieldLabel(
        sectionKey,
        fieldKey,
        formType,
        getBuiltInFormFieldLabel(fieldKey, fallbackLabel)
      ),
    [formType, getBuiltInFormFieldLabel, sectionKey]
  );

  const transactionFormState = usePortTransactionForm({
    api,
    accountType,
    portId,
    sectionKey,
    formType,
    setFormType,
    initialView,
    initialFormType,
    view,
    setView,
    onAfterSave: async () => {
      if (onBack) {
        onBack();
        return;
      }
      setView("list");
      await loadData();
    },
    loadData,
    loadDriversVehicles,
    accounts,
    setAccounts,
    merchants,
    setMerchants,
    drivers,
    vehicles,
    goods,
    govs,
    companies,
    setCompanies,
    editableCustomFields,
    visibleBuiltInFieldKeys: visibleBuiltInFormFieldKeys,
    getBuiltInFormFieldLabel: getScopedBuiltInFormFieldLabel,
    getVisibleCustomFieldsForTarget,
  });

  const filteredFormSections = useMemo(
    () =>
      filterSectionsByCurrency(
        orderedFormSections,
        transactionFormState.form?.Currency
      ),
    [orderedFormSections, transactionFormState.form?.Currency]
  );

  const listSummaryCards = useMemo(() => {
    const summaryMeta = PORT_SECTION_SUMMARY_META[sectionKey]?.list || [];
    return summaryMeta.map(card => ({
      ...card,
      value: formatPortSummaryValue(listSummary?.[card.key] || 0, card.format),
    }));
  }, [listSummary, sectionKey]);

  const statementSummaryCards = useMemo(() => {
    const summaryMeta = PORT_SECTION_SUMMARY_META[sectionKey]?.statement || [];
    const totals = statement?.totals || EMPTY_PORT_SUMMARY;
    return summaryMeta.map(card => ({
      ...card,
      value: formatPortSummaryValue(totals?.[card.key] || 0, card.format),
    }));
  }, [sectionKey, statement]);

  const statementSummaryGridClass = useMemo(() => {
    const count = statementSummaryCards.length;
    if (count <= 1) return "mb-5 grid grid-cols-1 gap-4";
    if (count === 2) return "mb-5 grid grid-cols-1 gap-4 md:grid-cols-2";
    if (count === 3) return "mb-5 grid grid-cols-1 gap-4 md:grid-cols-3";
    return "mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4";
  }, [statementSummaryCards.length]);

  const activeListColumnsBase = useMemo(
    () => relabelPortColumnsForSection(viewColumns.list || [], sectionKey),
    [sectionKey, viewColumns.list]
  );
  const activeStatementColumnsBase = useMemo(
    () => relabelPortColumnsForSection(viewColumns.statement || [], sectionKey),
    [sectionKey, viewColumns.statement]
  );

  const listExportColumns = useMemo(
    () =>
      activeListColumnsBase.map(column =>
        toExportColumn(column, { sectionKey })
      ),
    [activeListColumnsBase, sectionKey]
  );
  const statementExportColumns = useMemo(
    () =>
      activeStatementColumnsBase.map(column =>
        toExportColumn(column, { sectionKey })
      ),
    [activeStatementColumnsBase, sectionKey]
  );

  // Screen templates include ALL columns (cost_usd, cost_iqd visible on screen)
  const listScreenTemplates = useMemo(
    () => buildListScreenTemplates(sectionKey, listExportColumns, portName),
    [listExportColumns, portName, sectionKey]
  );
  const statementScreenTemplates = useMemo(
    () =>
      buildStatementScreenTemplates(
        sectionKey,
        statementExportColumns,
        statement?.account?.AccountName || ""
      ),
    [sectionKey, statement?.account?.AccountName, statementExportColumns]
  );

  // Print/PDF templates strip cost columns
  const listExportTemplates = useMemo(
    () => buildListExportTemplates(sectionKey, listExportColumns, portName),
    [listExportColumns, portName, sectionKey]
  );
  const statementExportTemplates = useMemo(
    () =>
      buildStatementExportTemplates(
        sectionKey,
        statementExportColumns,
        statement?.account?.AccountName || ""
      ),
    [sectionKey, statement?.account?.AccountName, statementExportColumns]
  );

  // Screen display uses screen templates (cost columns included)
  const activeListScreenTemplate = useMemo(
    () =>
      listScreenTemplates.find(t => t.id === selectedListTemplateId) ||
      listScreenTemplates[0],
    [listScreenTemplates, selectedListTemplateId]
  );
  const activeStatementScreenTemplate = useMemo(
    () =>
      statementScreenTemplates.find(
        t => t.id === selectedStatementTemplateId
      ) || statementScreenTemplates[0],
    [selectedStatementTemplateId, statementScreenTemplates]
  );

  const activeListColumns = useMemo(
    () => (activeListScreenTemplate?.columns || []).map(toPreviewColumn),
    [activeListScreenTemplate]
  );
  const activeStatementColumns = useMemo(
    () => (activeStatementScreenTemplate?.columns || []).map(toPreviewColumn),
    [activeStatementScreenTemplate]
  );

  useEffect(() => {
    if (
      !listExportTemplates.find(
        template => template.id === selectedListTemplateId
      )
    ) {
      setSelectedListTemplateId(listExportTemplates[0]?.id || "current-list");
    }
  }, [listExportTemplates, selectedListTemplateId]);

  useEffect(() => {
    if (
      !statementExportTemplates.find(
        template => template.id === selectedStatementTemplateId
      )
    ) {
      setSelectedStatementTemplateId(
        statementExportTemplates[0]?.id || "current-statement"
      );
    }
  }, [selectedStatementTemplateId, statementExportTemplates]);

  const openStatement = useCallback(
    async accountId => {
      if (!accountId) return;

      const normalizedAccountId = String(accountId);
      setStAccount(normalizedAccountId);
      setFilters(current => ({ ...current, accountId: normalizedAccountId }));
      setShowStatementSelect(false);

      try {
        const query = buildPortStatementQuery({
          portId,
          accountType,
          from: filters.from,
          to: filters.to,
          by: undefined,
        });
        const statementResponse = await api(
          `/reports/account-statement/${normalizedAccountId}${query ? `?${query}` : ""}`
        );
        setStatement(statementResponse);
        setView("statement");
      } catch (error) {
        console.error(error);
      }
    },
    [accountType, api, filters.from, filters.to, portId, sectionKey]
  );

  const statementFilterAccountId = String(
    filters.accountId || stAccount || statement?.account?.AccountID || ""
  );

  const resetStatementFilters = useCallback(() => {
    const fallbackAccountId = String(
      stAccount || statement?.account?.AccountID || ""
    );
    setFilters(createPortFilters(fallbackAccountId));
  }, [stAccount, statement?.account?.AccountID]);

  const getTransactionCustomFields = useCallback(
    transaction => {
      if (!transaction) return [];
      const target = getPortTransactionTarget(transaction);
      return [
        ...getVisibleCustomFieldsForTarget(target),
        ...getVisibleFormulaFieldsForTarget(target),
      ];
    },
    [getVisibleCustomFieldsForTarget, getVisibleFormulaFieldsForTarget]
  );

  const selectedTransactionTarget = selectedTx
    ? getPortTransactionTarget(selectedTx)
    : "payment";

  const selectedTransactionModal = (
    <TransactionModal
      transaction={selectedTx}
      accounts={accounts}
      customFields={getTransactionCustomFields(selectedTx)}
      sectionKey={sectionKey}
      fieldConfigMap={getFieldConfigMap(selectedTransactionTarget)}
      companies={companies}
      goods={goods}
      drivers={drivers}
      vehicles={vehicles}
      govs={govs}
      accountType={accountType}
      portId={portId}
      onClose={() => setSelectedTx(null)}
      onUpdate={
        can.editTransaction
          ? async transactionForm => {
              const didUpdate =
                await transactionFormState.handleUpdate(transactionForm);
              if (didUpdate) setSelectedTx(null);
            }
          : null
      }
      onDelete={
        can.deleteTransaction
          ? async id => {
              const didDelete = await transactionFormState.handleDelete(id);
              if (didDelete) setSelectedTx(null);
            }
          : null
      }
    />
  );

  const handlePageBack = useCallback(() => {
    if (onBack) onBack();
    else setView("list");
  }, [onBack]);

  const handleListSearchChange = useCallback(value => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleListAccountFilterChange = useCallback(value => {
    setFilters(current => ({ ...current, accountId: value }));
    setPage(0);
  }, []);

  const handleAddAccount = useCallback(
    async name => {
      const traderName = String(name || "").trim();
      if (!traderName) return null;

      try {
        const response = await api("/accounts", {
          method: "POST",
          body: JSON.stringify(
            buildPortAccountPayload({
              traderText: traderName,
              accountType,
              portId,
            })
          ),
        });

        const accountEntry = {
          AccountID: response.id,
          AccountName: traderName,
        };

        setAccounts(current =>
          current.some(
            account =>
              String(account.AccountID) === String(accountEntry.AccountID)
          )
            ? current
            : [...current, accountEntry]
        );

        return accountEntry;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    [accountType, api, portId, setAccounts]
  );


  const handleListFromChange = useCallback(value => {
    setFilters(current => ({ ...current, from: value }));
    setPage(0);
  }, []);

  const handleListToChange = useCallback(value => {
    setFilters(current => ({ ...current, to: value }));
    setPage(0);
  }, []);

  const handleListResetFilters = useCallback(() => {
    setFilters(createPortFilters());
    setPage(0);
  }, []);

  const handleStatementAccountChange = useCallback(value => {
    setFilters(current => ({ ...current, accountId: value }));
  }, []);

  const handleStatementFromChange = useCallback(value => {
    setFilters(current => ({ ...current, from: value }));
  }, []);

  const handleStatementToChange = useCallback(value => {
    setFilters(current => ({ ...current, to: value }));
  }, []);

  const handleOpenStatementFromFilters = useCallback(() => {
    if (filters.accountId) openStatement(filters.accountId);
  }, [filters.accountId, openStatement]);

  const handleRefreshStatement = useCallback(() => {
    if (statementFilterAccountId) openStatement(statementFilterAccountId);
  }, [openStatement, statementFilterAccountId]);

  const handleStatementSelectAccount = useCallback(
    accountId => {
      setShowStatementSelect(false);
      openStatement(accountId);
    },
    [openStatement]
  );

  if (
    showStatementSelect ||
    (view === "list" && initialView === "statement-select")
  ) {
    return (
      <PortStatementSelectView
        portName={portName}
        onBack={onBack}
        onHome={onHome}
        accounts={accounts}
        statementFilterAccountId={statementFilterAccountId}
        from={filters.from}
        to={filters.to}
        search={search}
        onAccountChange={handleStatementAccountChange}
        onAddAccount={handleAddAccount}
        onFromChange={handleStatementFromChange}
        onToChange={handleStatementToChange}
        onReset={resetStatementFilters}
        onOpenStatement={handleRefreshStatement}
        onSearchChange={setSearch}
        onSelectAccount={handleStatementSelectAccount}
        portViewLabels={portViewLabels}
        sectionKey={sectionKey}
      />
    );
  }

  if (view === "list") {
    return (
      <PortListView
        portName={portName}
        total={total}
        onBack={onBack}
        onHome={onHome}
        transactions={transactions}
        message={transactionFormState.message}
        search={search}
        page={page}
        limit={PORT_PAGE_LIMIT}
        filters={filters}
        accounts={accounts}
        listSummaryCards={listSummaryCards}
        activeListColumns={activeListColumns}
        renderPortCell={(column, row) =>
          renderPortCell(column, row, { sectionKey })
        }
        onSearchChange={handleListSearchChange}
        onAccountFilterChange={handleListAccountFilterChange}
        onAddAccount={handleAddAccount}
        onFromChange={handleListFromChange}
        onToChange={handleListToChange}
        onResetFilters={handleListResetFilters}
        onOpenStatement={handleOpenStatementFromFilters}
        onOpenInvoiceForm={() => transactionFormState.openForm(1)}
        onOpenDebitForm={() => transactionFormState.openForm(3)}
        onOpenPaymentForm={() => transactionFormState.openForm(2)}
        onPreviousPage={() => setPage(current => Math.max(0, current - 1))}
        onNextPage={() => setPage(current => current + 1)}
        onSelectTransaction={setSelectedTx}
        transactionModal={selectedTransactionModal}
        canAddInvoice={can.addInvoice}
        canAddPayment={can.addPayment}
        listExportColumns={listExportColumns}
        listExportTemplates={listExportTemplates}
        selectedListTemplateId={selectedListTemplateId}
        onTemplateChange={setSelectedListTemplateId}
        sectionKey={sectionKey}
        portViewLabels={portViewLabels}
      />
    );
  }

  if (view === "form") {
    return (
      <PortFormView
        formType={formType}
        portName={portName}
        sectionKey={sectionKey}
        onBack={handlePageBack}
        onHome={onHome}
        message={transactionFormState.message}
        orderedFormSections={filteredFormSections}
        renderOrderedFormItem={transactionFormState.renderOrderedFormItem}
        canManageDefaults={can.isAdmin}
        form={transactionFormState.form}
        saving={transactionFormState.saving}
        savingAccountDefaults={transactionFormState.savingAccountDefaults}
        savingRouteDefaults={transactionFormState.savingRouteDefaults}
        onSaveAccountDefaults={transactionFormState.handleSaveAccountDefaults}
        onSaveRouteDefaults={transactionFormState.handleSaveRouteDefaults}
        onSave={transactionFormState.handleSave}
        portViewLabels={portViewLabels}
      />
    );
  }

  if (view === "statement" && statement) {
    return (
      <PortStatementView
        statement={statement}
        portName={portName}
        onBack={handlePageBack}
        onHome={onHome}
        accounts={accounts}
        statementFilterAccountId={statementFilterAccountId}
        from={filters.from}
        to={filters.to}
        onAccountChange={handleStatementAccountChange}
        onAddAccount={handleAddAccount}
        onFromChange={handleStatementFromChange}
        onToChange={handleStatementToChange}
        onReset={resetStatementFilters}
        onRefresh={handleRefreshStatement}
        statementSummaryCards={statementSummaryCards}
        statementSummaryGridClass={statementSummaryGridClass}
        statementExportColumns={statementExportColumns}
        statementExportTemplates={statementExportTemplates}
        selectedStatementTemplateId={selectedStatementTemplateId}
        onTemplateChange={setSelectedStatementTemplateId}
        sectionKey={sectionKey}
        activeStatementColumns={activeStatementColumns}
        renderPortCell={(column, row) =>
          renderPortCell(column, row, { sectionKey })
        }
        onSelectTransaction={setSelectedTx}
        transactionModal={selectedTransactionModal}
        portViewLabels={portViewLabels}
      />
    );
  }

  return null;
}

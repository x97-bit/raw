import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import ExportButtons from "../../../components/ExportButtons";
import PageHeader from "../../../components/PageHeader";
import PortAccountDateFilters from "./PortAccountDateFilters";
import PortSummaryCardsGrid from "./PortSummaryCardsGrid";

export default function PortListView({
  portName,
  total,
  onBack,
  onHome,
  transactions,
  message,
  search,
  page,
  limit,
  filters,
  accounts,
  listSummaryCards,
  activeListColumns,
  renderPortCell,
  onSearchChange,
  onAccountFilterChange,
  onAddAccount,
  onFromChange,
  onToChange,
  onResetFilters,
  onOpenStatement,
  onOpenInvoiceForm,
  onOpenDebitForm,
  onOpenPaymentForm,
  onPreviousPage,
  onNextPage,
  onSelectTransaction,
  transactionModal,
  canAddInvoice,
  canAddPayment,
  listExportColumns,
  listExportTemplates,
  selectedListTemplateId,
  onTemplateChange,
  sectionKey,
  portViewLabels,
}) {
  const labels = portViewLabels || {};
  const isTransport = sectionKey === "transport-1";
  const listTitle = `${portName} - ${labels.listTitleSuffix || "قائمة الحركات"}`;
  const actionButtons = [];

  if (isTransport) {
    if (canAddPayment) {
      actionButtons.push(
        <button
          key="payment"
          onClick={onOpenPaymentForm}
          className="flex items-center gap-1.5 rounded-xl bg-utility-success-bg px-3.5 py-2 text-sm font-medium text-utility-success-text ring-1 ring-utility-success-border transition-all hover:bg-utility-success-bg-strong"
        >
          <CreditCard size={16} />
          {labels.paymentLabel || "سند قبض"}
        </button>
      );
    }

    if (canAddInvoice) {
      actionButtons.push(
        <button
          key="invoice"
          onClick={onOpenInvoiceForm}
          className="flex items-center gap-1.5 rounded-xl bg-utility-soft-bg px-3.5 py-2 text-sm font-medium text-utility-strong hover:bg-utility-soft-bg-hover transition-all"
        >
          <Plus size={16} />
          {labels.invoiceLabel || "فاتورة"}
        </button>
      );
    }
  } else {
    if (canAddInvoice) {
      actionButtons.push(
        <button
          key="invoice"
          onClick={onOpenInvoiceForm}
          className="flex items-center gap-1.5 rounded-xl bg-utility-soft-bg px-3.5 py-2 text-sm font-medium text-utility-strong hover:bg-utility-soft-bg-hover transition-all"
        >
          <Plus size={16} />
          {labels.invoiceLabel || "فاتورة"}
        </button>
      );

      actionButtons.push(
        <button
          key="debit"
          onClick={onOpenDebitForm}
          className="flex items-center gap-1.5 rounded-xl bg-utility-warning-bg px-3.5 py-2 text-sm font-medium text-utility-warning-text ring-1 ring-utility-warning-border transition-all hover:bg-utility-warning-bg-strong"
        >
          <Plus size={16} />
          {labels.debitLabel || "سند إضافة"}
        </button>
      );
    }

    if (canAddPayment) {
      actionButtons.push(
        <button
          key="payment"
          onClick={onOpenPaymentForm}
          className="flex items-center gap-1.5 rounded-xl bg-utility-success-bg px-3.5 py-2 text-sm font-medium text-utility-success-text ring-1 ring-utility-success-border transition-all hover:bg-utility-success-bg-strong"
        >
          <CreditCard size={16} />
          {labels.paymentLabel || "سند قبض"}
        </button>
      );
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        title={listTitle}
        subtitle={`${total} معاملة`}
        onBack={onBack}
        onHome={onHome}
      >
        <div className="flex items-center gap-2">

          <ExportButtons
            inHeader
            rows={transactions}
            columns={listExportColumns}
            title={listTitle}
            subtitle={`${total} معاملة`}
            filename={`${portName}_${labels.listTitleSuffix || "قائمة_الحركات"}`}
            summaryCards={listSummaryCards.map(card => ({
              label: card.label,
              value: card.value,
            }))}
            templates={listExportTemplates}
            selectedTemplateId={selectedListTemplateId}
            onTemplateChange={onTemplateChange}
            printStrategy="table"
            sectionKey={sectionKey}
          />
          {actionButtons}
        </div>
      </PageHeader>

      <div className="space-y-4 p-5">
        {message && (
          <div className="rounded-[22px] border border-utility-success-border bg-utility-success-bg px-4 py-3 text-utility-success-text shadow-sm">
            {message}
          </div>
        )}

        <div className="relative">
          <Search
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-utility-muted"
          />
          <input
            type="text"
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            className="input-field pr-10"
            placeholder={`ابحث بالمرجع أو الملاحظات أو اسم ${isTransport ? "الناقل" : "التاجر"}...`}
          />
        </div>

        <PortAccountDateFilters
          accounts={accounts}
          accountId={filters.accountId}
          onAddAccount={onAddAccount}
          from={filters.from}
          to={filters.to}
          onAccountChange={onAccountFilterChange}
          onFromChange={onFromChange}
          onToChange={onToChange}
          onReset={onResetFilters}
          onStatement={onOpenStatement}
          statementDisabled={!filters.accountId}
          statementButtonLabel={labels.statementButtonLabel}
          accountLabel={isTransport ? "الناقل" : "التاجر"}
        />

        <PortSummaryCardsGrid cards={listSummaryCards} />

        <div className="surface-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr className="text-right">
                  {activeListColumns.map(column => (
                    <th
                      key={column.key}
                      className={`whitespace-nowrap px-3 py-3 ${column.type === "date" || column.key === "trans_date" ? "min-w-[110px] text-center" : ""}`}
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="w-8 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => {
                  let typeId = Number(
                    transaction.TransTypeID || transaction.transTypeId || 0
                  );
                  const rt = String(
                    transaction.RecordType || transaction.recordType || ""
                  ).toLowerCase();
                  const tn = String(
                    transaction.TransTypeName || transaction.transTypeName || ""
                  ).toLowerCase();

                  if (
                    rt === "invoice" ||
                    tn.includes("فاتورة") ||
                    tn.includes("استحقاق") ||
                    tn === "invoice"
                  )
                    typeId = 1;
                  else if (
                    rt === "payment" ||
                    tn.includes("قبض") ||
                    tn.includes("دفع") ||
                    tn === "payment"
                  )
                    typeId = 2;
                  else if (
                    rt === "debit-note" ||
                    tn.includes("إضافة") ||
                    tn.includes("اضافة")
                  )
                    typeId = 3;
                  else if (transaction.ShipID || transaction.shipment_id)
                    typeId = 1;

                  return (
                    <tr
                      key={transaction.TransID}
                      onClick={() => onSelectTransaction(transaction)}
                      className={`group cursor-pointer border-b border-utility-panel-border transition-colors ${
                        typeId === 1
                          ? "border-r-4 border-r-slate-500 hover:!bg-utility-soft-bg-hover"
                          : typeId === 2
                            ? "border-r-4 border-r-red-500 !bg-red-50 hover:!bg-red-100 dark:!bg-red-900/20 dark:hover:!bg-red-900/40"
                            : typeId === 3
                              ? "border-r-4 border-r-green-600 hover:!bg-utility-soft-bg-hover"
                              : "hover:!bg-utility-soft-bg-hover"
                      }`}
                    >
                      {activeListColumns.map(column => (
                        <td
                          key={column.key}
                          className={`px-3 py-2 ${column.type === "date" || column.key === "trans_date" ? "whitespace-nowrap min-w-[110px] text-center" : ""}`}
                        >
                          {renderPortCell(column, transaction)}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <Eye
                          size={14}
                          className="text-utility-muted transition-colors group-hover:text-utility-strong"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-utility-panel-border bg-utility-soft-bg px-4 py-3">
            <p className="text-sm text-utility-muted">
              عرض {page * limit + 1} - {Math.min((page + 1) * limit, total)} من{" "}
              {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onPreviousPage}
                disabled={page === 0}
                className="btn-outline px-3 py-1.5 text-sm disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={onNextPage}
                disabled={(page + 1) * limit >= total}
                className="btn-outline px-3 py-1.5 text-sm disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {transactionModal}
    </div>
  );
}

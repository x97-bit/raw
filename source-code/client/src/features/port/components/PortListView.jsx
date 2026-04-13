import { ChevronLeft, ChevronRight, CreditCard, Eye, Plus, Search } from 'lucide-react';
import ExportButtons from '../../../components/ExportButtons';
import PageHeader from '../../../components/PageHeader';
import PortAccountDateFilters from './PortAccountDateFilters';
import PortSummaryCardsGrid from './PortSummaryCardsGrid';

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
  const isTransport = sectionKey === 'transport-1';
  const listTitle = `${portName} - ${labels.listTitleSuffix || 'قائمة الحركات'}`;
  const actionButtons = [];

  if (isTransport) {
    if (canAddPayment) {
      actionButtons.push(
        <button
          key="payment"
          onClick={onOpenPaymentForm}
          className="flex items-center gap-1.5 rounded-xl bg-[#8eb8ad]/[0.18] px-3.5 py-2 text-sm font-medium text-[#dceee8] ring-1 ring-[#8eb8ad]/[0.22] transition-all hover:bg-[#8eb8ad]/[0.24]"
        >
          <CreditCard size={16} />
          {labels.paymentLabel || 'سند قبض'}
        </button>,
      );
    }

    if (canAddInvoice) {
      actionButtons.push(
        <button
          key="invoice"
          onClick={onOpenInvoiceForm}
          className="flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-3.5 py-2 text-sm font-medium text-[#dce8f2] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:bg-white/[0.1]"
        >
          <Plus size={16} />
          {labels.invoiceLabel || 'فاتورة'}
        </button>,
      );
    }
  } else {
    if (canAddInvoice) {
      actionButtons.push(
        <button
          key="invoice"
          onClick={onOpenInvoiceForm}
          className="flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-3.5 py-2 text-sm font-medium text-[#dce8f2] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:bg-white/[0.1]"
        >
          <Plus size={16} />
          {labels.invoiceLabel || 'فاتورة'}
        </button>,
      );
    }

    if (canAddPayment) {
      actionButtons.push(
        <button
          key="payment"
          onClick={onOpenPaymentForm}
          className="flex items-center gap-1.5 rounded-xl bg-[#8eb8ad]/[0.16] px-3.5 py-2 text-sm font-medium text-[#dceee8] ring-1 ring-[#8eb8ad]/[0.2] transition-all hover:bg-[#8eb8ad]/[0.22]"
        >
          <CreditCard size={16} />
          {labels.paymentLabel || 'سند قبض'}
        </button>,
      );
    }
  }

  return (
    <div className="page-shell">
      <PageHeader title={listTitle} subtitle={`${total} معاملة`} onBack={onBack} onHome={onHome}>
        <ExportButtons
          inHeader
          rows={transactions}
          columns={listExportColumns}
          title={listTitle}
          subtitle={`${total} معاملة`}
          filename={`${portName}_${labels.listTitleSuffix || 'قائمة_الحركات'}`}
          summaryCards={listSummaryCards.map((card) => ({ label: card.label, value: card.value }))}
          templates={listExportTemplates}
          selectedTemplateId={selectedListTemplateId}
          onTemplateChange={onTemplateChange}
          printStrategy="table"
          sectionKey={sectionKey}
        />
        {actionButtons}
      </PageHeader>

      <div className="space-y-4 p-5">
        {message && (
          <div className="rounded-[22px] border border-white/[0.06] bg-[#8eb8ad]/[0.08] px-4 py-3 text-[#dceee8] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            {message}
          </div>
        )}

        <div className="relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#91a0ad]" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="input-field pr-10"
            placeholder="ابحث بالمرجع أو الملاحظات أو اسم التاجر..."
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
        />

        <PortSummaryCardsGrid cards={listSummaryCards} />

        <div className="surface-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                  {activeListColumns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-3 py-3">
                      {column.label}
                    </th>
                  ))}
                  <th className="w-8 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.TransID}
                    onClick={() => onSelectTransaction(transaction)}
                    className="group cursor-pointer border-b border-white/[0.05] transition-colors hover:bg-white/[0.04]"
                  >
                    {activeListColumns.map((column) => (
                      <td key={column.key} className={`px-3 py-2 ${column.type === 'date' ? 'whitespace-nowrap' : ''}`}>
                        {renderPortCell(column, transaction)}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <Eye size={14} className="text-[#64727f] transition-colors group-hover:text-[#dce8f2]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.03] px-4 py-3">
            <p className="text-sm text-[#91a0ad]">
              عرض {page * limit + 1} - {Math.min((page + 1) * limit, total)} من {total}
            </p>
            <div className="flex gap-2">
              <button onClick={onPreviousPage} disabled={page === 0} className="btn-outline px-3 py-1.5 text-sm disabled:opacity-50">
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

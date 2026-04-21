import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import ExportButtons from '../../../components/ExportButtons';
import PageHeader from '../../../components/PageHeader';
import PortAccountDateFilters from './PortAccountDateFilters';
import PortSummaryCardsGrid from './PortSummaryCardsGrid';
import { getPortStatementFooterCell } from '../portPageHelpers';

export default function PortStatementView({
  statement,
  portName,
  onBack,
  onHome,
  accounts,
  statementFilterAccountId,
  from,
  to,
  onAccountChange,
  onAddAccount,
  onFromChange,
  onToChange,
  onReset,
  onRefresh,
  statementSummaryCards,
  statementSummaryGridClass,
  statementExportColumns,
  statementExportTemplates,
  selectedStatementTemplateId,
  onTemplateChange,
  sectionKey,
  activeStatementColumns,
  renderPortCell,
  onSelectTransaction,
  transactionModal,
  portViewLabels,
}) {
  const [localSearch, setLocalSearch] = useState('');
  const labels = portViewLabels || {};
  const statementTitle = `${labels.statementTitlePrefix || 'كشف حساب'} - ${statement.account.AccountName}`;

  return (
    <div className="page-shell">
      <PageHeader
        title={statementTitle}
        subtitle={portName}
        onBack={onBack}
        onHome={onHome}
      >
        <ExportButtons
          inHeader
          rows={statement.statement}
          columns={statementExportColumns}
          title={statementTitle}
          subtitle=""
          filename={`${labels.statementTitlePrefix || 'كشف_حساب'}_${statement.account.AccountName}`}
          totalsRow={{ AmountUSD: statement.totals?.balanceUSD, AmountIQD: statement.totals?.balanceIQD }}
          templates={statementExportTemplates}
          selectedTemplateId={selectedStatementTemplateId}
          onTemplateChange={onTemplateChange}
          printStrategy="table"
          printContext={{
            accountName: statement.account.AccountName,
            fromDate: from,
            toDate: to,
            totals: statement.totals,
          }}
          sectionKey={sectionKey}
        />
      </PageHeader>

      <div className="px-3 py-4 md:px-5 lg:px-6 xl:px-8 2xl:px-10">
        <div className="mb-5">
          <PortAccountDateFilters
            accounts={accounts}
            accountId={statementFilterAccountId}
            onAddAccount={onAddAccount}
            from={from}
            to={to}
            onAccountChange={onAccountChange}
            onFromChange={onFromChange}
            onToChange={onToChange}
            onReset={onReset}
            onStatement={onRefresh}
            statementDisabled={!statementFilterAccountId}
            resetLabel="مسح التواريخ"
            statementButtonLabel={labels.statementRefreshLabel || 'تحديث كشف الحساب'}
          />
        </div>

        <PortSummaryCardsGrid cards={statementSummaryCards} className={statementSummaryGridClass} />

        <div className="surface-card overflow-hidden p-0">
          <div className="border-b border-panel-border p-3 md:p-4 bg-utility-soft-bg flex items-center justify-between">
            <div className="relative w-full md:w-1/3">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-utility-muted" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="تصفية حسب التاجر أو الملاحظات..."
                className="input-field pr-10"
              />
            </div>
            <div className="text-sm font-medium text-utility-muted ml-2">
              تصفية الكشف
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full w-max text-sm lg:text-[0.95rem]">
              <thead>
                <tr className="bg-panel-border/20 border-b border-panel-border text-right">
                  {activeStatementColumns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-3 py-3 text-panel-text">{column.label}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {(statement.statement || []).filter((transaction) => {
                  if (!localSearch) return true;
                  const term = localSearch.toLowerCase();
                  return (
                    String(transaction.TraderNote || '').toLowerCase().includes(term) ||
                    String(transaction.Notes || '').toLowerCase().includes(term) ||
                    String(transaction.RefNo || '').toLowerCase().includes(term)
                  );
                }).map((transaction, index) => {
                  let typeId = Number(transaction.TransTypeID || transaction.transTypeId || 0);
                  const rt = String(transaction.RecordType || transaction.recordType || '').toLowerCase();
                  const tn = String(transaction.TransTypeName || transaction.transTypeName || '').toLowerCase();
                  
                  if (rt === 'invoice' || tn.includes('فاتورة') || tn.includes('استحقاق') || tn === 'invoice') typeId = 1;
                  else if (rt === 'payment' || tn.includes('قبض') || tn.includes('دفع') || tn === 'payment') typeId = 2;
                  else if (rt === 'debit-note' || tn.includes('إضافة') || tn.includes('اضافة')) typeId = 3;
                  else if (transaction.ShipID || transaction.shipment_id) typeId = 1;

                  return (
                    <tr
                      key={index}
                      onClick={() => onSelectTransaction(transaction)}
                      className={`cursor-pointer border-b border-panel-border transition-colors ${
                        typeId === 1
                          ? 'border-r-4 border-r-utility-warning-text !bg-utility-warning-bg hover:!bg-utility-warning-bg-strong'
                          : typeId === 2
                            ? 'border-r-4 border-r-utility-success-text !bg-utility-success-bg hover:!bg-utility-success-bg-strong'
                            : typeId === 3
                              ? 'border-r-4 border-r-utility-danger-text !bg-utility-danger-bg hover:!bg-utility-danger-bg-strong'
                              : 'hover:bg-row-hover'
                      }`}
                    >
                    {activeStatementColumns.map((column) => (
                      <td key={column.key} className={`px-3 py-2 align-top ${column.type === 'date' ? 'whitespace-nowrap' : ''}`}>{renderPortCell(column, transaction)}</td>
                    ))}
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="border-t-2 border-panel-border bg-panel-border/10 font-bold text-panel-text">
                  {activeStatementColumns.map((column, index) => {
                    const footer = getPortStatementFooterCell(column, index, statement.totals, { sectionKey });
                    return (
                      <td key={column.key} className={footer.className}>
                        {footer.value}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {transactionModal}
      </div>
    </div>
  );
}

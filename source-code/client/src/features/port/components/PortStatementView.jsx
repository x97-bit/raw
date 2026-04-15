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
          subtitle={portName}
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
          <div className="overflow-x-auto">
            <table className="min-w-full w-max text-sm lg:text-[0.95rem]">
              <thead>
                <tr className="bg-gradient-to-r from-[#0f2744] to-[#1a3a5c] text-right">
                  {activeStatementColumns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-3 py-3">{column.label}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {(statement.statement || []).map((transaction, index) => (
                  <tr
                    key={index}
                    onClick={() => onSelectTransaction(transaction)}
                    className={`cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.04] ${
                      transaction.TransTypeID === 2
                        ? 'bg-[#8eb8ad]/[0.05]'
                        : transaction.TransTypeID === 3
                          ? 'bg-[#d6b36b]/[0.07]'
                          : ''
                    }`}
                  >
                    {activeStatementColumns.map((column) => (
                      <td key={column.key} className={`px-3 py-2 align-top ${column.type === 'date' ? 'whitespace-nowrap' : ''}`}>{renderPortCell(column, transaction)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="border-t border-white/[0.08] bg-white/[0.05] font-bold">
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

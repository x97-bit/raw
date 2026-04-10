import PageHeader from '../../../components/PageHeader';
import PortAccountDateFilters from './PortAccountDateFilters';
import PortStatementAccountPicker from './PortStatementAccountPicker';

export default function PortStatementSelectView({
  portName,
  onBack,
  onHome,
  accounts,
  statementFilterAccountId,
  from,
  to,
  search,
  onAccountChange,
  onAddAccount,
  onFromChange,
  onToChange,
  onReset,
  onOpenStatement,
  onSearchChange,
  onSelectAccount,
  portViewLabels,
}) {
  const labels = portViewLabels || {};
  const statementTitle = `${labels.statementTitlePrefix || 'كشف حساب'} - ${portName}`;

  return (
    <div className="page-shell">
      <PageHeader title={statementTitle} subtitle={portName} onBack={onBack} onHome={onHome} />
      <div className="p-5">
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
          onStatement={onOpenStatement}
          statementDisabled={!statementFilterAccountId}
          resetLabel="مسح التواريخ"
          statementButtonLabel={labels.statementOpenLabel || 'عرض كشف الحساب'}
        />
        <PortStatementAccountPicker
          search={search}
          onSearchChange={onSearchChange}
          accounts={accounts}
          onSelectAccount={onSelectAccount}
        />
      </div>
    </div>
  );
}

import PageHeader from "../../../components/PageHeader";
import PortAccountDateFilters from "./PortAccountDateFilters";
import PortStatementAccountPicker from "./PortStatementAccountPicker";

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
  sectionKey,
}) {
  const labels = portViewLabels || {};
  const statementTitle = `${labels.statementTitlePrefix || "كشف حساب"} - ${portName}`;
  const accountLabel = sectionKey === "transport-1" ? "ناقل" : "تاجر";

  return (
    <div className="page-shell">
      <PageHeader
        title={statementTitle}
        subtitle={portName}
        onBack={onBack}
        onHome={onHome}
      />
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
          statementButtonLabel={labels.statementOpenLabel || "عرض كشف الحساب"}
          accountLabel={accountLabel}
        />
        <PortStatementAccountPicker
          search={search}
          onSearchChange={onSearchChange}
          accounts={accounts}
          onSelectAccount={onSelectAccount}
          accountLabel={accountLabel}
          hideSearch={sectionKey === "transport-1"}
        />
      </div>
    </div>
  );
}

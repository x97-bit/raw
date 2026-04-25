import { useEffect, useMemo, useState } from "react";
import AutocompleteInput from "../../../components/AutocompleteInput";

export default function PortAccountDateFilters({
  accounts,
  accountId,
  from,
  to,
  onAccountChange,
  onAddAccount,
  onFromChange,
  onToChange,
  onReset,
  onStatement,
  statementButtonLabel = "كشف الحساب",
  statementDisabled = false,
  resetLabel = "إعادة تعيين",
  accountLabel = "تاجر",
}) {
  const selectedAccountName = useMemo(
    () =>
      accounts.find(
        account => String(account.AccountID) === String(accountId || "")
      )?.AccountName || "",
    [accountId, accounts]
  );
  const [accountText, setAccountText] = useState(selectedAccountName);

  useEffect(() => {
    setAccountText(selectedAccountName);
  }, [selectedAccountName]);

  return (
    <div className="surface-card grid grid-cols-1 gap-4 p-4 md:grid-cols-2 md:p-5 xl:grid-cols-12 xl:items-end">
      <div className="xl:col-span-5">
        <label className="mb-1.5 block px-1 text-right text-sm font-semibold text-utility-muted">
          اسم {accountLabel}
        </label>
        <AutocompleteInput
          value={accountText}
          options={accounts}
          labelKey="AccountName"
          valueKey="AccountID"
          onChange={text => {
            setAccountText(text);
            if (!text.trim()) onAccountChange("");
          }}
          onSelect={account => {
            setAccountText(account.AccountName);
            onAccountChange(String(account.AccountID));
          }}
          onAddNew={
            onAddAccount
              ? async name => {
                  const createdAccount = await onAddAccount(name);
                  if (!createdAccount) return;
                  setAccountText(createdAccount.AccountName);
                  onAccountChange(String(createdAccount.AccountID));
                }
              : undefined
          }
          addNewLabel={`إضافة ${accountLabel} مباشرة`}
          placeholder={`ابحث عن ${accountLabel} أو أضفه مباشرة...`}
          className="input-field"
        />
      </div>

      <div className="xl:col-span-3">
        <label className="mb-1.5 block px-1 text-right text-sm font-semibold text-utility-muted">
          من تاريخ
        </label>
        <input
          type="date"
          value={from}
          onChange={event => onFromChange(event.target.value)}
          className="input-field"
        />
      </div>

      <div className="xl:col-span-2">
        <label className="mb-1.5 block px-1 text-right text-sm font-semibold text-utility-muted">
          إلى تاريخ
        </label>
        <input
          type="date"
          value={to}
          onChange={event => onToChange(event.target.value)}
          className="input-field"
        />
      </div>

      <div className="flex flex-col justify-end gap-2 sm:flex-row xl:col-span-2 xl:flex-col">
        <button onClick={onReset} className="btn-outline w-full">
          {resetLabel}
        </button>
        <button
          onClick={onStatement}
          disabled={statementDisabled}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {statementButtonLabel}
        </button>
      </div>
    </div>
  );
}

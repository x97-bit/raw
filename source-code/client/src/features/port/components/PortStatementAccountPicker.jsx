import { Search } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

export default function PortStatementAccountPicker({
  search,
  onSearchChange,
  accounts,
  onSelectAccount,
  accountLabel = 'تاجر',
}) {
  const { isDark } = useTheme();
  const filteredAccounts = accounts.filter((account) => !search || account.AccountName.includes(search));

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-utility-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="input-field pr-10"
            placeholder={`ابحث عن ${accountLabel}...`}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filteredAccounts.map((account) => (
          <button
            key={account.AccountID}
            onClick={() => onSelectAccount(account.AccountID)}
            className="w-full rounded-2xl border border-utility-soft-border bg-utility-soft-bg px-4 py-3 text-center font-medium text-utility-strong shadow-sm transition-all hover:-translate-y-0.5 hover:bg-utility-soft-bg-hover hover:text-utility-strong"
          >
            {account.AccountName}
          </button>
        ))}
      </div>
    </>
  );
}

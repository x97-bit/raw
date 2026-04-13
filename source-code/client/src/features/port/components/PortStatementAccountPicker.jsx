import { Search } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

export default function PortStatementAccountPicker({
  search,
  onSearchChange,
  accounts,
  onSelectAccount,
}) {
  const { isDark } = useTheme();
  const filteredAccounts = accounts.filter((account) => !search || account.AccountName.includes(search));

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search
            size={18}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-[#91a0ad]' : 'text-[#667480]'}`}
          />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="input-field pr-10"
            placeholder="ابحث عن تاجر..."
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filteredAccounts.map((account) => (
          <button
            key={account.AccountID}
            onClick={() => onSelectAccount(account.AccountID)}
            className={`rounded-[20px] border px-4 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
              isDark
                ? 'border-white/[0.06] bg-white/[0.03] text-[#d8e1ea] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:bg-white/[0.06] hover:text-white'
                : 'border-[#d7e1e2] bg-white text-[#24313c] shadow-[0_14px_28px_rgba(53,78,89,0.08)] hover:bg-[#eef4f3] hover:text-[#24313c]'
            }`}
          >
            {account.AccountName}
          </button>
        ))}
      </div>
    </>
  );
}

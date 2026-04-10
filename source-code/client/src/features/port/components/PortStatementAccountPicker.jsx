import { Search } from 'lucide-react';

export default function PortStatementAccountPicker({
  search,
  onSearchChange,
  accounts,
  onSelectAccount,
}) {
  const filteredAccounts = accounts.filter((account) => !search || account.AccountName.includes(search));

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#91a0ad]" />
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
            className="rounded-[20px] border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm font-medium text-[#d8e1ea] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all hover:bg-white/[0.06] hover:text-white"
          >
            {account.AccountName}
          </button>
        ))}
      </div>
    </>
  );
}

export default function TrialBalanceFiltersBar({
  filters,
  setFilters,
  ports,
  accountTypes,
  onSubmit,
}) {
  return (
    <div className="surface-card flex flex-wrap items-end gap-3 no-print">
      <div className="min-w-[10.5rem] flex-1">
        <label className="mb-1.5 block text-sm font-semibold text-[#b7c3ce]">من تاريخ</label>
        <input
          type="date"
          value={filters.from}
          onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
          className="input-field"
        />
      </div>

      <div className="min-w-[10.5rem] flex-1">
        <label className="mb-1.5 block text-sm font-semibold text-[#b7c3ce]">إلى تاريخ</label>
        <input
          type="date"
          value={filters.to}
          onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
          className="input-field"
        />
      </div>

      <div className="min-w-[10.5rem] flex-1">
        <label className="mb-1.5 block text-sm font-semibold text-[#b7c3ce]">المنفذ</label>
        <select
          value={filters.port}
          onChange={(event) => setFilters((current) => ({ ...current, port: event.target.value }))}
          className="input-field"
        >
          <option value="">الكل</option>
          {ports.map((port) => <option key={port.PortID} value={port.PortID}>{port.PortName}</option>)}
        </select>
      </div>

      <div className="min-w-[10.5rem] flex-1">
        <label className="mb-1.5 block text-sm font-semibold text-[#b7c3ce]">نوع الحساب</label>
        <select
          value={filters.accountType}
          onChange={(event) => setFilters((current) => ({ ...current, accountType: event.target.value }))}
          className="input-field"
        >
          <option value="">الكل</option>
          {accountTypes.map((type) => <option key={type.AccountTypeID} value={type.AccountTypeID}>{type.TypeName}</option>)}
        </select>
      </div>

      <button onClick={onSubmit} className="btn-primary min-w-[8.5rem]">
        عرض
      </button>
    </div>
  );
}

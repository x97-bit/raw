import AutocompleteInput from '../../../components/AutocompleteInput';

export default function DebtFiltersPanel({
  filterText,
  accountOptions,
  filters,
  onFilterTextChange,
  onAccountSelect,
  onDateChange,
  onReset,
}) {
  return (
    <div className="surface-card grid gap-4 p-4 md:grid-cols-4">
      <div className="md:col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-gray-700">اسم الحساب</label>
        <AutocompleteInput
          value={filterText}
          options={accountOptions}
          labelKey="name"
          valueKey="id"
          onChange={onFilterTextChange}
          onSelect={onAccountSelect}
          placeholder="ابحث باسم الحساب..."
          className="input-field"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">من تاريخ</label>
        <input
          type="date"
          value={filters.from}
          onChange={(event) => onDateChange('from', event.target.value)}
          className="input-field"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">إلى تاريخ</label>
        <input
          type="date"
          value={filters.to}
          onChange={(event) => onDateChange('to', event.target.value)}
          className="input-field"
        />
      </div>
      <div className="md:col-span-4 flex flex-wrap items-center gap-2 pt-1">
        <button onClick={onReset} className="btn-outline">
          مسح الفلاتر
        </button>
        {filters.accountName && (
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            الحساب: {filters.accountName}
          </span>
        )}
      </div>
    </div>
  );
}

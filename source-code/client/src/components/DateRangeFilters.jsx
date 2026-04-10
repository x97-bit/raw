export default function DateRangeFilters({
  filters,
  onChange,
  onSubmit,
  submitLabel = 'عرض',
  className = 'surface-card flex flex-wrap items-end gap-3 no-print',
  children = null,
}) {
  return (
    <div className={className}>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">من تاريخ</label>
        <input
          type="date"
          value={filters.from || ''}
          onChange={(event) => onChange('from', event.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">إلى تاريخ</label>
        <input
          type="date"
          value={filters.to || ''}
          onChange={(event) => onChange('to', event.target.value)}
          className="input-field"
        />
      </div>

      {children}

      <button onClick={onSubmit} className="btn-primary">
        {submitLabel}
      </button>
    </div>
  );
}

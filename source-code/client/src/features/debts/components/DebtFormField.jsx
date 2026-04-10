export default function DebtFormField({ field, value, onChange }) {
  const commonClass = 'input-field';
  const resolvedValue = value ?? '';

  if (field.type === 'textarea') {
    return (
      <div className={field.className || ''}>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{field.label}</label>
        <textarea
          value={resolvedValue}
          onChange={(event) => onChange(field.key, event.target.value)}
          className={`${commonClass} min-h-[96px] resize-y`}
          rows="3"
        />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className={field.className || ''}>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{field.label}</label>
        <select value={resolvedValue} onChange={(event) => onChange(field.key, event.target.value)} className={commonClass}>
          <option value="">اختر...</option>
          {field.options.map((option) => {
            const normalized = typeof option === 'string' ? { value: option, label: option } : option;

            return (
              <option key={`${normalized.value}-${normalized.label}`} value={normalized.value}>
                {normalized.label}
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  return (
    <div className={field.className || ''}>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{field.label}</label>
      <input
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
        step={field.step}
        value={resolvedValue}
        onChange={(event) => onChange(field.key, event.target.value)}
        className={commonClass}
      />
    </div>
  );
}

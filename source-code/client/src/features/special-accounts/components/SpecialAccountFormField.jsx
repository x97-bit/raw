export default function SpecialAccountFormField({ field, value, onChange }) {
  const resolvedValue = value ?? '';
  const commonClass = 'input-field';

  if (field.type === 'textarea') {
    return (
      <div className={field.className || ''}>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{field.label}</label>
        <textarea
          value={resolvedValue}
          onChange={(event) => onChange(field.key, event.target.value)}
          rows="4"
          className={`${commonClass} min-h-[110px] resize-y`}
        />
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

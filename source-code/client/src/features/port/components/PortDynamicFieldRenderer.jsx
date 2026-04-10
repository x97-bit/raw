import { evaluateCustomFormula, sanitizeCustomFieldValue } from '../../../utils/customFields';
import { normalizeStringOptions } from '../../../utils/optionLists';

const LABEL_CLASS = 'mb-1 block text-sm font-medium text-[#b7c3ce]';

export default function PortDynamicFieldRenderer({ item, values, onChange, formatValue }) {
  if (item.kind === 'custom') {
    const field = item.field;
    const value = values?.[field.fieldKey] ?? '';

    if (field.fieldType === 'select') {
      return (
        <div key={item.key}>
          <label className={LABEL_CLASS}>{field.label}</label>
          <select
            value={value}
            onChange={(event) => onChange(field.fieldKey, event.target.value)}
            className="input-field"
          >
            <option value="">اختر...</option>
            {normalizeStringOptions(field.options).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    const isNumericField = field.fieldType === 'number' || field.fieldType === 'money';

    return (
      <div key={item.key}>
        <label className={LABEL_CLASS}>{field.label}</label>
        <input
          type={isNumericField ? 'number' : 'text'}
          step={field.fieldType === 'money' ? '0.01' : 'any'}
          value={value}
          onChange={(event) => onChange(field.fieldKey, sanitizeCustomFieldValue(field, event.target.value))}
          className="input-field"
        />
      </div>
    );
  }

  if (item.kind === 'formula') {
    const result = evaluateCustomFormula(item.field.formula, values);

    return (
      <div
        key={item.key}
        className="rounded-[24px] border border-white/[0.06] bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      >
        <span className="mb-1 block text-xs font-semibold text-[#91a0ad]">{item.field.label}</span>
        <p
          className={`text-lg font-bold ${
            result === null ? 'text-[#91a0ad]' : result < 0 ? 'text-[#ef8f8f]' : 'text-[#9fd0c4]'
          }`}
        >
          {result === null ? '-' : formatValue(Math.round(result * 100) / 100)}
        </p>
      </div>
    );
  }

  return null;
}

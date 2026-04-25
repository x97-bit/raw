import AutocompleteInput from "../../../components/AutocompleteInput";

function FieldBlock({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function DefaultsFormField({
  definition,
  form,
  setForm,
  lookups,
}) {
  if (definition.type === "autocomplete") {
    return (
      <FieldBlock
        key={definition.formId}
        label={definition.label}
        className={definition.className}
      >
        <AutocompleteInput
          value={form[definition.formText]}
          options={lookups[definition.source]}
          labelKey={definition.labelKey}
          valueKey={definition.valueKey}
          onChange={text =>
            setForm(current => ({
              ...current,
              [definition.formText]: text,
              [definition.formId]: null,
            }))
          }
          onSelect={option =>
            setForm(current => ({
              ...current,
              [definition.formId]: option[definition.valueKey],
              [definition.formText]: option[definition.labelKey],
            }))
          }
          placeholder={"بدون افتراضي"}
        />
      </FieldBlock>
    );
  }

  if (definition.type === "select") {
    return (
      <FieldBlock
        key={definition.formId}
        label={definition.label}
        className={definition.className}
      >
        <select
          value={form[definition.formId]}
          onChange={event =>
            setForm(current => ({
              ...current,
              [definition.formId]: event.target.value,
            }))
          }
          className="input-field"
        >
          {definition.options.map((option, index) => (
            <option
              key={`${option.value || "empty"}-${option.label}-${index}`}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </FieldBlock>
    );
  }

  if (definition.type === "textarea") {
    return (
      <FieldBlock
        key={definition.formId}
        label={definition.label}
        className={definition.className}
      >
        <textarea
          value={form[definition.formId]}
          onChange={event =>
            setForm(current => ({
              ...current,
              [definition.formId]: event.target.value,
            }))
          }
          className="input-field min-h-[96px]"
        />
      </FieldBlock>
    );
  }

  return (
    <FieldBlock
      key={definition.formId}
      label={definition.label}
      className={definition.className}
    >
      <input
        type="number"
        step={definition.step}
        value={form[definition.formId]}
        onChange={event =>
          setForm(current => ({
            ...current,
            [definition.formId]: event.target.value,
          }))
        }
        className="input-field"
      />
    </FieldBlock>
  );
}

import { getAccountInputStyle } from "../specialAccountsTheme";

export default function SpecialAccountFormField({
  field,
  value,
  onChange,
  accent,
}) {
  const resolvedValue = value ?? "";
  const commonClass = "input-field";
  const inputStyle = getAccountInputStyle({ accent });

  if (field.type === "textarea") {
    return (
      <div className={`space-y-2 ${field.className || ""}`}>
        <label className="block text-sm font-semibold text-[#c5d1db]">
          {field.label}
        </label>
        <textarea
          value={resolvedValue}
          onChange={event => onChange(field.key, event.target.value)}
          rows="4"
          className={`${commonClass} min-h-[120px] resize-y`}
          style={inputStyle}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${field.className || ""}`}>
      <label className="block text-sm font-semibold text-[#c5d1db]">
        {field.label}
      </label>
      <input
        type={
          field.type === "number"
            ? "number"
            : field.type === "date"
              ? "date"
              : "text"
        }
        step={field.type === "number" ? field.step || "any" : undefined}
        value={resolvedValue}
        onChange={event => onChange(field.key, event.target.value)}
        className={commonClass}
        style={inputStyle}
      />
    </div>
  );
}

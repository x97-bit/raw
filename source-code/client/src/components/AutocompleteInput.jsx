import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Plus, Search } from 'lucide-react';

/**
 * Shared AutocompleteInput component for searching and selecting from a list.
 */
export default function AutocompleteInput({
  value,
  options = [],
  labelKey = 'name',
  valueKey = 'id',
  onChange,
  onSelect,
  onAddNew,
  addNewLabel = 'إضافة جديد',
  placeholder = 'ابدأ بالكتابة للبحث...',
  className = 'input-field',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => {
    setText(value || '');
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const normalizedText = text.trim().toLowerCase();

  const filtered = useMemo(() => {
    return options.filter((option) => {
      const label = String(option?.[labelKey] || '');
      return !normalizedText || label.toLowerCase().includes(normalizedText);
    });
  }, [options, labelKey, normalizedText]);

  const visibleOptions = filtered.slice(0, 10);
  const hiddenCount = Math.max(filtered.length - visibleOptions.length, 0);
  const exactMatch = normalizedText && options.some((option) => String(option?.[labelKey] || '').trim().toLowerCase() === normalizedText);
  const showAddNew = normalizedText.length > 0 && !exactMatch && onAddNew;
  const showDropdown = open && !disabled && (visibleOptions.length > 0 || showAddNew || normalizedText.length > 0);

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (onChange) onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={`${className} pr-10`}
          autoComplete="off"
          disabled={disabled}
        />
      </div>

      {showDropdown && (
        <div
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_0_0_1px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.12),0_30px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm animate-fade-up"
          style={{ maxHeight: '320px' }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-[11px] font-semibold text-slate-500">
            <span>{filtered.length} نتيجة</span>
            <span className="truncate pr-3">{text ? `بحث: ${text}` : 'ابدأ بالكتابة'}</span>
          </div>

          <div className="max-h-[260px] overflow-y-auto py-1.5">
            {showAddNew && (
              <button
                type="button"
                onClick={() => {
                  onAddNew(text.trim());
                  setOpen(false);
                }}
                className="mx-1.5 flex w-[calc(100%-0.75rem)] items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-right text-sm font-semibold text-emerald-800 transition-all hover:border-emerald-200 hover:bg-emerald-100"
              >
                <span className="truncate pl-3">{addNewLabel}: "{text.trim()}"</span>
                <Plus size={16} className="shrink-0" />
              </button>
            )}

            {visibleOptions.map((option) => {
              const label = String(option?.[labelKey] || '');
              const isSelected = label.trim().toLowerCase() === normalizedText;

              return (
                <button
                  key={option?.[valueKey] ?? label}
                  type="button"
                  onClick={() => {
                    setText(label);
                    if (onSelect) onSelect(option);
                    setOpen(false);
                  }}
                  className="mx-1.5 flex w-[calc(100%-0.75rem)] items-center justify-between rounded-xl px-3.5 py-3 text-right text-sm text-slate-700 transition-all hover:bg-primary-50 hover:text-slate-900"
                >
                  <span className="truncate pl-3 font-medium">{label}</span>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isSelected ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400'}`}>
                    <Check size={14} />
                  </span>
                </button>
              );
            })}

            {!showAddNew && visibleOptions.length === 0 && (
              <div className="px-4 py-5 text-center text-sm text-slate-500">
                لا توجد نتائج مطابقة.
              </div>
            )}
          </div>

          {hiddenCount > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2 text-center text-[11px] font-semibold text-slate-500">
              هناك {hiddenCount} نتائج إضافية. واصل الكتابة لتضييق البحث.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
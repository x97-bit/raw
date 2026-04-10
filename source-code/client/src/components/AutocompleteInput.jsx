import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Plus, Search } from 'lucide-react';
import { normalizeAutocompleteOptions } from '../utils/optionLists';

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
  dropdownSide = 'auto',
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value || '');
  const [dropdownPlacement, setDropdownPlacement] = useState('bottom');
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const ref = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setText(value || '');
  }, [value]);

  useEffect(() => {
    const handler = (event) => {
      const clickedInput = ref.current?.contains(event.target);
      const clickedDropdown = dropdownRef.current?.contains(event.target);
      if (!clickedInput && !clickedDropdown) setOpen(false);
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const normalizedText = text.trim().toLowerCase();
  const normalizedOptions = useMemo(
    () => normalizeAutocompleteOptions(options, { labelKey, valueKey }),
    [labelKey, options, valueKey],
  );

  const filtered = useMemo(() => {
    return normalizedOptions.filter(({ label }) => !normalizedText || label.toLowerCase().includes(normalizedText));
  }, [normalizedOptions, normalizedText]);

  const visibleOptions = filtered.slice(0, 10);
  const hiddenCount = Math.max(filtered.length - visibleOptions.length, 0);
  const exactMatch = normalizedText && normalizedOptions.some(({ label }) => label.toLowerCase() === normalizedText);
  const showAddNew = normalizedText.length > 0 && !exactMatch && onAddNew;
  const showDropdown = open && !disabled && (visibleOptions.length > 0 || showAddNew || normalizedText.length > 0);

  const updateDropdownPosition = useCallback(() => {
    if (!showDropdown || !ref.current || typeof window === 'undefined') return;

    const rect = ref.current.getBoundingClientRect();
    const viewportPadding = 16;
    const gap = 8;
    const desiredHeight = 320;
    const minimumComfortableSpace = 240;
    const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
    const availableAbove = rect.top - viewportPadding;

    let shouldOpenUpward = availableBelow < minimumComfortableSpace && availableAbove > availableBelow;
    if (dropdownSide === 'top') shouldOpenUpward = true;
    if (dropdownSide === 'bottom') shouldOpenUpward = false;

    const maxHeight = Math.max(
      180,
      Math.min(desiredHeight, shouldOpenUpward ? availableAbove : availableBelow),
    );
    const width = Math.min(rect.width, window.innerWidth - viewportPadding * 2);
    const left = Math.min(
      Math.max(rect.left, viewportPadding),
      Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
    );

    setDropdownPlacement(shouldOpenUpward ? 'top' : 'bottom');
    setDropdownStyle(
      shouldOpenUpward
        ? {
            left,
            width,
            maxHeight,
            bottom: Math.max(viewportPadding, window.innerHeight - rect.top + gap),
          }
        : {
            left,
            width,
            maxHeight,
            top: Math.min(window.innerHeight - viewportPadding, rect.bottom + gap),
          },
    );
  }, [dropdownSide, showDropdown]);

  useEffect(() => {
    if (!showDropdown) {
      setDropdownStyle(null);
      return undefined;
    }

    updateDropdownPosition();
    const handleViewportChange = () => updateDropdownPosition();

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [showDropdown, updateDropdownPosition]);

  const dropdownContent = showDropdown && dropdownStyle ? (
    <div
      ref={dropdownRef}
      className="fixed z-[140] flex flex-col overflow-hidden rounded-2xl bg-[#121820]/95 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_44px_rgba(0,0,0,0.28),0_30px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm animate-fade-up"
      style={dropdownStyle}
      data-placement={dropdownPlacement}
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.04] px-4 py-2 text-[11px] font-semibold text-[#91a0ad]">
        <span>{filtered.length} نتيجة</span>
        <span className="truncate pr-3">{text ? `بحث: ${text}` : 'ابدأ بالكتابة'}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1.5">
        {showAddNew && (
          <button
            type="button"
            onClick={() => {
              onAddNew(text.trim());
              setOpen(false);
            }}
            className="mx-1.5 flex w-[calc(100%-0.75rem)] items-center justify-between rounded-xl bg-[#8eb8ad]/[0.12] px-3.5 py-3 text-right text-sm font-semibold text-[#dceee8] ring-1 ring-[#8eb8ad]/[0.18] transition-all hover:bg-[#8eb8ad]/[0.18]"
          >
            <span className="truncate pl-3">{addNewLabel}: "{text.trim()}"</span>
            <Plus size={16} className="shrink-0" />
          </button>
        )}

        {visibleOptions.map(({ option, label, reactKey }) => {
          const isSelected = label.trim().toLowerCase() === normalizedText;

          return (
            <button
              key={reactKey}
              type="button"
              onClick={() => {
                setText(label);
                if (onSelect) onSelect(option);
                setOpen(false);
              }}
              className="mx-1.5 flex w-[calc(100%-0.75rem)] items-center justify-between rounded-xl px-3.5 py-3 text-right text-sm text-[#d8e1ea] transition-all hover:bg-white/[0.06] hover:text-white"
            >
              <span className="truncate pl-3 font-medium">{label}</span>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isSelected ? 'bg-[#9ab6ca]/[0.16] text-[#dce8f2]' : 'bg-white/[0.06] text-[#91a0ad]'}`}>
                <Check size={14} />
              </span>
            </button>
          );
        })}

        {!showAddNew && visibleOptions.length === 0 && (
          <div className="px-4 py-5 text-center text-sm text-[#91a0ad]">
            لا توجد نتائج مطابقة.
          </div>
        )}
      </div>

      {hiddenCount > 0 && (
        <div className="border-t border-white/[0.06] bg-white/[0.04] px-4 py-2 text-center text-[11px] font-semibold text-[#91a0ad]">
          هناك {hiddenCount} نتائج إضافية. واصل الكتابة لتضييق البحث.
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (onChange) onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={`${className} pr-10`}
          autoComplete="off"
          disabled={disabled}
        />
      </div>

      {dropdownContent && typeof document !== 'undefined' ? createPortal(dropdownContent, document.body) : null}
    </div>
  );
}

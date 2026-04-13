import { useEffect, useMemo, useState } from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { runExportToExcel, runExportToPDF } from '../utils/exportActions';

function hexToRgb(hex) {
  const normalized = String(hex || '').replace('#', '').trim();
  if (normalized.length !== 6) return null;

  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) return null;

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function withAlpha(hex, alpha) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function tintColor(hex, amount) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const tint = (channel) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${tint(rgb.r)}, ${tint(rgb.g)}, ${tint(rgb.b)})`;
}

function getTemplateSelectAppearance({ inHeader, isDark, themeAccent }) {
  const accentBorder = withAlpha(themeAccent, isDark ? 0.22 : 0.18);
  const accentShadow = withAlpha(themeAccent, isDark ? 0.2 : 0.12);

  if (inHeader) {
    return isDark
      ? {
          className: 'rounded-2xl px-3 py-2 text-xs font-semibold text-[#eef3f7] outline-none transition-all duration-200 hover:-translate-y-0.5',
          style: {
            background: `linear-gradient(135deg, ${withAlpha(themeAccent, 0.16)} 0%, rgba(255,255,255,0.05) 100%)`,
            border: `1px solid ${accentBorder}`,
            boxShadow: `0 12px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)`,
          },
        }
      : {
          className: 'rounded-2xl px-3 py-2 text-xs font-semibold text-[#24313c] outline-none transition-all duration-200 hover:-translate-y-0.5',
          style: {
            background: '#ffffff',
            border: `1px solid ${accentBorder}`,
            boxShadow: `0 12px 24px ${accentShadow}`,
          },
        };
  }

  return isDark
    ? {
        className: 'rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#e6edf4] outline-none transition-all duration-200 hover:-translate-y-0.5',
        style: {
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.18)',
        },
      }
    : {
        className: 'rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#24313c] outline-none transition-all duration-200 hover:-translate-y-0.5',
        style: {
          background: '#ffffff',
          border: '1px solid #d7e1e2',
          boxShadow: '0 10px 22px rgba(53,78,89,0.06)',
        },
      };
}

function getExportToneAppearance({ tone, inHeader, isDark, themeAccent }) {
  const sizes = inHeader
    ? 'flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-0.5'
    : 'flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-0.5';

  const palettes = {
    pdf: {
      dark: { bg: withAlpha('#b15b68', 0.18), border: withAlpha('#b15b68', 0.28), text: '#f4dde2', hover: withAlpha('#b15b68', 0.24), shadow: '0 12px 24px rgba(0,0,0,0.18)' },
      light: { bg: '#f9ecef', border: '#e7cdd3', text: '#9b4f5d', hover: '#f4e3e7', shadow: '0 10px 22px rgba(53,78,89,0.05)' },
    },
    excel: {
      dark: { bg: withAlpha('#4f7f67', 0.2), border: withAlpha('#4f7f67', 0.3), text: '#dceee5', hover: withAlpha('#4f7f67', 0.26), shadow: '0 12px 24px rgba(0,0,0,0.18)' },
      light: { bg: '#eaf4ee', border: '#cfe1d7', text: '#446d5b', hover: '#e1eee6', shadow: '0 10px 22px rgba(53,78,89,0.05)' },
    },
    neutral: {
      dark: { bg: withAlpha(themeAccent, 0.18), border: withAlpha(themeAccent, 0.28), text: '#eef3f7', hover: withAlpha(themeAccent, 0.24), shadow: '0 12px 24px rgba(0,0,0,0.18)' },
      light: { bg: tintColor(themeAccent, 0.92), border: withAlpha(themeAccent, 0.18), text: '#29414d', hover: tintColor(themeAccent, 0.88), shadow: '0 10px 22px rgba(53,78,89,0.05)' },
    },
  };

  const palette = isDark ? palettes[tone]?.dark || palettes.neutral.dark : palettes[tone]?.light || palettes.neutral.light;

  return {
    className: sizes,
    style: {
      background: palette.bg,
      border: `1px solid ${palette.border}`,
      color: palette.text,
      boxShadow: palette.shadow,
    },
    hoverBackground: palette.hover,
  };
}

function resolveTemplateRows(rows, columns) {
  return (rows || []).map((row) => {
    const nextRow = { ...row };

    (columns || []).forEach((column) => {
      if (typeof column?.getValue === 'function') {
        nextRow[column.key] = column.getValue(row);
      }
    });

    return nextRow;
  });
}

function resolveTemplateValue(value, context) {
  return typeof value === 'function' ? value(context) : value;
}

function normalizeTemplateSections(sections, context) {
  return (sections || []).map((section) => {
    const sectionContext = {
      ...context,
      section,
    };
    const columns = (resolveTemplateValue(section?.columns, sectionContext) || []).map((column) => ({
      ...column,
      key: column.key,
    }));

    return {
      ...section,
      title: resolveTemplateValue(section?.title, sectionContext),
      subtitle: resolveTemplateValue(section?.subtitle, sectionContext),
      totalsRow: resolveTemplateValue(section?.totalsRow, sectionContext),
      emptyMessage: resolveTemplateValue(section?.emptyMessage, sectionContext),
      highlightRows: resolveTemplateValue(section?.highlightRows, sectionContext),
      columns,
      rows: resolveTemplateRows(resolveTemplateValue(section?.rows, sectionContext) || [], columns),
    };
  });
}

function normalizeTemplate(baseConfig, template, runtimeContext = {}) {
  const mergedConfig = {
    ...baseConfig,
    ...(template || {}),
  };

  const context = {
    ...baseConfig,
    ...(template || {}),
    ...runtimeContext,
  };

  const merged = {
    ...mergedConfig,
    rows: resolveTemplateValue(mergedConfig.rows, context),
    columns: resolveTemplateValue(mergedConfig.columns, context),
    title: resolveTemplateValue(mergedConfig.title, context),
    subtitle: resolveTemplateValue(mergedConfig.subtitle, context),
    filename: resolveTemplateValue(mergedConfig.filename, context),
    summaryCards: resolveTemplateValue(mergedConfig.summaryCards, context),
    totalsRow: resolveTemplateValue(mergedConfig.totalsRow, context),
    orientation: resolveTemplateValue(mergedConfig.orientation, context),
    printSections: normalizeTemplateSections(
      resolveTemplateValue(mergedConfig.printSections, context),
      context,
    ),
    printMetaItems: resolveTemplateValue(mergedConfig.printMetaItems, context),
    printEmptyMessage: resolveTemplateValue(mergedConfig.printEmptyMessage, context),
  };

  const normalizedColumns = (merged.columns || []).map((column) => ({
    ...column,
    key: column.key,
  }));

  return {
    ...merged,
    columns: normalizedColumns,
    rows: resolveTemplateRows(merged.rows || [], normalizedColumns),
  };
}

function TemplateSelect({
  templates,
  value,
  onChange,
  inHeader,
  themeAccent = '#648ea9',
  themeAccentSoft = 'rgba(100,142,169,0.16)',
}) {
  const { isDark } = useTheme();
  if (!templates?.length) return null;

  const appearance = getTemplateSelectAppearance({ inHeader, isDark, themeAccent, themeAccentSoft });

  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={appearance.className} style={appearance.style}>
      {templates.map((template) => (
        <option key={template.id} value={template.id} className="text-slate-900">
          {template.label}
        </option>
      ))}
    </select>
  );
}

function ExportActionButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  inHeader = false,
  tone = 'neutral',
  themeAccent = '#648ea9',
  themeAccentSoft = 'rgba(100,142,169,0.16)',
}) {
  const { isDark } = useTheme();
  const resolvedTone = getExportToneAppearance({ tone, inHeader, isDark, themeAccent, themeAccentSoft });

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={resolvedTone.className}
      style={resolvedTone.style}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = resolvedTone.hoverBackground;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = resolvedTone.style.background;
      }}
    >
      <Icon size={inHeader ? 14 : 15} /> {label}
    </button>
  );
}

export default function ExportButtons({
  rows,
  columns,
  title,
  subtitle,
  filename,
  summaryCards,
  totalsRow,
  orientation,
  inHeader = false,
  templates = [],
  printSections,
  printMetaItems,
  printEmptyMessage,
  printContext,
  selectedTemplateId,
  onTemplateChange,
  sectionKey,
  themeAccent = '#648ea9',
  themeAccentSoft = 'rgba(100,142,169,0.16)',
}) {
  const availableTemplates = useMemo(() => {
    if (!templates?.length) return [];
    return templates.filter((template) => Array.isArray(template.columns) && template.columns.length > 0);
  }, [templates]);

  const [internalSelectedTemplateId, setInternalSelectedTemplateId] = useState(availableTemplates[0]?.id || '');
  const [busyAction, setBusyAction] = useState('');

  const currentTemplateId = selectedTemplateId ?? internalSelectedTemplateId;
  const handleTemplateChange = (templateId) => {
    if (onTemplateChange) {
      onTemplateChange(templateId);
      return;
    }
    setInternalSelectedTemplateId(templateId);
  };

  useEffect(() => {
    if (!availableTemplates.length) {
      if (selectedTemplateId === undefined && internalSelectedTemplateId) {
        setInternalSelectedTemplateId('');
      }
      return;
    }

    if (!availableTemplates.find((template) => template.id === currentTemplateId)) {
      handleTemplateChange(availableTemplates[0].id);
    }
  }, [availableTemplates, currentTemplateId, internalSelectedTemplateId, selectedTemplateId]);

  const baseConfig = useMemo(
    () => ({
      rows,
      columns,
      title,
      subtitle,
      filename,
      summaryCards,
      totalsRow,
      orientation,
      printSections,
      printMetaItems,
      printEmptyMessage,
      printContext,
      sectionKey,
    }),
    [rows, columns, title, subtitle, filename, summaryCards, totalsRow, orientation, printSections, printMetaItems, printEmptyMessage, printContext, sectionKey],
  );

  const selectedTemplate = useMemo(
    () => availableTemplates.find((template) => template.id === currentTemplateId) || null,
    [availableTemplates, currentTemplateId],
  );

  const activeExport = useMemo(
    () => normalizeTemplate(baseConfig, selectedTemplate, { printContext }),
    [baseConfig, printContext, selectedTemplate],
  );

  const runAction = async (key, action) => {
    setBusyAction(key);
    try {
      await action();
    } finally {
      setBusyAction('');
    }
  };

  const handlePDF = async () => {
    await runAction('pdf', () => runExportToPDF(activeExport));
  };

  const handleExcel = async () => {
    await runAction('excel', () => runExportToExcel(activeExport.rows, activeExport.columns, activeExport.filename, activeExport.title));
  };

  const pdfLabel = busyAction === 'pdf' ? 'جارٍ التصدير...' : 'PDF';
  const excelLabel = busyAction === 'excel' ? 'جارٍ التصدير...' : 'Excel';
  const isBusy = Boolean(busyAction);

  if (inHeader) {
    return (
      <>
        <TemplateSelect
          templates={availableTemplates}
          value={currentTemplateId}
          onChange={handleTemplateChange}
          inHeader
          themeAccent={themeAccent}
          themeAccentSoft={themeAccentSoft}
        />
        <ExportActionButton
          icon={FileDown}
          label={pdfLabel}
          onClick={handlePDF}
          disabled={isBusy}
          inHeader
          tone="pdf"
          themeAccent={themeAccent}
          themeAccentSoft={themeAccentSoft}
        />
        <ExportActionButton
          icon={FileSpreadsheet}
          label={excelLabel}
          onClick={handleExcel}
          disabled={isBusy}
          inHeader
          tone="excel"
          themeAccent={themeAccent}
          themeAccentSoft={themeAccentSoft}
        />
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <TemplateSelect templates={availableTemplates} value={currentTemplateId} onChange={handleTemplateChange} />
      <ExportActionButton icon={FileDown} label={pdfLabel} onClick={handlePDF} disabled={isBusy} tone="pdf" />
      <ExportActionButton icon={FileSpreadsheet} label={excelLabel} onClick={handleExcel} disabled={isBusy} tone="excel" />
    </div>
  );
}

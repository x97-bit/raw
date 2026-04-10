import { useEffect, useMemo, useState } from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { runExportToExcel, runExportToPDF } from '../utils/exportActions';

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

function TemplateSelect({ templates, value, onChange, inHeader }) {
  if (!templates?.length) return null;

  const baseClass = inHeader
    ? 'rounded-2xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-semibold text-white/85 outline-none transition hover:bg-white/12'
    : 'rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none transition shadow-[0_10px_22px_rgba(15,23,42,0.04)]';

  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={baseClass}>
      {templates.map((template) => (
        <option key={template.id} value={template.id} className="text-slate-900">
          {template.label}
        </option>
      ))}
    </select>
  );
}

function ExportActionButton({ icon: Icon, label, onClick, disabled = false, inHeader = false, tone = 'neutral' }) {
  const headerClasses = 'flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60';
  const bodyClasses = 'flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60';

  const tones = {
    pdf: inHeader
      ? { className: headerClasses, style: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.92)' } }
      : { className: `${bodyClasses} bg-white text-red-700 hover:-translate-y-0.5 hover:bg-red-50`, style: { border: '1px solid rgba(225,45,57,0.14)', boxShadow: '0 10px 22px rgba(15,23,42,0.04)' } },
    excel: inHeader
      ? { className: headerClasses, style: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.92)' } }
      : { className: `${bodyClasses} bg-white text-emerald-700 hover:-translate-y-0.5 hover:bg-emerald-50`, style: { border: '1px solid rgba(39,171,131,0.14)', boxShadow: '0 10px 22px rgba(15,23,42,0.04)' } },
    neutral: inHeader
      ? { className: headerClasses, style: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.92)' } }
      : { className: `${bodyClasses} bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-slate-50`, style: { border: '1px solid rgba(148,163,184,0.2)', boxShadow: '0 10px 22px rgba(15,23,42,0.04)' } },
  };

  const resolvedTone = tones[tone] || tones.neutral;

  return (
    <button onClick={onClick} disabled={disabled} className={resolvedTone.className} style={resolvedTone.style}>
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

  const baseConfig = useMemo(() => ({
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
  }), [rows, columns, title, subtitle, filename, summaryCards, totalsRow, orientation, printSections, printMetaItems, printEmptyMessage, printContext, sectionKey]);

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
        <TemplateSelect templates={availableTemplates} value={currentTemplateId} onChange={handleTemplateChange} inHeader />
        <ExportActionButton icon={FileDown} label={pdfLabel} onClick={handlePDF} disabled={isBusy} inHeader tone="pdf" />
        <ExportActionButton icon={FileSpreadsheet} label={excelLabel} onClick={handleExcel} disabled={isBusy} inHeader tone="excel" />
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

import { buildCurrentTemplateColumns, getSectionExportProfiles } from './sectionExportProfiles';
import { isTransportSectionKey } from './transactionTypeLabels';

function getStatementTemplatePrefix(sectionKey) {
  return isTransportSectionKey(sectionKey) ? 'كشف ذمة النقل' : 'كشف حساب';
}

function getStatementFilenamePrefix(sectionKey) {
  return isTransportSectionKey(sectionKey) ? 'كشف_ذمة_النقل' : 'كشف_حساب';
}

// These columns are visible in the on-screen table and entry forms,
// but must NOT appear in any printed or exported (PDF/print) output.
const PRINT_HIDDEN_KEYS = new Set(['CostUSD', 'CostIQD']);

function stripPrintHidden(columns = []) {
  return columns.filter((col) => !PRINT_HIDDEN_KEYS.has(col.key));
}

// ── Screen templates (include ALL columns, no cost stripping) ─────────────────
export const buildListScreenTemplates = (sectionKey, columns = [], portName = '') => ([
  {
    id: 'current-list',
    label: 'النموذج الحالي',
    columns: buildCurrentTemplateColumns(sectionKey, columns),
  },
  ...getSectionExportProfiles(sectionKey, 'list').map((profile) => ({
    ...profile,
    title: `${portName} - ${profile.label}`,
    filename: `${portName}_${profile.filenameSuffix || profile.id}`,
  })),
]);

export const buildStatementScreenTemplates = (sectionKey, columns = [], accountName = '') => {
  const titlePrefix = getStatementTemplatePrefix(sectionKey);
  const filenamePrefix = getStatementFilenamePrefix(sectionKey);

  return [
    {
      id: 'current-statement',
      label: 'النموذج الحالي',
      columns: buildCurrentTemplateColumns(sectionKey, columns),
    },
    ...getSectionExportProfiles(sectionKey, 'statement').map((profile) => ({
      ...profile,
      title: accountName
        ? `${titlePrefix} - ${accountName} - ${profile.label}`
        : `${titlePrefix} - ${profile.label}`,
      filename: accountName
        ? `${filenamePrefix}_${accountName}_${profile.filenameSuffix || profile.id}`
        : `${filenamePrefix}_${profile.filenameSuffix || profile.id}`,
    })),
  ];
};

// ── Print/PDF templates (cost columns stripped) ───────────────────────────────
export const buildListExportTemplates = (sectionKey, columns = [], portName = '') => ([
  {
    id: 'current-list',
    label: 'النموذج الحالي',
    columns: stripPrintHidden(buildCurrentTemplateColumns(sectionKey, columns)),
  },
  ...getSectionExportProfiles(sectionKey, 'list').map((profile) => ({
    ...profile,
    columns: stripPrintHidden(profile.columns || []),
    title: `${portName} - ${profile.label}`,
    filename: `${portName}_${profile.filenameSuffix || profile.id}`,
  })),
]);

export const buildStatementExportTemplates = (sectionKey, columns = [], accountName = '') => {
  const titlePrefix = getStatementTemplatePrefix(sectionKey);
  const filenamePrefix = getStatementFilenamePrefix(sectionKey);

  return [
    {
      id: 'current-statement',
      label: 'النموذج الحالي',
      columns: stripPrintHidden(buildCurrentTemplateColumns(sectionKey, columns)),
    },
    ...getSectionExportProfiles(sectionKey, 'statement').map((profile) => ({
      ...profile,
      columns: stripPrintHidden(profile.columns || []),
      title: accountName
        ? `${titlePrefix} - ${accountName} - ${profile.label}`
        : `${titlePrefix} - ${profile.label}`,
      filename: accountName
        ? `${filenamePrefix}_${accountName}_${profile.filenameSuffix || profile.id}`
        : `${filenamePrefix}_${profile.filenameSuffix || profile.id}`,
    })),
  ];
};

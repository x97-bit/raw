import { buildCurrentTemplateColumns, getSectionExportProfiles } from './sectionExportProfiles';
import { isTransportSectionKey } from './transactionTypeLabels';

function getStatementTemplatePrefix(sectionKey) {
  return isTransportSectionKey(sectionKey) ? 'كشف ذمة النقل' : 'كشف حساب';
}

function getStatementFilenamePrefix(sectionKey) {
  return isTransportSectionKey(sectionKey) ? 'كشف_ذمة_النقل' : 'كشف_حساب';
}

export const buildListExportTemplates = (sectionKey, columns = [], portName = '') => ([
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

export const buildStatementExportTemplates = (sectionKey, columns = [], accountName = '') => {
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

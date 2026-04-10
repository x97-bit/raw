import { sectionConfig } from './sectionCatalog';

export const MAIN_PAGE = 'main';
export const ADMIN_ONLY_PAGES = new Set(['users', 'field-management', 'defaults-management', 'audit-logs']);

const directPageTargets = {
  debts: { page: 'debts' },
  reports: { page: 'reports' },
  special: { page: 'accounts' },
  users: { page: 'users' },
  'trial-balance': { page: 'trial-balance' },
  'payment-matching': { page: 'payment-matching' },
  'field-management': { page: 'field-management' },
  'defaults-management': { page: 'defaults-management' },
  'audit-logs': { page: 'audit-logs' },
  expenses: { page: 'expenses' },
};

export function createMainPageEntry() {
  return { page: MAIN_PAGE };
}

export function resolveMainPageNavigation(sectionId) {
  if (directPageTargets[sectionId]) {
    return directPageTargets[sectionId];
  }

  if (sectionConfig[sectionId]) {
    return { page: 'section', sectionId };
  }

  return null;
}

export function resolveSectionActionNavigation(sectionId, action) {
  const config = sectionConfig[sectionId];
  if (!config) {
    return null;
  }

  if (action === 'invoice') {
    return {
      page: 'port-work',
      sectionId,
      portId: config.portId,
      portName: config.title,
      accountType: config.accountType,
      formType: 1,
      view: 'form',
    };
  }

  if (action === 'payment') {
    return {
      page: 'port-work',
      sectionId,
      portId: config.portId,
      portName: config.title,
      accountType: config.accountType,
      formType: 2,
      view: 'form',
    };
  }

  if (action === 'statement') {
    return {
      page: 'port-work',
      sectionId,
      portId: config.portId,
      portName: config.title,
      accountType: config.accountType,
      view: 'statement-select',
    };
  }

  if (action === 'traders') {
    return {
      page: 'port-work',
      sectionId,
      portId: config.portId,
      portName: config.title,
      accountType: config.accountType,
      view: 'list',
    };
  }

  return null;
}

import { describe, expect, it } from 'vitest';
import {
  createMainPageEntry,
  resolveMainPageNavigation,
  resolveSectionActionNavigation,
} from './stackNavigation';

describe('stackNavigation', () => {
  it('creates the main page entry', () => {
    expect(createMainPageEntry()).toEqual({ page: 'main' });
  });

  it('resolves direct main-page destinations', () => {
    expect(resolveMainPageNavigation('debts')).toEqual({ page: 'debts' });
    expect(resolveMainPageNavigation('field-management')).toEqual({ page: 'field-management' });
  });

  it('resolves section destinations from the shared catalog', () => {
    expect(resolveMainPageNavigation('port-1')).toEqual({ page: 'section', sectionId: 'port-1' });
    expect(resolveMainPageNavigation('transport')).toEqual({ page: 'section', sectionId: 'transport' });
  });

  it('returns null for unknown destinations', () => {
    expect(resolveMainPageNavigation('unknown-page')).toBeNull();
    expect(resolveSectionActionNavigation('unknown-page', 'invoice')).toBeNull();
  });

  it('resolves section actions into port-work navigation entries', () => {
    expect(resolveSectionActionNavigation('port-1', 'invoice')).toEqual({
      page: 'port-work',
      sectionId: 'port-1',
      portId: 'port-1',
      portName: 'منفذ السعودية',
      accountType: undefined,
      formType: 1,
      view: 'form',
    });

    expect(resolveSectionActionNavigation('port-1', 'debit')).toEqual({
      page: 'port-work',
      sectionId: 'port-1',
      portId: 'port-1',
      portName: 'منفذ السعودية',
      accountType: undefined,
      formType: 3,
      view: 'form',
    });

    expect(resolveSectionActionNavigation('transport', 'traders')).toEqual({
      page: 'port-work',
      sectionId: 'transport',
      portId: 'transport-1',
      portName: 'النقل',
      accountType: 2,
      view: 'list',
    });
  });
});

import { describe, it, expect } from 'vitest';

/**
 * Tests for the shared AutocompleteInput component integration.
 * These tests verify that the component is properly imported and used
 * across all pages that need autocomplete functionality.
 */

import fs from 'fs';
import path from 'path';

const clientSrc = path.resolve(__dirname, '../client/src');

describe('AutocompleteInput shared component', () => {
  it('should exist as a shared component', () => {
    const componentPath = path.join(clientSrc, 'components/AutocompleteInput.jsx');
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('should export a default function', () => {
    const content = fs.readFileSync(path.join(clientSrc, 'components/AutocompleteInput.jsx'), 'utf-8');
    expect(content).toContain('export default function AutocompleteInput');
  });

  it('should support labelKey and valueKey props', () => {
    const content = fs.readFileSync(path.join(clientSrc, 'components/AutocompleteInput.jsx'), 'utf-8');
    expect(content).toContain('labelKey');
    expect(content).toContain('valueKey');
  });

  it('should support onAddNew prop for creating new items', () => {
    const content = fs.readFileSync(path.join(clientSrc, 'components/AutocompleteInput.jsx'), 'utf-8');
    expect(content).toContain('onAddNew');
    expect(content).toContain('addNewLabel');
  });
});

describe('PortPage uses shared AutocompleteInput', () => {
  const portPageContent = fs.readFileSync(path.join(clientSrc, 'pages/PortPage.jsx'), 'utf-8');

  it('should import AutocompleteInput from shared component', () => {
    expect(portPageContent).toContain("import AutocompleteInput from '../components/AutocompleteInput'");
  });

  it('should NOT have inline AutocompleteInput definition', () => {
    expect(portPageContent).not.toContain('function AutocompleteInput(');
  });

  it('should use AutocompleteInput for trader field', () => {
    expect(portPageContent).toContain('اكتب اسم التاجر');
  });

  it('should use AutocompleteInput for driver field', () => {
    expect(portPageContent).toContain('اكتب اسم السائق');
  });

  it('should use AutocompleteInput for vehicle field', () => {
    expect(portPageContent).toContain('اكتب رقم السيارة');
  });

  it('should use AutocompleteInput for goods type field', () => {
    expect(portPageContent).toContain('اكتب نوع البضاعة');
  });

  it('should use AutocompleteInput for government entity field', () => {
    expect(portPageContent).toContain('اكتب الجهة الحكومية');
  });

  it('should pass labelKey and valueKey to all AutocompleteInput instances', () => {
    // Count occurrences of AutocompleteInput usage
    const autocompleteCount = (portPageContent.match(/<AutocompleteInput/g) || []).length;
    const labelKeyCount = (portPageContent.match(/labelKey="/g) || []).length;
    const valueKeyCount = (portPageContent.match(/valueKey="/g) || []).length;
    expect(autocompleteCount).toBeGreaterThanOrEqual(5); // trader, driver, vehicle, goods, gov
    expect(labelKeyCount).toBe(autocompleteCount);
    expect(valueKeyCount).toBe(autocompleteCount);
  });
});

describe('DebtsPage uses shared AutocompleteInput', () => {
  const debtsContent = fs.readFileSync(path.join(clientSrc, 'pages/DebtsPage.jsx'), 'utf-8');

  it('should import AutocompleteInput', () => {
    expect(debtsContent).toContain("import AutocompleteInput from '../components/AutocompleteInput'");
  });

  it('should use AutocompleteInput for person/account field instead of select', () => {
    expect(debtsContent).toContain('ابدأ بكتابة اسم الشخص');
    // Should NOT have a plain select for AccountID
    expect(debtsContent).not.toMatch(/<select.*AccountID/);
  });
});

describe('TransactionModal uses shared AutocompleteInput', () => {
  const modalContent = fs.readFileSync(path.join(clientSrc, 'components/TransactionModal.jsx'), 'utf-8');

  it('should import AutocompleteInput', () => {
    expect(modalContent).toContain("import AutocompleteInput from './AutocompleteInput'");
  });

  it('should use AutocompleteInput for trader field in edit mode', () => {
    expect(modalContent).toContain('ابدأ بكتابة اسم التاجر');
    // Should NOT have a plain select for AccountID
    expect(modalContent).not.toMatch(/<select.*AccountID/);
  });
});

describe('ReportsPage uses shared AutocompleteInput', () => {
  const reportsContent = fs.readFileSync(path.join(clientSrc, 'pages/ReportsPage.jsx'), 'utf-8');

  it('should import AutocompleteInput', () => {
    expect(reportsContent).toContain("import AutocompleteInput from '../components/AutocompleteInput'");
  });

  it('should use AutocompleteInput for trader name field', () => {
    expect(reportsContent).toContain('ابدأ بكتابة اسم التاجر');
  });

  it('should load all accounts for autocomplete suggestions', () => {
    expect(reportsContent).toContain("api('/accounts')");
    expect(reportsContent).toContain('setAllAccounts');
  });
});

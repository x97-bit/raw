import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const clientSrc = path.resolve(__dirname, '../../../client/src');

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
  const portPageWrapperContent = fs.readFileSync(path.join(clientSrc, 'pages/PortPage.jsx'), 'utf-8');
  const portPageContent = fs.readFileSync(
    path.join(clientSrc, 'features/port/PortPageContent.jsx'),
    'utf-8',
  );
  const portTransactionFormContent = fs.readFileSync(
    path.join(clientSrc, 'features/port/usePortTransactionForm.jsx'),
    'utf-8',
  );
  const builtInFieldContent = fs.readFileSync(
    path.join(clientSrc, 'features/port/components/PortBuiltInField.jsx'),
    'utf-8',
  );

  it('should delegate built-in field rendering through the extracted port transaction form hook', () => {
    expect(portPageWrapperContent).toContain("export { default } from '../features/port/PortPageContent';");
    expect(portPageContent).toContain("import usePortTransactionForm from './usePortTransactionForm'");
    expect(portTransactionFormContent).toContain("import PortBuiltInField from './components/PortBuiltInField'");
    expect(portTransactionFormContent).toContain('<PortBuiltInField');
  });

  it('should NOT have inline AutocompleteInput definition', () => {
    expect(portPageContent).not.toContain('function AutocompleteInput(');
    expect(portTransactionFormContent).not.toContain('function AutocompleteInput(');
  });

  it('should use AutocompleteInput for trader field', () => {
    expect(builtInFieldContent).toContain("import AutocompleteInput from '../../../components/AutocompleteInput'");
    expect(builtInFieldContent).toContain('<AutocompleteInput');
    expect(builtInFieldContent).toContain('value={traderText}');
  });

  it('should use AutocompleteInput for driver field', () => {
    expect(builtInFieldContent).toContain("value={form._driverText || ''}");
  });

  it('should use AutocompleteInput for vehicle field', () => {
    expect(builtInFieldContent).toContain("value={form._vehicleText || ''}");
  });

  it('should use AutocompleteInput for goods type field', () => {
    expect(builtInFieldContent).toContain("value={form._goodText || ''}");
  });

  it('should use AutocompleteInput for government entity field', () => {
    expect(builtInFieldContent).toContain("value={form._govText || ''}");
  });

  it('should use AutocompleteInput for company field', () => {
    expect(builtInFieldContent).toContain("value={form._companyText || form.CompanyName || ''}");
  });

  it('should pass labelKey and valueKey to all AutocompleteInput instances', () => {
    const autocompleteCount = (builtInFieldContent.match(/<AutocompleteInput/g) || []).length;
    const labelKeyCount = (builtInFieldContent.match(/labelKey=/g) || []).length;
    const valueKeyCount = (builtInFieldContent.match(/valueKey=/g) || []).length;
    expect(autocompleteCount).toBeGreaterThanOrEqual(7);
    expect(labelKeyCount).toBeGreaterThanOrEqual(autocompleteCount);
    expect(valueKeyCount).toBeGreaterThanOrEqual(autocompleteCount);
  });
});

describe('Debts feature uses shared AutocompleteInput', () => {
  const debtsWrapperContent = fs.readFileSync(path.join(clientSrc, 'pages/DebtsPage.jsx'), 'utf-8');
  const debtsContent = fs.readFileSync(
    path.join(clientSrc, 'features/debts/DebtsPageContent.jsx'),
    'utf-8',
  );
  const filtersContent = fs.readFileSync(
    path.join(clientSrc, 'features/debts/components/DebtFiltersPanel.jsx'),
    'utf-8',
  );
  const formModalContent = fs.readFileSync(
    path.join(clientSrc, 'features/debts/components/DebtFormModal.jsx'),
    'utf-8',
  );

  it('should delegate debt filters and form rendering through extracted debt components', () => {
    expect(debtsWrapperContent).toContain("export { default } from '../features/debts/DebtsPageContent';");
    expect(debtsContent).toContain("import DebtFiltersPanel from './components/DebtFiltersPanel'");
    expect(debtsContent).toContain("import DebtFormModal from './components/DebtFormModal'");
    expect(debtsContent).toContain('<DebtFiltersPanel');
    expect(debtsContent).toContain('<DebtFormModal');
  });

  it('should use AutocompleteInput for the debt filters account field', () => {
    expect(filtersContent).toContain("import AutocompleteInput from '../../../components/AutocompleteInput'");
    expect(filtersContent).toContain('value={filterText}');
    expect(filtersContent).not.toMatch(/<select.*accountName/);
  });

  it('should use AutocompleteInput for the debt form account field', () => {
    expect(formModalContent).toContain("import AutocompleteInput from '../../../components/AutocompleteInput'");
    expect(formModalContent).toContain('value={accountText}');
    expect(formModalContent).toContain('onAddNew={onAddAccountName}');
    expect(formModalContent).not.toMatch(/<select.*AccountName/);
  });
});

describe('TransactionModal uses shared AutocompleteInput', () => {
  const modalContent = fs.readFileSync(path.join(clientSrc, 'components/TransactionModal.jsx'), 'utf-8');
  const editItemContent = fs.readFileSync(
    path.join(clientSrc, 'features/transactions/components/TransactionModalEditItem.jsx'),
    'utf-8',
  );

  it('should delegate field rendering through the extracted edit item component', () => {
    expect(modalContent).toContain("import TransactionModalEditItem from '../features/transactions/components/TransactionModalEditItem'");
    expect(modalContent).toContain('<TransactionModalEditItem');
    expect(modalContent).not.toContain("import AutocompleteInput from './AutocompleteInput'");
  });

  it('should use shared AutocompleteInput for trader field in the extracted edit item', () => {
    expect(editItemContent).toContain("import AutocompleteInput from '../../../components/AutocompleteInput'");
    expect(editItemContent).toContain("value={traderText || editForm.AccountName || editForm.TraderName || ''}");
    expect(editItemContent).toContain('placeholder=');
    expect(editItemContent).not.toMatch(/<select.*AccountID/);
  });

  it('should use shared AutocompleteInput for lookup fields in the extracted edit item', () => {
    expect(editItemContent).toContain("value={editForm._driverText || ''}");
    expect(editItemContent).toContain("value={editForm._vehicleText || ''}");
    expect(editItemContent).toContain("value={editForm._goodText || ''}");
    expect(editItemContent).toContain("value={editForm._govText || ''}");
    expect(editItemContent).toContain("value={editForm._companyText || ''}");
  });
});

describe('Reports feature uses shared AutocompleteInput', () => {
  const reportsWrapperContent = fs.readFileSync(path.join(clientSrc, 'pages/ReportsPage.jsx'), 'utf-8');
  const reportsContent = fs.readFileSync(
    path.join(clientSrc, 'features/reports/ReportsPageContent.jsx'),
    'utf-8',
  );
  const addTraderContent = fs.readFileSync(
    path.join(clientSrc, 'features/reports/components/ReportsAddTraderView.jsx'),
    'utf-8',
  );

  it('should delegate trader form rendering through the extracted reports add trader view', () => {
    expect(reportsWrapperContent).toContain("export { default } from '../features/reports/ReportsPageContent';");
    expect(reportsContent).toContain("import ReportsAddTraderView from './components/ReportsAddTraderView'");
    expect(reportsContent).toContain('<ReportsAddTraderView');
  });

  it('should use AutocompleteInput for trader name field inside the extracted reports add trader view', () => {
    expect(addTraderContent).toContain("import AutocompleteInput from '../../../components/AutocompleteInput'");
    expect(addTraderContent).toContain('value={traderForm.AccountName}');
    expect(addTraderContent).not.toMatch(/<select.*AccountName/);
  });

  it('should load all accounts for autocomplete suggestions', () => {
    expect(reportsContent).toContain("api('/accounts')");
    expect(reportsContent).toContain('setAllAccounts');
  });
});

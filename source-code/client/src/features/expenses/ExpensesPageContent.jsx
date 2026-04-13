import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import ExportButtons from '../../components/ExportButtons';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import ExpenseFormModal from './components/ExpenseFormModal';
import ExpensesOverviewCards from './components/ExpensesOverviewCards';
import ExpensesTable from './components/ExpensesTable';
import ExpensesTotalsBar from './components/ExpensesTotalsBar';
import {
  buildExpenseExportColumns,
  createExpenseFormFromRow,
  createInitialExpenseForm,
  EXPENSE_COLUMNS,
} from './expensesConfig';
import {
  filterExpensesByPort,
  sumExpenseAmounts,
} from './expensesHelpers';
import { useAuth } from '../../contexts/AuthContext';

export default function ExpensesPage({ onBack }) {
  const { api, can } = useAuth();
  const [data, setData] = useState({ expenses: [], summary: [], totals: {} });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [filterPort, setFilterPort] = useState('');

  const filteredExpenses = useMemo(
    () => filterExpensesByPort(data.expenses, filterPort),
    [data.expenses, filterPort],
  );
  const { totalUSD, totalIQD } = useMemo(
    () => sumExpenseAmounts(filteredExpenses),
    [filteredExpenses],
  );
  const exportColumns = useMemo(
    () => buildExpenseExportColumns(EXPENSE_COLUMNS),
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api('/reports/expenses-summary');
      setData(result);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api('/accounts').then(setAccounts).catch(() => setAccounts([]));
  }, [api]);

  const closeForm = () => {
    setShowForm(false);
    setForm({});
    setEditId(null);
  };

  const openCreateModal = () => {
    setForm(createInitialExpenseForm());
    setEditId(null);
    setShowForm(true);
  };

  const handleEdit = (expense) => {
    setForm(createExpenseFormFromRow(expense));
    setEditId(expense.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editId) {
      await api(`/expenses/${editId}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await api('/expenses', { method: 'POST', body: JSON.stringify(form) });
    }

    closeForm();
    await load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذا المصروف؟')) {
      return;
    }

    await api(`/expenses/${id}`, { method: 'DELETE' });
    await load();
  };

  const handleFormChange = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'chargeTarget' && value !== 'trader') {
        next.accountId = null;
        next.accountName = '';
      }
      return next;
    });
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="المصاريف"
        subtitle="الصفحة الرئيسية"
        onBack={onBack}
      >
        {filteredExpenses.length > 0 && (
          <ExportButtons
            inHeader
            rows={filteredExpenses}
            columns={exportColumns}
            title="المصاريف"
            filename="المصاريف"
            printStrategy="table"
          />
        )}
        {can.manageDebts && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition-all hover:bg-white/20"
          >
            <Plus size={16} /> إضافة مصروف
          </button>
        )}
      </PageHeader>

      <div className="space-y-5 p-5">
        {loading ? (
          <LoadingSpinner label="جارٍ تحميل المصاريف..." />
        ) : (
          <>
            <ExpensesOverviewCards
              totals={data.totals || {}}
              summaryRows={data.summary || []}
              filterPort={filterPort}
              onTogglePort={setFilterPort}
            />

            <ExpensesTotalsBar
              totalUSD={totalUSD}
              totalIQD={totalIQD}
              count={filteredExpenses.length}
            />

            <ExpensesTable
              columns={EXPENSE_COLUMNS}
              rows={filteredExpenses}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}
      </div>

      {showForm && (
        <ExpenseFormModal
          accounts={accounts}
          form={form}
          editId={editId}
          onClose={closeForm}
          onSave={handleSave}
          onChange={handleFormChange}
        />
      )}
    </div>
  );
}

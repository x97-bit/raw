import { useCallback, useEffect, useMemo, useState } from "react";
import {
  appendDebtNameOption,
  buildDebtAccountOptions,
  buildDebtExportColumns,
  buildDebtPreviewItems,
} from "./debtsPageHelpers";
import {
  COMMON_DEBT_FORM_FIELDS,
  DEFAULT_DEBT_COLUMNS,
  DEFAULT_DEBT_FORM_FIELDS,
  buildDebtSummaryRows,
  buildDebtTotals,
  filterDebtByDate,
  getDebtorConfig,
  getInitialDebtFormState,
} from "../../utils/debtsConfig";

export default function useDebtsPageState({ api }) {
  const [data, setData] = useState({ debts: [], summary: [], totals: {} });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [form, setForm] = useState(getInitialDebtFormState());
  const [accountText, setAccountText] = useState("");
  const [filters, setFilters] = useState({ accountName: "", from: "", to: "" });
  const [filterText, setFilterText] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [debtsData, accountRows] = await Promise.all([
        api("/reports/debts-summary"),
        api("/accounts?type=4"),
      ]);
      setData(debtsData);
      setAccounts(accountRows);
    } catch (error) {
      console.error("Error loading debts:", error);
      setMessage(error.message || "تعذر تحميل بيانات الديون.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const dateFilteredDebts = useMemo(
    () =>
      (data.debts || []).filter(debt =>
        filterDebtByDate(debt.TransDate, filters.from, filters.to)
      ),
    [data.debts, filters.from, filters.to]
  );

  const summaryRows = useMemo(
    () => buildDebtSummaryRows(dateFilteredDebts),
    [dateFilteredDebts]
  );
  const filteredDebts = useMemo(
    () =>
      dateFilteredDebts.filter(
        debt => !filters.accountName || debt.AccountName === filters.accountName
      ),
    [dateFilteredDebts, filters.accountName]
  );
  const totals = useMemo(() => buildDebtTotals(filteredDebts), [filteredDebts]);
  const accountOptions = useMemo(
    () => buildDebtAccountOptions(accounts, data.debts),
    [accounts, data.debts]
  );

  const activeAccountName = filters.accountName || null;
  const activeColumns =
    getDebtorConfig(activeAccountName)?.columns || DEFAULT_DEBT_COLUMNS;
  const formConfig = getDebtorConfig(accountText || form.AccountName);
  const formFields = [
    ...(formConfig?.formFields || DEFAULT_DEBT_FORM_FIELDS),
    ...COMMON_DEBT_FORM_FIELDS,
  ];
  const previewColumns = selectedDebt
    ? getDebtorConfig(selectedDebt.AccountName)?.columns || DEFAULT_DEBT_COLUMNS
    : DEFAULT_DEBT_COLUMNS;
  const previewItems = useMemo(
    () => buildDebtPreviewItems(selectedDebt, previewColumns),
    [previewColumns, selectedDebt]
  );
  const exportColumns = useMemo(
    () => buildDebtExportColumns(activeColumns),
    [activeColumns]
  );

  const openCreateModal = () => {
    setEditingDebt(null);
    setSelectedDebt(null);
    setForm(getInitialDebtFormState());
    setAccountText("");
    setShowForm(true);
    setMessage("");
  };

  const openEditModal = debt => {
    setEditingDebt(debt);
    setSelectedDebt(null);
    setForm(getInitialDebtFormState(debt));
    setAccountText(debt.AccountName || "");
    setShowForm(true);
    setMessage("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDebt(null);
    setForm(getInitialDebtFormState());
    setAccountText("");
  };

  const handleFormChange = (fieldKey, value) => {
    setForm(current => ({ ...current, [fieldKey]: value }));
  };

  const handleSave = async () => {
    const debtorName = (accountText || form.AccountName || "").trim();
    if (!debtorName) {
      setMessage("يرجى تحديد اسم الحساب قبل الحفظ.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        debtorName,
        AccountName: debtorName,
      };
      const target = editingDebt ? `/debts/${editingDebt.DebtID}` : "/debts";
      await api(target, {
        method: editingDebt ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setMessage(
        editingDebt ? "تم تحديث الدين بنجاح." : "تمت إضافة الدين بنجاح."
      );
      closeForm();
      await load();
    } catch (error) {
      console.error("Error saving debt:", error);
      setMessage(error.message || "تعذر حفظ بيانات الدين.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async debt => {
    if (
      !debt ||
      !window.confirm(`هل تريد حذف الدين الخاص بـ ${debt.AccountName}؟`)
    ) {
      return;
    }

    setDeleting(true);
    try {
      await api(`/debts/${debt.DebtID}`, { method: "DELETE" });
      setSelectedDebt(null);
      setMessage("تم حذف الدين بنجاح.");
      await load();
    } catch (error) {
      console.error("Error deleting debt:", error);
      setMessage(error.message || "تعذر حذف الدين.");
    } finally {
      setDeleting(false);
    }
  };

  const handleFilterTextChange = text => {
    setFilterText(text);
    setFilters(current => ({ ...current, accountName: "" }));
  };

  const handleFilterSelect = account => {
    setFilterText(account.name);
    setFilters(current => ({ ...current, accountName: account.name }));
  };

  const handleFilterDateChange = (key, value) => {
    setFilters(current => ({ ...current, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ accountName: "", from: "", to: "" });
    setFilterText("");
  };

  const handleToggleSummaryAccount = (accountName, isActive) => {
    const nextValue = isActive ? "" : accountName;
    setFilters(current => ({ ...current, accountName: nextValue }));
    setFilterText(nextValue);
  };

  const handleAccountTextChange = text => {
    setAccountText(text);
    setForm(current => ({ ...current, AccountName: text }));
  };

  const handleAccountSelect = account => {
    setAccountText(account.name);
    setForm(current => ({ ...current, AccountName: account.name }));
  };

  const handleAddAccountName = name => {
    const normalized = String(name || "").trim();
    if (!normalized) {
      return;
    }

    setAccounts(current => appendDebtNameOption(current, normalized));
    setAccountText(normalized);
    setForm(current => ({ ...current, AccountName: normalized }));
  };

  const handleDeleteAccount = async id => {
    if (!id || !window.confirm("هل أنت متأكد من حذف هذا الحساب؟")) return;
    try {
      await api(`/accounts/${id}`, { method: "DELETE" });
      setFilters(current => ({ ...current, accountName: "" }));
      setFilterText("");
      await load();
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("تعذر حذف الحساب. قد يكون مرتبطاً بحركات.");
    }
  };

  return {
    accountOptions,
    accountText,
    activeColumns,
    closeForm,
    deleting,
    editingDebt,
    exportColumns,
    filteredDebts,
    filterText,
    filters,
    form,
    formFields,
    handleAccountSelect,
    handleAccountTextChange,
    handleAddAccountName,
    handleDelete,
    handleDeleteAccount,
    handleFilterDateChange,
    handleFilterSelect,
    handleFilterTextChange,
    handleFormChange,
    handleResetFilters,
    handleSave,
    handleToggleSummaryAccount,
    loading,
    message,
    openCreateModal,
    openEditModal,
    previewItems,
    saving,
    selectedDebt,
    setSelectedDebt,
    showForm,
    summaryRows,
    totals,
  };
}

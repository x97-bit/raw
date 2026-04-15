import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyLoadedSpecialFieldConfigs,
  buildSpecialAccountQuery,
  createSpecialAccountFilters,
} from './specialAccountsPageHelpers';
import {
  buildVisibleSpecialColumns,
  createInitialSpecialFieldState,
  filterSpecialAccountRows,
  getInitialSpecialForm,
  SPECIAL_ACCOUNT_DEFS,
  SPECIAL_FORM_FIELDS,
} from '../../utils/specialAccountsConfig';

export default function useSpecialAccountsPageState({ api }) {
  const [view, setView] = useState('main');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(createSpecialAccountFilters());
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState('');
  const [fieldState, setFieldState] = useState(createInitialSpecialFieldState);
  const filtersRef = useRef(createSpecialAccountFilters());

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const loadFieldConfigs = useCallback(async () => {
    try {
      const [haiderConfig, partnerConfig] = await Promise.all([
        api('/field-config/special-haider').catch(() => null),
        api('/field-config/special-partner').catch(() => null),
      ]);

      setFieldState((current) => applyLoadedSpecialFieldConfigs(current, haiderConfig, partnerConfig));
    } catch (error) {
      console.log('No field configs for special accounts, using defaults', error);
    }
  }, [api]);

  useEffect(() => {
    loadFieldConfigs();
  }, [loadFieldConfigs]);

  const openAccount = useCallback(async (accountId, nextFilters) => {
    const accountDef = SPECIAL_ACCOUNT_DEFS[accountId];
    if (!accountDef) return;

    setLoading(true);
    setView(accountId);

    try {
      const query = buildSpecialAccountQuery(nextFilters || filtersRef.current);
      const response = await api(`${accountDef.endpoint}${query ? `?${query}` : ''}`);
      setData(response);
    } catch (error) {
      console.error('Error loading special account:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const resetView = useCallback(() => {
    setView('main');
    setData(null);
    setShowForm(false);
    setEditingRecord(null);
    setMessage('');
  }, []);

  const activeDef = view === 'main' ? null : SPECIAL_ACCOUNT_DEFS[view];
  const activeRows = activeDef ? (data?.[activeDef.rowsKey] || []) : [];
  const activeFieldConfig = activeDef ? fieldState[activeDef.sectionKey] : null;

  const visibleColumns = useMemo(() => {
    if (!activeDef || !activeFieldConfig) return [];
    return buildVisibleSpecialColumns(activeDef.columns, activeFieldConfig.visibleKeys, activeFieldConfig.configMap);
  }, [activeDef, activeFieldConfig]);

  const filteredRows = useMemo(() => {
    if (!activeDef) return [];
    return filterSpecialAccountRows(activeRows, filters.search, visibleColumns, activeDef.searchKeys, {
      batchName: activeDef.id === 'haider' ? filters.batchName : '',
    });
  }, [activeDef, activeRows, filters.batchName, filters.search, visibleColumns]);

  const batchOptions = useMemo(() => {
    if (activeDef?.id !== 'haider') return [];

    return [...new Set(
      activeRows
        .map((row) => String(row?.BatchName || '').trim())
        .filter(Boolean),
    )].sort((left, right) => left.localeCompare(right, 'ar'));
  }, [activeDef, activeRows]);

  const derivedTotals = useMemo(
    () => (activeDef ? activeDef.buildTotals(filteredRows) : null),
    [activeDef, filteredRows],
  );

  const summaryCards = useMemo(
    () => (activeDef && derivedTotals ? activeDef.buildSummaryCards(derivedTotals) : []),
    [activeDef, derivedTotals],
  );

  const exportColumns = useMemo(
    () => visibleColumns.map((column) => ({ key: column.dataKey, label: column.label, format: column.format })),
    [visibleColumns],
  );

  const formFields = activeDef ? SPECIAL_FORM_FIELDS[activeDef.id] || [] : [];

  const openCreateModal = useCallback(() => {
    if (!activeDef) return;
    setEditingRecord(null);
    setForm(getInitialSpecialForm(activeDef.id, activeDef.label));
    setShowForm(true);
  }, [activeDef]);

  const openEditModal = useCallback((record) => {
    if (!activeDef) return;
    setEditingRecord(record);
    setForm(getInitialSpecialForm(activeDef.id, activeDef.label, record));
    setShowForm(true);
  }, [activeDef]);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingRecord(null);
    setForm({});
  }, []);

  const handleFormChange = useCallback((fieldKey, value) => {
    setForm((current) => ({ ...current, [fieldKey]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!activeDef) return;

    setSaving(true);
    try {
      const endpoint = editingRecord ? `/special/${editingRecord.id}` : '/special';
      await api(endpoint, {
        method: editingRecord ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      setMessage(editingRecord ? 'تم تحديث السجل بنجاح.' : 'تمت إضافة السجل بنجاح.');
      closeForm();
      await openAccount(activeDef.id);
    } catch (error) {
      console.error('Error saving special account:', error);
      setMessage(error.message || 'تعذر حفظ السجل.');
    } finally {
      setSaving(false);
    }
  }, [activeDef, api, closeForm, editingRecord, form, openAccount]);

  const handleDelete = useCallback(async (record) => {
    if (!record || !window.confirm('هل تريد حذف هذا السجل؟')) return;

    setDeletingId(record.id);
    try {
      await api(`/special/${record.id}`, { method: 'DELETE' });
      setMessage('تم حذف السجل بنجاح.');
      await openAccount(activeDef.id);
    } catch (error) {
      console.error('Error deleting special account:', error);
      setMessage(error.message || 'تعذر حذف السجل.');
    } finally {
      setDeletingId(null);
    }
  }, [activeDef, api, openAccount]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(createSpecialAccountFilters());
  }, []);

  return {
    activeDef,
    activeRows,
    closeForm,
    data,
    deletingId,
    derivedTotals,
    editingRecord,
    exportColumns,
    filteredRows,
    filters,
    form,
    formFields,
    handleDelete,
    handleFilterChange,
    handleFormChange,
    handleResetFilters,
    handleSave,
    loading,
    message,
    openAccount,
    openCreateModal,
    openEditModal,
    resetView,
    saving,
    setMessage,
    showForm,
    summaryCards,
    batchOptions,
    view,
    visibleColumns,
  };
}

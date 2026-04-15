import { useCallback, useEffect, useRef, useState } from 'react';
import PortBuiltInField from './components/PortBuiltInField';
import PortDynamicFieldRenderer from './components/PortDynamicFieldRenderer';
import {
  buildCustomFieldValuePayload,
  getInitialCustomFieldValues,
} from '../../utils/customFields';
import {
  applySuggestedDefaultsToForm,
  buildAccountDefaultsPayload,
  buildInitialPortForm,
  buildRouteDefaultsPayload,
  formatPortNumber,
  getPortFormTarget,
} from './portPageHelpers';
import {
  buildPortAccountPayload,
  sanitizePortTransactionPayload,
} from './portTransactionFormHelpers';

const ACCOUNT_REQUIRED_MESSAGE = 'يرجى إدخال اسم التاجر';
const SAVE_SUCCESS_PREFIX = 'تم الحفظ بنجاح - ';
const UPDATE_SUCCESS_MESSAGE = 'تم التحديث بنجاح';
const DELETE_CONFIRM_MESSAGE = 'هل أنت متأكد من حذف هذه المعاملة؟';
const DELETE_SUCCESS_MESSAGE = 'تم الحذف';
const ACCOUNT_DEFAULTS_ACCOUNT_REQUIRED = 'اختر التاجر أولاً لحفظ افتراضيات التاجر';
const ACCOUNT_DEFAULTS_SUCCESS_MESSAGE = 'تم حفظ افتراضيات التاجر';
const ROUTE_DEFAULTS_GOV_REQUIRED = 'اختر المحافظة أولاً لحفظ افتراضيات المسار';
const ROUTE_DEFAULTS_SUCCESS_MESSAGE = 'تم حفظ افتراضيات المسار';

export default function usePortTransactionForm({
  api,
  accountType,
  portId,
  sectionKey,
  formType,
  setFormType,
  initialView,
  initialFormType,
  view,
  setView,
  onAfterSave,
  loadData,
  loadDriversVehicles,
  accounts,
  setAccounts,
  drivers,
  vehicles,
  goods,
  govs,
  companies,
  setCompanies,
  editableCustomFields,
  visibleBuiltInFieldKeys,
  getBuiltInFormFieldLabel,
  getVisibleCustomFieldsForTarget,
}) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [traderText, setTraderText] = useState('');
  const [savingAccountDefaults, setSavingAccountDefaults] = useState(false);
  const [savingRouteDefaults, setSavingRouteDefaults] = useState(false);
  const initialFormOpenedRef = useRef(false);

  useEffect(() => {
    if (view !== 'form' || editableCustomFields.length === 0) return;
    setForm((current) => ({ ...getInitialCustomFieldValues(editableCustomFields), ...current }));
  }, [editableCustomFields, view]);

  const applySuggestedDefaults = useCallback((defaults) => {
    setForm((current) => applySuggestedDefaultsToForm({
      currentForm: current,
      defaults,
      visibleBuiltInFieldKeys,
    }));
  }, [visibleBuiltInFieldKeys]);

  const openForm = useCallback((type) => {
    const formTarget = getPortFormTarget(type);
    setFormType(type);
    setMessage('');
    setTraderText('');
    setForm(buildInitialPortForm({
      formType: type,
      portId,
      customFieldValues: getInitialCustomFieldValues(getVisibleCustomFieldsForTarget(formTarget)),
    }));
    loadDriversVehicles();
    setView('form');
  }, [getVisibleCustomFieldsForTarget, loadDriversVehicles, portId, setView]);

  useEffect(() => {
    if (initialFormOpenedRef.current) return;
    if (initialView === 'form' && initialFormType) {
      initialFormOpenedRef.current = true;
      openForm(initialFormType);
    }
  }, [initialFormType, initialView, openForm]);

  useEffect(() => {
    if (view !== 'form' || !form.AccountID) return;

    let cancelled = false;

    const loadSuggestedDefaults = async () => {
      try {
        const params = new URLSearchParams({
          accountId: String(form.AccountID),
          sectionKey,
          formType: getPortFormTarget(formType),
        });

        if (form.GovID) params.set('govId', String(form.GovID));
        if (form.Currency) params.set('currency', String(form.Currency));

        const defaults = await api(`/defaults/transaction-form?${params.toString()}`);
        if (!cancelled) applySuggestedDefaults(defaults);
      } catch (error) {
        console.error('Failed to load transaction form defaults:', error);
      }
    };

    loadSuggestedDefaults();
    return () => {
      cancelled = true;
    };
  }, [api, applySuggestedDefaults, form.AccountID, form.Currency, form.GovID, formType, sectionKey, view]);

  const saveCustomFieldValues = useCallback(async (transactionId, source, fields = editableCustomFields) => {
    if (!transactionId) return;
    const values = buildCustomFieldValuePayload(fields, source);
    await api(`/custom-field-values/transaction/${transactionId}`, {
      method: 'POST',
      body: JSON.stringify({ values }),
    });
  }, [api, editableCustomFields]);

  const createMissingLookups = useCallback(async (draft) => {
    const nextForm = { ...draft };

    if (!nextForm.DriverID && nextForm._newDriverName?.trim()) {
      const response = await api('/lookups/drivers', {
        method: 'POST',
        body: JSON.stringify({ DriverName: nextForm._newDriverName.trim() }),
      });
      nextForm.DriverID = response.id;
    }

    if (!nextForm.VehicleID && nextForm._newPlateNumber?.trim()) {
      const response = await api('/lookups/vehicles', {
        method: 'POST',
        body: JSON.stringify({ PlateNumber: nextForm._newPlateNumber.trim() }),
      });
      nextForm.VehicleID = response.id;
    }

    if (!nextForm.GoodTypeID && nextForm._newGoodType?.trim()) {
      const response = await api('/lookups/goods-types', {
        method: 'POST',
        body: JSON.stringify({ TypeName: nextForm._newGoodType.trim() }),
      });
      nextForm.GoodTypeID = response.id;
    }

    if (!nextForm.CompanyID && nextForm._companyText?.trim()) {
      const response = await api('/lookups/companies', {
        method: 'POST',
        body: JSON.stringify({ CompanyName: nextForm._companyText.trim() }),
      });
      nextForm.CompanyID = response.id;
      nextForm.CompanyName = response.CompanyName;
    }

    return nextForm;
  }, [api]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      let draft = { ...form };

      if (!draft.AccountID && traderText.trim()) {
        const newAccount = await api('/accounts', {
          method: 'POST',
          body: JSON.stringify(buildPortAccountPayload({ traderText, accountType, portId })),
        });
        draft.AccountID = newAccount.id;
      }

      if (!draft.AccountID) {
        setMessage(ACCOUNT_REQUIRED_MESSAGE);
        return;
      }

      draft = await createMissingLookups(draft);
      const payload = sanitizePortTransactionPayload(draft);
      const selectedAccount = (accounts || []).find(
        (account) => String(account.AccountID) === String(draft.AccountID),
      );
      const resolvedAccountType = accountType
        ?? selectedAccount?.AccountTypeID
        ?? '1';
      payload.accountType = String(resolvedAccountType);
      const result = await api('/transactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await saveCustomFieldValues(result.id, payload, editableCustomFields);
      window.alert(`${SAVE_SUCCESS_PREFIX}${result.refNo}`);
      await onAfterSave?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }, [
    accountType,
    api,
    createMissingLookups,
    editableCustomFields,
    form,
    onAfterSave,
    portId,
    saveCustomFieldValues,
    traderText,
  ]);

  const handleUpdate = useCallback(async (formData) => {
    if (!formData) return false;

    try {
      const payload = sanitizePortTransactionPayload(formData);
      await api(`/transactions/${payload.TransID}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      await saveCustomFieldValues(payload.TransID, payload, editableCustomFields);
      window.alert(UPDATE_SUCCESS_MESSAGE);
      await loadData();
      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    }
  }, [api, editableCustomFields, loadData, saveCustomFieldValues]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm(DELETE_CONFIRM_MESSAGE)) return false;

    try {
      await api(`/transactions/${id}`, { method: 'DELETE' });
      window.alert(DELETE_SUCCESS_MESSAGE);
      await loadData();
      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    }
  }, [api, loadData]);

  const setField = useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const setNumericField = useCallback((fieldKey, rawValue, parser = parseFloat) => {
    if (rawValue === '') {
      setField(fieldKey, '');
      return;
    }
    const parsed = parser(rawValue);
    setField(fieldKey, Number.isNaN(parsed) ? '' : parsed);
  }, [setField]);

  const handleSaveAccountDefaults = useCallback(async () => {
    if (!form.AccountID) {
      setMessage(ACCOUNT_DEFAULTS_ACCOUNT_REQUIRED);
      return;
    }

    setSavingAccountDefaults(true);
    try {
      await api('/defaults/account', {
        method: 'POST',
        body: JSON.stringify(buildAccountDefaultsPayload({ form, sectionKey })),
      });
      window.alert(ACCOUNT_DEFAULTS_SUCCESS_MESSAGE);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingAccountDefaults(false);
    }
  }, [api, form, sectionKey]);

  const handleSaveRouteDefaults = useCallback(async () => {
    if (!form.GovID) {
      setMessage(ROUTE_DEFAULTS_GOV_REQUIRED);
      return;
    }

    setSavingRouteDefaults(true);
    try {
      await api('/defaults/route', {
        method: 'POST',
        body: JSON.stringify(buildRouteDefaultsPayload({ form, sectionKey })),
      });
      window.alert(ROUTE_DEFAULTS_SUCCESS_MESSAGE);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingRouteDefaults(false);
    }
  }, [api, form, sectionKey]);

  const renderOrderedFormItem = useCallback((item) => {
    if (item.kind === 'builtIn') {
      return (
        <PortBuiltInField
          key={item.field.key}
          field={item.field}
          type={formType}
          label={getBuiltInFormFieldLabel(item.field.key, item.field.label, formType)}
          form={form}
          setField={setField}
          setNumericField={setNumericField}
          traderText={traderText}
          setTraderText={setTraderText}
          accounts={accounts}
          setAccounts={setAccounts}
          accountType={accountType}
          portId={portId}
          drivers={drivers}
          vehicles={vehicles}
          goods={goods}
          govs={govs}
          companies={companies}
          setCompanies={setCompanies}
          api={api}
          setMsg={setMessage}
        />
      );
    }

    if (item.kind === 'custom' || item.kind === 'formula') {
      return (
        <PortDynamicFieldRenderer
          key={item.key}
          item={item}
          values={form}
          onChange={setField}
          formatValue={formatPortNumber}
        />
      );
    }

    return null;
  }, [
    accountType,
    accounts,
    api,
    companies,
    drivers,
    form,
    formType,
    getBuiltInFormFieldLabel,
    goods,
    govs,
    portId,
    setAccounts,
    setCompanies,
    setField,
    setNumericField,
    traderText,
    vehicles,
  ]);

  return {
    form,
    handleDelete,
    handleSave,
    handleSaveAccountDefaults,
    handleSaveRouteDefaults,
    handleUpdate,
    message,
    openForm,
    renderOrderedFormItem,
    saving,
    savingAccountDefaults,
    savingRouteDefaults,
  };
}

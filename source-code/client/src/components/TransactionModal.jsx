import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileDown, Pencil, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { buildPortAccountPayload } from '../features/port/portTransactionFormHelpers';
import useTransactionFormLayout from '../features/transactions/useTransactionFormLayout';
import TransactionModalEditItem from '../features/transactions/components/TransactionModalEditItem';
import { runExportInvoicePDF } from '../utils/exportActions';
import ModalPortal from './ModalPortal';
import TransactionEditSections from './TransactionEditSections';
import TransactionPreviewPanel from './TransactionPreviewPanel';
import {
  evaluateCustomFormula,
  formatCustomFieldDisplayValue,
  getInitialCustomFieldValues,
} from '../utils/customFields';
import { getTransactionTypeLabel } from '../utils/transactionTypeLabels';
import {
  applyDefaultsToTransactionDraft,
  buildTransactionModalSeed,
  parseNumericInput,
} from '../utils/transactionModalDefaults';
import {
  buildTransactionDetailItems,
  formatTransactionModalNumber,
} from '../utils/transactionModalConfig';

function mergeUniqueById(items, entry, idKey) {
  if (!entry || entry[idKey] === undefined || entry[idKey] === null) return items;
  return items.some((item) => item[idKey] === entry[idKey]) ? items : [...items, entry];
}

export default function TransactionModal({
  transaction,
  accounts = [],
  customFields = [],
  onClose,
  onUpdate,
  onDelete,
  readOnly = false,
  sectionKey = null,
  fieldConfigMap = {},
  companies = [],
  goods = [],
  drivers = [],
  vehicles = [],
  govs = [],
  accountType = null,
  portId = null,
}) {
  const { api } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [traderText, setTraderText] = useState('');
  const [localAccounts, setLocalAccounts] = useState(accounts || []);
  const [driversOptions, setDriversOptions] = useState(drivers || []);
  const [vehiclesOptions, setVehiclesOptions] = useState(vehicles || []);
  const [goodsOptions, setGoodsOptions] = useState(goods || []);
  const [govOptions, setGovOptions] = useState(govs || []);
  const [companyOptions, setCompanyOptions] = useState(companies || []);

  useEffect(() => setLocalAccounts(accounts || []), [accounts]);
  useEffect(() => setDriversOptions(drivers || []), [drivers]);
  useEffect(() => setVehiclesOptions(vehicles || []), [vehicles]);
  useEffect(() => setGoodsOptions(goods || []), [goods]);
  useEffect(() => setGovOptions(govs || []), [govs]);
  useEffect(() => setCompanyOptions(companies || []), [companies]);
  useEffect(() => {
    setEditMode(false);
    setEditForm({});
    setTraderText('');
  }, [transaction?.TransID]);

  const formTarget = transaction?.TransTypeID === 1 ? 'invoice' : 'payment';
  const transactionLabel = getTransactionTypeLabel(transaction?.TransTypeName, transaction?.TransTypeID, { sectionKey });
  const amountUsd = transaction?.AmountUSD ? `$${formatTransactionModalNumber(transaction.AmountUSD)}` : '-';
  const amountIqd = transaction?.AmountIQD ? formatTransactionModalNumber(transaction.AmountIQD) : '-';
  const costUsd = transaction?.CostUSD ? `$${formatTransactionModalNumber(transaction.CostUSD)}` : '-';
  const accentTone = transaction?.TransTypeID === 1
    ? 'from-blue-50 via-white to-sky-50 border-blue-100/80 text-blue-800'
    : 'from-emerald-50 via-white to-teal-50 border-emerald-100/80 text-emerald-800';
  const {
    editableCustomFields,
    formulaCustomFields,
    visibleBuiltInFieldKeys,
    orderedSections: orderedEditSections,
    getBuiltInFieldLabel,
  } = useTransactionFormLayout({
    sectionKey,
    formTarget,
    fieldConfigMap,
    customFields,
    fallbackTitle: 'تفاصيل الحركة',
    fallbackSubtitle: 'يعرض الحقول حسب ترتيب إدارة الحقول',
  });
  const scopedBuiltInFieldLabel = useCallback((fieldKey, fallbackLabel) => {
    if (sectionKey === 'transport-1' && fieldKey === 'ref_no') {
      return formTarget === 'payment' ? 'رقم سند الصرف' : 'رقم استحقاق النقل';
    }

    return getBuiltInFieldLabel(fieldKey, fallbackLabel);
  }, [formTarget, getBuiltInFieldLabel, sectionKey]);

  const extraReferenceFields = useMemo(() => {
    const fieldOrder = ['currency', 'driver_name', 'vehicle_plate', 'good_type', 'gov_name', 'company_name', 'carrier_name'];
    return fieldOrder.filter((fieldKey) => visibleBuiltInFieldKeys.has(fieldKey));
  }, [visibleBuiltInFieldKeys]);
  const extraNumericFields = useMemo(() => {
    const fieldOrder = ['cost_iqd', 'meters', 'fee_usd', 'syr_cus', 'car_qty', 'trans_price'];
    return fieldOrder.filter((fieldKey) => visibleBuiltInFieldKeys.has(fieldKey));
  }, [visibleBuiltInFieldKeys]);
  const customDetailItems = useMemo(() => {
    const detailFields = [...editableCustomFields, ...formulaCustomFields];
    return detailFields
      .map((field) => {
        const value = field.fieldType === 'formula'
          ? evaluateCustomFormula(field.formula, transaction || {})
          : transaction?.[field.fieldKey];
        if (value === undefined || value === null || value === '') return null;
        return {
          label: field.label,
          value: field.fieldType === 'formula'
            ? formatTransactionModalNumber(Math.round(value * 100) / 100)
            : formatCustomFieldDisplayValue(field, value),
        };
      })
      .filter(Boolean);
  }, [editableCustomFields, formulaCustomFields, transaction]);

  const detailItems = useMemo(() => buildTransactionDetailItems({
    transaction,
    transactionLabel,
    customDetailItems,
    sectionKey,
  }), [customDetailItems, sectionKey, transaction, transactionLabel]);

  useEffect(() => {
    if (!editMode || readOnly || !sectionKey) return undefined;

    let cancelled = false;
    const requests = [];

    if (!driversOptions.length) requests.push(api('/lookups/drivers').then((data) => { if (!cancelled) setDriversOptions(data); }));
    if (!vehiclesOptions.length) requests.push(api('/lookups/vehicles').then((data) => { if (!cancelled) setVehiclesOptions(data); }));
    if (!goodsOptions.length) requests.push(api(`/lookups/goods-types?port=${portId || ''}`).then((data) => { if (!cancelled) setGoodsOptions(data); }));
    if (!govOptions.length) requests.push(api('/lookups/governorates').then((data) => { if (!cancelled) setGovOptions(data); }));
    if (!companyOptions.length) requests.push(api('/lookups/companies').then((data) => { if (!cancelled) setCompanyOptions(data); }));

    if (requests.length) {
      Promise.all(requests).catch((error) => {
        console.error('Failed to load modal lookups:', error);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [api, companyOptions.length, driversOptions.length, editMode, goodsOptions.length, govOptions.length, portId, readOnly, sectionKey, vehiclesOptions.length]);

  useEffect(() => {
    if (!editMode || readOnly || !sectionKey || !editForm.AccountID) return undefined;

    let cancelled = false;

    const loadSuggestedDefaults = async () => {
      try {
        const params = new URLSearchParams({
          accountId: String(editForm.AccountID),
          sectionKey,
          formType: formTarget,
        });

        if (editForm.GovID) params.set('govId', String(editForm.GovID));
        if (editForm.Currency) params.set('currency', String(editForm.Currency));

        const defaults = await api(`/defaults/transaction-form?${params.toString()}`);
        if (!cancelled) {
          setEditForm((current) => applyDefaultsToTransactionDraft(current, defaults, visibleBuiltInFieldKeys));
        }
      } catch (error) {
        console.error('Failed to load transaction defaults in modal:', error);
      }
    };

    loadSuggestedDefaults();
    return () => {
      cancelled = true;
    };
  }, [api, editForm.AccountID, editForm.Currency, editForm.GovID, editMode, formTarget, readOnly, sectionKey, visibleBuiltInFieldKeys]);

  const setField = useCallback((fieldKey, value) => {
    setEditForm((form) => ({ ...form, [fieldKey]: value }));
  }, []);

  const setNumericField = useCallback((fieldKey, rawValue, parser = parseFloat) => {
    setEditForm((form) => ({
      ...form,
      [fieldKey]: parseNumericInput(rawValue, parser),
    }));
  }, []);

  const createAccountIfNeeded = useCallback(async (draft) => {
    if (draft.AccountID || !traderText.trim()) return draft;
    const newAccount = await api('/accounts', {
      method: 'POST',
      body: JSON.stringify(buildPortAccountPayload({ traderText, accountType, portId })),
    });
    const accountEntry = { AccountID: newAccount.id, AccountName: traderText.trim() };
    setLocalAccounts((items) => mergeUniqueById(items, accountEntry, 'AccountID'));
    return {
      ...draft,
      AccountID: newAccount.id,
      AccountName: traderText.trim(),
    };
  }, [accountType, api, portId, traderText]);

  const handleAddTraderAccount = useCallback(async (name) => {
    const traderName = String(name || '').trim();
    if (!traderName) return null;

    const newAccount = await api('/accounts', {
      method: 'POST',
      body: JSON.stringify(buildPortAccountPayload({ traderText: traderName, accountType, portId })),
    });

    const accountEntry = {
      AccountID: newAccount.id,
      AccountName: traderName,
    };

    setLocalAccounts((items) => mergeUniqueById(items, accountEntry, 'AccountID'));
    setTraderText(traderName);
    setEditForm((current) => ({
      ...current,
      AccountID: newAccount.id,
      AccountName: traderName,
    }));

    return accountEntry;
  }, [accountType, api, portId]);

  const finalizeEditForm = useCallback(async (source) => {
    let draft = { ...source };
    draft = await createAccountIfNeeded(draft);

    if (!draft.DriverID && draft._driverText?.trim()) {
      const newDriver = await api('/lookups/drivers', {
        method: 'POST',
        body: JSON.stringify({ DriverName: draft._driverText.trim() }),
      });
      setDriversOptions((items) => mergeUniqueById(items, { DriverID: newDriver.id, DriverName: draft._driverText.trim() }, 'DriverID'));
      draft.DriverID = newDriver.id;
    }

    if (!draft.VehicleID && draft._vehicleText?.trim()) {
      const newVehicle = await api('/lookups/vehicles', {
        method: 'POST',
        body: JSON.stringify({ PlateNumber: draft._vehicleText.trim() }),
      });
      setVehiclesOptions((items) => mergeUniqueById(items, { VehicleID: newVehicle.id, PlateNumber: draft._vehicleText.trim() }, 'VehicleID'));
      draft.VehicleID = newVehicle.id;
    }

    if (!draft.GoodTypeID && draft._goodText?.trim()) {
      const newGoodType = await api('/lookups/goods-types', {
        method: 'POST',
        body: JSON.stringify({ TypeName: draft._goodText.trim() }),
      });
      setGoodsOptions((items) => mergeUniqueById(items, { GoodTypeID: newGoodType.id, TypeName: draft._goodText.trim() }, 'GoodTypeID'));
      draft.GoodTypeID = newGoodType.id;
    }

    if (!draft.CompanyID && draft._companyText?.trim()) {
      const newCompany = await api('/lookups/companies', {
        method: 'POST',
        body: JSON.stringify({ CompanyName: draft._companyText.trim() }),
      });
      setCompanyOptions((items) => mergeUniqueById(items, { CompanyID: newCompany.id, CompanyName: newCompany.CompanyName || draft._companyText.trim() }, 'CompanyID'));
      draft.CompanyID = newCompany.id;
      draft.CompanyName = newCompany.CompanyName || draft._companyText.trim();
    }

    delete draft._driverText;
    delete draft._vehicleText;
    delete draft._goodText;
    delete draft._govText;
    delete draft._companyText;
    delete draft._carrierText;

    return draft;
  }, [api, createAccountIfNeeded]);

  const handleStartEdit = useCallback(() => {
    if (!transaction) return;
    setEditForm({
      ...getInitialCustomFieldValues(editableCustomFields),
      ...buildTransactionModalSeed(transaction),
    });
    setTraderText(transaction.AccountName || transaction.TraderName || '');
    setEditMode(true);
  }, [editableCustomFields, transaction]);

  const handleUpdate = async () => {
    if (!onUpdate) return;
    setSaving(true);
    try {
      const preparedForm = await finalizeEditForm(editForm);
      await onUpdate(preparedForm);
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (!confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
    onDelete(transaction.TransID);
  };

  const handleExportPDF = async () => {
    await runExportInvoicePDF({
      transaction,
      title: getTransactionTypeLabel(transaction?.TransTypeName, transaction?.TransTypeID, { sectionKey }),
      sectionKey,
      portId,
    });
  };

  const renderOrderedEditItem = useCallback((item) => (
    <TransactionModalEditItem
      key={item.key}
      item={item}
      editForm={editForm}
      setEditForm={setEditForm}
      setField={setField}
      setNumericField={setNumericField}
      traderText={traderText}
      setTraderText={setTraderText}
      localAccounts={localAccounts}
      driversOptions={driversOptions}
      vehiclesOptions={vehiclesOptions}
      goodsOptions={goodsOptions}
      govOptions={govOptions}
      companyOptions={companyOptions}
      getBuiltInFieldLabel={scopedBuiltInFieldLabel}
      onAddAccount={handleAddTraderAccount}
    />
  ), [
    companyOptions,
    driversOptions,
    editForm,
    scopedBuiltInFieldLabel,
    goodsOptions,
    govOptions,
    handleAddTraderAccount,
    localAccounts,
    setField,
    setNumericField,
    traderText,
    vehiclesOptions,
  ]);

  if (!transaction) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-[2px] sm:p-4"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="my-auto w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.04),0_24px_80px_rgba(15,23,42,0.22)] animate-modal-in" onMouseDown={(e) => e.stopPropagation()}>
        <div className="max-h-[92vh] overflow-y-auto">
          <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
            <div className={`border-b border-white/50 bg-gradient-to-r ${accentTone} px-5 py-5 md:px-6`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className={`mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${transaction.TransTypeID === 1 ? 'border-blue-200 bg-white/80 text-blue-700' : 'border-emerald-200 bg-white/80 text-emerald-700'}`}>
                    {transactionLabel}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 md:text-xl">
                    {editMode ? 'تعديل المعاملة' : 'معاينة المعاملة'}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                    <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200/70">{transaction.RefNo || 'بدون رقم'}</span>
                    <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200/70">{transaction.TransDate?.split(' ')[0] || '-'}</span>
                    <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200/70">{transaction.AccountName || transaction.TraderName || '-'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {!editMode && (
                    <>
                      <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-50"
                      >
                        <FileDown size={14} /> PDF
                      </button>
                      {!readOnly && onUpdate && (
                        <button
                          onClick={handleStartEdit}
                          className="flex items-center gap-1.5 rounded-xl border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-700 transition-all hover:bg-primary-50"
                        >
                          <Pencil size={14} /> تعديل
                        </button>
                      )}
                      {!readOnly && onDelete && (
                        <button
                          onClick={handleDelete}
                          className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition-all hover:bg-red-50"
                        >
                          <Trash2 size={14} /> حذف
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => {
                      setEditMode(false);
                      onClose();
                    }}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {editMode ? (
            <TransactionEditSections
              orderedEditSections={orderedEditSections}
              renderOrderedEditItem={renderOrderedEditItem}
              saving={saving}
              onCancel={() => setEditMode(false)}
              onSave={handleUpdate}
            />
          ) : (
            <TransactionPreviewPanel
              transaction={transaction}
              detailItems={detailItems}
              amountUsd={amountUsd}
              amountIqd={amountIqd}
              costUsd={costUsd}
              sectionKey={sectionKey}
            />
          )}
        </div>
        </div>
      </div>
    </ModalPortal>
  );
}


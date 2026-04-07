import { useEffect, useMemo, useState } from 'react';
import { MapPin, RefreshCw, Save, Search, Settings2, Trash2, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import AutocompleteInput from '../components/AutocompleteInput';

const SECTION_OPTIONS = [
  { key: 'port-1', label: 'منفذ السعودية' },
  { key: 'port-2', label: 'منفذ المنذرية' },
  { key: 'port-3', label: 'منفذ القائم' },
  { key: 'transport-1', label: 'النقل' },
  { key: 'partnership-1', label: 'الشراكة' },
  { key: 'fx-1', label: 'الصيرفة' },
];

const CURRENCY_OPTIONS = [
  { value: '', label: 'بدون افتراضي' },
  { value: 'USD', label: 'دولار' },
  { value: 'IQD', label: 'دينار' },
  { value: 'BOTH', label: 'كلاهما' },
];

const createEmptyAccountForm = () => ({
  id: null,
  accountId: null,
  accountName: '',
  defaultCurrency: '',
  defaultDriverId: null,
  defaultDriverName: '',
  defaultVehicleId: null,
  defaultVehicleName: '',
  defaultGoodTypeId: null,
  defaultGoodTypeName: '',
  defaultGovId: null,
  defaultGovName: '',
  defaultCompanyId: null,
  defaultCompanyName: '',
  defaultCarrierId: null,
  defaultCarrierName: '',
  defaultFeeUsd: '',
  defaultSyrCus: '',
  defaultCarQty: '',
  notes: '',
});

const createEmptyRouteForm = () => ({
  id: null,
  govId: null,
  govName: '',
  currency: 'USD',
  defaultTransPrice: '',
  defaultFeeUsd: '',
  defaultCostUsd: '',
  defaultAmountUsd: '',
  defaultCostIqd: '',
  defaultAmountIqd: '',
  notes: '',
});

const accountFieldDefs = [
  { type: 'autocomplete', label: 'التاجر *', source: 'accounts', formId: 'accountId', formText: 'accountName', labelKey: 'AccountName', valueKey: 'AccountID' },
  { type: 'select', label: 'العملة الافتراضية', formId: 'defaultCurrency', options: CURRENCY_OPTIONS },
  { type: 'autocomplete', label: 'السائق', source: 'drivers', formId: 'defaultDriverId', formText: 'defaultDriverName', labelKey: 'DriverName', valueKey: 'DriverID' },
  { type: 'autocomplete', label: 'السيارة', source: 'vehicles', formId: 'defaultVehicleId', formText: 'defaultVehicleName', labelKey: 'PlateNumber', valueKey: 'VehicleID' },
  { type: 'autocomplete', label: 'نوع البضاعة', source: 'goodsTypes', formId: 'defaultGoodTypeId', formText: 'defaultGoodTypeName', labelKey: 'TypeName', valueKey: 'GoodTypeID' },
  { type: 'autocomplete', label: 'المحافظة', source: 'governorates', formId: 'defaultGovId', formText: 'defaultGovName', labelKey: 'GovName', valueKey: 'GovID' },
  { type: 'autocomplete', label: 'الشركة', source: 'companies', formId: 'defaultCompanyId', formText: 'defaultCompanyName', labelKey: 'CompanyName', valueKey: 'CompanyID' },
  { type: 'autocomplete', label: 'الناقل', source: 'accounts', formId: 'defaultCarrierId', formText: 'defaultCarrierName', labelKey: 'AccountName', valueKey: 'AccountID' },
  { type: 'number', label: 'نقل سعودي / رسوم $', formId: 'defaultFeeUsd', step: '0.01' },
  { type: 'number', label: 'كمرك سوري', formId: 'defaultSyrCus', step: '0.01' },
  { type: 'number', label: 'عدد السيارات', formId: 'defaultCarQty', step: '1' },
  { type: 'textarea', label: 'ملاحظات', formId: 'notes', className: 'md:col-span-2' },
];

const routeFieldDefs = [
  { type: 'autocomplete', label: 'المحافظة *', source: 'governorates', formId: 'govId', formText: 'govName', labelKey: 'GovName', valueKey: 'GovID' },
  { type: 'select', label: 'العملة', formId: 'currency', options: CURRENCY_OPTIONS.filter((item) => item.value) },
  { type: 'number', label: 'سعر النقل', formId: 'defaultTransPrice', step: '0.01' },
  { type: 'number', label: 'رسوم / نقل $', formId: 'defaultFeeUsd', step: '0.01' },
  { type: 'number', label: 'الكلفة دولار', formId: 'defaultCostUsd', step: '0.01' },
  { type: 'number', label: 'المبلغ دولار', formId: 'defaultAmountUsd', step: '0.01' },
  { type: 'number', label: 'الكلفة دينار', formId: 'defaultCostIqd', step: '0.01' },
  { type: 'number', label: 'المبلغ دينار', formId: 'defaultAmountIqd', step: '0.01' },
  { type: 'textarea', label: 'ملاحظات', formId: 'notes', className: 'md:col-span-2' },
];

const asInputValue = (value) => (value === null || value === undefined ? '' : String(value));

function showSectionLabel(sectionKey) {
  return SECTION_OPTIONS.find((item) => item.key === sectionKey)?.label || sectionKey;
}

function FieldBlock({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function DefaultRow({ active, title, badges, onSelect, onDelete }) {
  return (
    <div className={`flex items-start justify-between gap-3 px-5 py-4 transition-colors ${active ? 'bg-primary-50/60' : 'hover:bg-slate-50'}`}>
      <button type="button" onClick={onSelect} className="flex-1 text-right">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <div className="mt-2 flex flex-wrap justify-end gap-2 text-[11px] font-semibold text-slate-500">
          {badges.filter(Boolean).map((badge, index) => (
            <span key={`${badge}-${index}`} className="rounded-full bg-slate-100 px-2 py-1">{badge}</span>
          ))}
        </div>
      </button>
      <button type="button" onClick={onDelete} className="rounded-xl bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100" title="حذف">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export default function DefaultsManagementPage({ onBack }) {
  const { api } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [selectedSection, setSelectedSection] = useState(SECTION_OPTIONS[0].key);
  const [search, setSearch] = useState('');
  const [lookups, setLookups] = useState({ accounts: [], drivers: [], vehicles: [], goodsTypes: [], governorates: [], companies: [] });
  const [accountDefaultsList, setAccountDefaultsList] = useState([]);
  const [routeDefaultsList, setRouteDefaultsList] = useState([]);
  const [accountForm, setAccountForm] = useState(createEmptyAccountForm());
  const [routeForm, setRouteForm] = useState(createEmptyRouteForm());
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadLookups = async () => {
    setLoadingLookups(true);
    try {
      const [accounts, drivers, vehicles, goodsTypes, governorates, companies] = await Promise.all([
        api('/accounts'),
        api('/lookups/drivers'),
        api('/lookups/vehicles'),
        api('/lookups/goods-types'),
        api('/lookups/governorates'),
        api('/lookups/companies'),
      ]);
      setLookups({ accounts, drivers, vehicles, goodsTypes, governorates, companies });
    } finally {
      setLoadingLookups(false);
    }
  };

  const loadDefaults = async () => {
    setLoadingDefaults(true);
    try {
      const [accountRows, routeRows] = await Promise.all([
        api(`/defaults/account?sectionKey=${encodeURIComponent(selectedSection)}`),
        api(`/defaults/route?sectionKey=${encodeURIComponent(selectedSection)}`),
      ]);
      setAccountDefaultsList(accountRows);
      setRouteDefaultsList(routeRows);
    } finally {
      setLoadingDefaults(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        await loadLookups();
      } catch (error) {
        if (mounted) setMessage(error.message);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        await loadDefaults();
      } catch (error) {
        if (mounted) setMessage(error.message);
      }
    };
    run();
    return () => { mounted = false; };
  }, [selectedSection]);

  const filteredAccountDefaults = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return accountDefaultsList;
    return accountDefaultsList.filter((row) => [row.accountName, row.defaultDriverName, row.defaultGovName, row.defaultCompanyName].some((value) => String(value || '').toLowerCase().includes(normalized)));
  }, [accountDefaultsList, search]);

  const filteredRouteDefaults = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return routeDefaultsList;
    return routeDefaultsList.filter((row) => [row.govName, row.currency, row.sectionKey].some((value) => String(value || '').toLowerCase().includes(normalized)));
  }, [routeDefaultsList, search]);

  const resetAccountForm = () => setAccountForm(createEmptyAccountForm());
  const resetRouteForm = () => setRouteForm(createEmptyRouteForm());

  const saveAccount = async () => {
    if (!accountForm.accountId) return setMessage('اختر التاجر أولاً');
    setSaving(true);
    try {
      await api('/defaults/account', {
        method: 'POST',
        body: JSON.stringify({
          replace: true,
          accountId: accountForm.accountId,
          sectionKey: selectedSection,
          defaultCurrency: accountForm.defaultCurrency || null,
          defaultDriverId: accountForm.defaultDriverId,
          defaultVehicleId: accountForm.defaultVehicleId,
          defaultGoodTypeId: accountForm.defaultGoodTypeId,
          defaultGovId: accountForm.defaultGovId,
          defaultCompanyId: accountForm.defaultCompanyId,
          defaultCarrierId: accountForm.defaultCarrierId,
          defaultFeeUsd: accountForm.defaultFeeUsd === '' ? null : Number(accountForm.defaultFeeUsd),
          defaultSyrCus: accountForm.defaultSyrCus === '' ? null : Number(accountForm.defaultSyrCus),
          defaultCarQty: accountForm.defaultCarQty === '' ? null : Number(accountForm.defaultCarQty),
          notes: accountForm.notes || null,
        }),
      });
      setMessage('تم حفظ افتراضيات التاجر');
      await loadDefaults();
      resetAccountForm();
    } catch (error) {
      setMessage(error.message);
    }
    setSaving(false);
  };

  const saveRoute = async () => {
    if (!routeForm.govId) return setMessage('اختر المحافظة أولاً');
    setSaving(true);
    try {
      await api('/defaults/route', {
        method: 'POST',
        body: JSON.stringify({
          replace: true,
          sectionKey: selectedSection,
          govId: routeForm.govId,
          currency: routeForm.currency,
          defaultTransPrice: routeForm.defaultTransPrice === '' ? null : Number(routeForm.defaultTransPrice),
          defaultFeeUsd: routeForm.defaultFeeUsd === '' ? null : Number(routeForm.defaultFeeUsd),
          defaultCostUsd: routeForm.defaultCostUsd === '' ? null : Number(routeForm.defaultCostUsd),
          defaultAmountUsd: routeForm.defaultAmountUsd === '' ? null : Number(routeForm.defaultAmountUsd),
          defaultCostIqd: routeForm.defaultCostIqd === '' ? null : Number(routeForm.defaultCostIqd),
          defaultAmountIqd: routeForm.defaultAmountIqd === '' ? null : Number(routeForm.defaultAmountIqd),
          notes: routeForm.notes || null,
        }),
      });
      setMessage('تم حفظ افتراضيات المسار');
      await loadDefaults();
      resetRouteForm();
    } catch (error) {
      setMessage(error.message);
    }
    setSaving(false);
  };

  const removeAccount = async (id) => {
    if (!window.confirm('هل تريد حذف افتراضيات هذا التاجر؟')) return;
    try {
      await api(`/defaults/account/${id}`, { method: 'DELETE' });
      await loadDefaults();
      if (accountForm.id === id) resetAccountForm();
      setMessage('تم حذف افتراضيات التاجر');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const removeRoute = async (id) => {
    if (!window.confirm('هل تريد حذف افتراضيات هذا المسار؟')) return;
    try {
      await api(`/defaults/route/${id}`, { method: 'DELETE' });
      await loadDefaults();
      if (routeForm.id === id) resetRouteForm();
      setMessage('تم حذف افتراضيات المسار');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const renderField = (def, form, setForm) => {
    if (def.type === 'autocomplete') {
      return (
        <FieldBlock key={def.formId} label={def.label} className={def.className}>
          <AutocompleteInput
            value={form[def.formText]}
            options={lookups[def.source]}
            labelKey={def.labelKey}
            valueKey={def.valueKey}
            onChange={(text) => setForm((prev) => ({ ...prev, [def.formText]: text, [def.formId]: null }))}
            onSelect={(option) => setForm((prev) => ({ ...prev, [def.formId]: option[def.valueKey], [def.formText]: option[def.labelKey] }))}
            placeholder="بدون افتراضي"
          />
        </FieldBlock>
      );
    }
    if (def.type === 'select') {
      return (
        <FieldBlock key={def.formId} label={def.label} className={def.className}>
          <select value={form[def.formId]} onChange={(e) => setForm((prev) => ({ ...prev, [def.formId]: e.target.value }))} className="input-field">
            {def.options.map((option) => <option key={option.value || 'empty'} value={option.value}>{option.label}</option>)}
          </select>
        </FieldBlock>
      );
    }
    if (def.type === 'textarea') {
      return (
        <FieldBlock key={def.formId} label={def.label} className={def.className}>
          <textarea value={form[def.formId]} onChange={(e) => setForm((prev) => ({ ...prev, [def.formId]: e.target.value }))} className="input-field min-h-[96px]" />
        </FieldBlock>
      );
    }
    return (
      <FieldBlock key={def.formId} label={def.label} className={def.className}>
        <input type="number" step={def.step} value={form[def.formId]} onChange={(e) => setForm((prev) => ({ ...prev, [def.formId]: e.target.value }))} className="input-field" />
      </FieldBlock>
    );
  };

  return (
    <div className="page-shell">
      <PageHeader title="إدارة الافتراضيات" subtitle="ضبط افتراضيات التاجر والمسار لكل قسم" onBack={onBack}>
        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
          <Settings2 size={14} />
          <span>إدارة تشغيلية</span>
        </div>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-5">
        {message && <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800">{message}</div>}

        <section className="surface-card grid gap-4 p-5 lg:grid-cols-[220px_1fr_auto]">
          <FieldBlock label="القسم">
            <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="input-field">
              {SECTION_OPTIONS.map((section) => <option key={section.key} value={section.key}>{section.label}</option>)}
            </select>
          </FieldBlock>
          <FieldBlock label="بحث داخل السجلات">
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pr-9" placeholder="ابحث باسم التاجر أو المحافظة..." />
            </div>
          </FieldBlock>
          <div className="flex items-end gap-2">
            <button onClick={() => setActiveTab('account')} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${activeTab === 'account' ? 'bg-primary-50 text-primary-800' : 'bg-slate-100 text-slate-600'}`}><User size={16} />افتراضيات التاجر</button>
            <button onClick={() => setActiveTab('route')} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${activeTab === 'route' ? 'bg-primary-50 text-primary-800' : 'bg-slate-100 text-slate-600'}`}><MapPin size={16} />افتراضيات المسار</button>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
          <section className="surface-card overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="text-right">
                <h2 className="text-sm font-bold text-slate-800">{activeTab === 'account' ? 'سجلات افتراضيات التاجر' : 'سجلات افتراضيات المسار'}</h2>
                <p className="mt-1 text-xs text-slate-400">{activeTab === 'account' ? filteredAccountDefaults.length : filteredRouteDefaults.length} سجل</p>
              </div>
              <button onClick={activeTab === 'account' ? resetAccountForm : resetRouteForm} className="btn-outline flex items-center gap-2 text-xs"><RefreshCw size={14} />جديد</button>
            </div>
            <div className="max-h-[780px] overflow-y-auto">
              {loadingDefaults ? <div className="px-5 py-10 text-center text-sm text-slate-400">جارٍ التحميل...</div> : activeTab === 'account' ? filteredAccountDefaults.map((row) => (
                <DefaultRow
                  key={row.id}
                  active={accountForm.id === row.id}
                  title={row.accountName || 'بدون اسم'}
                  badges={[showSectionLabel(row.sectionKey), row.defaultCurrency, row.defaultDriverName && `السائق: ${row.defaultDriverName}`, row.defaultGovName && `المحافظة: ${row.defaultGovName}`, row.defaultCompanyName && `الشركة: ${row.defaultCompanyName}`]}
                  onSelect={() => setAccountForm({ ...createEmptyAccountForm(), ...row, accountName: row.accountName || '', defaultDriverName: row.defaultDriverName || '', defaultVehicleName: row.defaultVehicleName || '', defaultGoodTypeName: row.defaultGoodTypeName || '', defaultGovName: row.defaultGovName || '', defaultCompanyName: row.defaultCompanyName || '', defaultCarrierName: row.defaultCarrierName || '', defaultFeeUsd: asInputValue(row.defaultFeeUsd), defaultSyrCus: asInputValue(row.defaultSyrCus), defaultCarQty: asInputValue(row.defaultCarQty) })}
                  onDelete={() => removeAccount(row.id)}
                />
              )) : filteredRouteDefaults.map((row) => (
                <DefaultRow
                  key={row.id}
                  active={routeForm.id === row.id}
                  title={row.govName || 'بدون محافظة'}
                  badges={[showSectionLabel(row.sectionKey), row.currency, row.defaultTransPrice !== null && `سعر النقل: ${row.defaultTransPrice}`, row.defaultCostUsd !== null && `كلفة $: ${row.defaultCostUsd}`, row.defaultAmountIqd !== null && `مبلغ د.ع: ${row.defaultAmountIqd}`]}
                  onSelect={() => setRouteForm({ ...createEmptyRouteForm(), ...row, govName: row.govName || '', defaultTransPrice: asInputValue(row.defaultTransPrice), defaultFeeUsd: asInputValue(row.defaultFeeUsd), defaultCostUsd: asInputValue(row.defaultCostUsd), defaultAmountUsd: asInputValue(row.defaultAmountUsd), defaultCostIqd: asInputValue(row.defaultCostIqd), defaultAmountIqd: asInputValue(row.defaultAmountIqd) })}
                  onDelete={() => removeRoute(row.id)}
                />
              ))}
              {!loadingDefaults && ((activeTab === 'account' && filteredAccountDefaults.length === 0) || (activeTab === 'route' && filteredRouteDefaults.length === 0)) && (
                <div className="px-5 py-10 text-center text-sm text-slate-400">لا توجد سجلات لهذا القسم.</div>
              )}
            </div>
          </section>

          <section className="surface-card space-y-5 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="text-right">
                <h2 className="text-sm font-bold text-slate-800">{activeTab === 'account' ? (accountForm.id ? 'تعديل افتراضيات التاجر' : 'افتراضيات تاجر جديدة') : (routeForm.id ? 'تعديل افتراضيات المسار' : 'افتراضيات مسار جديدة')}</h2>
                <p className="mt-1 text-xs text-slate-400">{activeTab === 'account' ? 'تُطبَّق على هذا القسم فقط.' : 'تُطبَّق بحسب القسم + المحافظة + العملة.'}</p>
              </div>
              <button onClick={activeTab === 'account' ? resetAccountForm : resetRouteForm} className="btn-outline flex items-center gap-2 text-xs"><RefreshCw size={14} />إعادة ضبط</button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(activeTab === 'account' ? accountFieldDefs : routeFieldDefs).map((def) => renderField(def, activeTab === 'account' ? accountForm : routeForm, activeTab === 'account' ? setAccountForm : setRouteForm))}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button onClick={activeTab === 'account' ? resetAccountForm : resetRouteForm} className="btn-outline">إلغاء</button>
              <button onClick={activeTab === 'account' ? saveAccount : saveRoute} disabled={saving || loadingLookups || loadingDefaults} className="btn-primary flex items-center gap-2">
                <Save size={15} />
                {saving ? 'جارٍ الحفظ...' : activeTab === 'account' ? 'حفظ افتراضيات التاجر' : 'حفظ افتراضيات المسار'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

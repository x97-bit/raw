export const SECTION_OPTIONS = [
  { key: "port-1", label: "منفذ السعودية" },
  { key: "port-2", label: "منفذ المنذرية" },
  { key: "port-3", label: "منفذ القائم" },
  { key: "transport-1", label: "النقل" },
  { key: "partnership-1", label: "الشراكة" },
  { key: "fx-1", label: "الصيرفة" },
];

export const CURRENCY_OPTIONS = [
  { value: "", label: "بدون افتراضي" },
  { value: "USD", label: "دولار" },
  { value: "IQD", label: "دينار" },
  { value: "BOTH", label: "كلاهما" },
];

export function createEmptyAccountForm() {
  return {
    id: null,
    accountId: null,
    accountName: "",
    defaultCurrency: "",
    defaultDriverId: null,
    defaultDriverName: "",
    defaultVehicleId: null,
    defaultVehicleName: "",
    defaultGoodTypeId: null,
    defaultGoodTypeName: "",
    defaultGovId: null,
    defaultGovName: "",
    defaultCompanyId: null,
    defaultCompanyName: "",
    defaultCarrierId: null,
    defaultCarrierName: "",
    defaultFeeUsd: "",
    defaultSyrCus: "",
    defaultCarQty: "",
    notes: "",
  };
}

export function createEmptyRouteForm() {
  return {
    id: null,
    govId: null,
    govName: "",
    currency: "USD",
    defaultTransPrice: "",
    defaultFeeUsd: "",
    defaultCostUsd: "",
    defaultAmountUsd: "",
    defaultCostIqd: "",
    defaultAmountIqd: "",
    notes: "",
  };
}

export const accountFieldDefs = [
  {
    type: "autocomplete",
    label: "التاجر *",
    source: "accounts",
    formId: "accountId",
    formText: "accountName",
    labelKey: "AccountName",
    valueKey: "AccountID",
  },
  {
    type: "select",
    label: "العملة الافتراضية",
    formId: "defaultCurrency",
    options: CURRENCY_OPTIONS,
  },
  {
    type: "autocomplete",
    label: "السائق",
    source: "drivers",
    formId: "defaultDriverId",
    formText: "defaultDriverName",
    labelKey: "DriverName",
    valueKey: "DriverID",
  },
  {
    type: "autocomplete",
    label: "السيارة",
    source: "vehicles",
    formId: "defaultVehicleId",
    formText: "defaultVehicleName",
    labelKey: "PlateNumber",
    valueKey: "VehicleID",
  },
  {
    type: "autocomplete",
    label: "نوع البضاعة",
    source: "goodsTypes",
    formId: "defaultGoodTypeId",
    formText: "defaultGoodTypeName",
    labelKey: "TypeName",
    valueKey: "GoodTypeID",
  },
  {
    type: "autocomplete",
    label: "المحافظة",
    source: "governorates",
    formId: "defaultGovId",
    formText: "defaultGovName",
    labelKey: "GovName",
    valueKey: "GovID",
  },
  {
    type: "autocomplete",
    label: "الشركة",
    source: "companies",
    formId: "defaultCompanyId",
    formText: "defaultCompanyName",
    labelKey: "CompanyName",
    valueKey: "CompanyID",
  },
  {
    type: "autocomplete",
    label: "الناقل",
    source: "accounts",
    formId: "defaultCarrierId",
    formText: "defaultCarrierName",
    labelKey: "AccountName",
    valueKey: "AccountID",
  },
  {
    type: "number",
    label: "نقل سعودي / رسوم $",
    formId: "defaultFeeUsd",
    step: "0.01",
  },
  { type: "number", label: "كمرك سوري", formId: "defaultSyrCus", step: "0.01" },
  { type: "number", label: "عدد السيارات", formId: "defaultCarQty", step: "1" },
  {
    type: "textarea",
    label: "ملاحظات",
    formId: "notes",
    className: "md:col-span-2",
  },
];

export const routeFieldDefs = [
  {
    type: "autocomplete",
    label: "المحافظة *",
    source: "governorates",
    formId: "govId",
    formText: "govName",
    labelKey: "GovName",
    valueKey: "GovID",
  },
  {
    type: "select",
    label: "العملة",
    formId: "currency",
    options: CURRENCY_OPTIONS.filter(item => item.value),
  },
  {
    type: "number",
    label: "سعر النقل",
    formId: "defaultTransPrice",
    step: "0.01",
  },
  {
    type: "number",
    label: "رسوم / نقل $",
    formId: "defaultFeeUsd",
    step: "0.01",
  },
  {
    type: "number",
    label: "الكلفة دولار",
    formId: "defaultCostUsd",
    step: "0.01",
  },
  {
    type: "number",
    label: "المبلغ دولار",
    formId: "defaultAmountUsd",
    step: "0.01",
  },
  {
    type: "number",
    label: "الكلفة دينار",
    formId: "defaultCostIqd",
    step: "0.01",
  },
  {
    type: "number",
    label: "المبلغ دينار",
    formId: "defaultAmountIqd",
    step: "0.01",
  },
  {
    type: "textarea",
    label: "ملاحظات",
    formId: "notes",
    className: "md:col-span-2",
  },
];

export function showSectionLabel(sectionKey) {
  return (
    SECTION_OPTIONS.find(item => item.key === sectionKey)?.label || sectionKey
  );
}

import {
  createEmptyAccountForm,
  createEmptyRouteForm,
} from './defaultsManagementConfig';

export function asInputValue(value) {
  return value === null || value === undefined ? '' : String(value);
}

export function filterDefaultsRows(rows, search, keys) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) {
    return rows;
  }

  return rows.filter((row) => (
    keys.some((key) => String(row?.[key] || '').toLowerCase().includes(normalizedSearch))
  ));
}

export function buildAccountDefaultsPayload(form, sectionKey) {
  return {
    replace: true,
    accountId: form.accountId,
    sectionKey,
    defaultCurrency: form.defaultCurrency || null,
    defaultDriverId: form.defaultDriverId,
    defaultVehicleId: form.defaultVehicleId,
    defaultGoodTypeId: form.defaultGoodTypeId,
    defaultGovId: form.defaultGovId,
    defaultCompanyId: form.defaultCompanyId,
    defaultCarrierId: form.defaultCarrierId,
    defaultFeeUsd: form.defaultFeeUsd === '' ? null : Number(form.defaultFeeUsd),
    defaultSyrCus: form.defaultSyrCus === '' ? null : Number(form.defaultSyrCus),
    defaultCarQty: form.defaultCarQty === '' ? null : Number(form.defaultCarQty),
    notes: form.notes || null,
  };
}

export function buildRouteDefaultsPayload(form, sectionKey) {
  return {
    replace: true,
    sectionKey,
    govId: form.govId,
    currency: form.currency,
    defaultTransPrice: form.defaultTransPrice === '' ? null : Number(form.defaultTransPrice),
    defaultFeeUsd: form.defaultFeeUsd === '' ? null : Number(form.defaultFeeUsd),
    defaultCostUsd: form.defaultCostUsd === '' ? null : Number(form.defaultCostUsd),
    defaultAmountUsd: form.defaultAmountUsd === '' ? null : Number(form.defaultAmountUsd),
    defaultCostIqd: form.defaultCostIqd === '' ? null : Number(form.defaultCostIqd),
    defaultAmountIqd: form.defaultAmountIqd === '' ? null : Number(form.defaultAmountIqd),
    notes: form.notes || null,
  };
}

export function createAccountFormFromRow(row) {
  return {
    ...createEmptyAccountForm(),
    ...row,
    accountName: row.accountName || '',
    defaultDriverName: row.defaultDriverName || '',
    defaultVehicleName: row.defaultVehicleName || '',
    defaultGoodTypeName: row.defaultGoodTypeName || '',
    defaultGovName: row.defaultGovName || '',
    defaultCompanyName: row.defaultCompanyName || '',
    defaultCarrierName: row.defaultCarrierName || '',
    defaultFeeUsd: asInputValue(row.defaultFeeUsd),
    defaultSyrCus: asInputValue(row.defaultSyrCus),
    defaultCarQty: asInputValue(row.defaultCarQty),
  };
}

export function createRouteFormFromRow(row) {
  return {
    ...createEmptyRouteForm(),
    ...row,
    govName: row.govName || '',
    defaultTransPrice: asInputValue(row.defaultTransPrice),
    defaultFeeUsd: asInputValue(row.defaultFeeUsd),
    defaultCostUsd: asInputValue(row.defaultCostUsd),
    defaultAmountUsd: asInputValue(row.defaultAmountUsd),
    defaultCostIqd: asInputValue(row.defaultCostIqd),
    defaultAmountIqd: asInputValue(row.defaultAmountIqd),
  };
}

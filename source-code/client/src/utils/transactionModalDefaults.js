const hasValue = value => value !== undefined && value !== null && value !== "";

const normalizeVisibleFieldKeys = visibleFieldKeys =>
  visibleFieldKeys instanceof Set
    ? visibleFieldKeys
    : new Set(visibleFieldKeys || []);

export function buildTransactionModalSeed(transaction = {}) {
  return {
    ...transaction,
    _driverText: transaction.DriverName || "",
    _vehicleText: transaction.PlateNumber || transaction.VehiclePlate || "",
    _goodText: transaction.GoodTypeName || transaction.GoodType || "",
    _govText: transaction.GovName || transaction.Governorate || "",
    _companyText: transaction.CompanyName || "",
    _carrierText: transaction.CarrierName || "",
  };
}

export function parseNumericInput(rawValue, parser = Number) {
  if (rawValue === "" || rawValue === null || rawValue === undefined) return "";
  const parsed = parser(rawValue);
  return Number.isNaN(parsed) ? "" : parsed;
}

export function applyDefaultsToTransactionDraft(
  draft = {},
  defaults = {},
  visibleFieldKeys = []
) {
  const visible = normalizeVisibleFieldKeys(visibleFieldKeys);
  const next = { ...draft };
  const canFillField = fieldKey => visible.size === 0 || visible.has(fieldKey);
  const fill = (fieldKey, value, visibleFieldKey = fieldKey) => {
    if (!canFillField(visibleFieldKey)) return;
    if (hasValue(next[fieldKey]) || !hasValue(value)) return;
    next[fieldKey] = value;
  };

  fill("Currency", defaults.Currency, "currency");
  fill("DriverID", defaults.DriverID, "driver_name");
  fill("VehicleID", defaults.VehicleID, "vehicle_plate");
  fill("GoodTypeID", defaults.GoodTypeID, "good_type");
  fill("GovID", defaults.GovID, "gov_name");
  fill("CompanyID", defaults.CompanyID, "company_name");
  fill("CarrierID", defaults.CarrierID, "carrier_name");
  fill("CostUSD", defaults.CostUSD, "cost_usd");
  fill("AmountUSD", defaults.AmountUSD, "amount_usd");
  fill("CostIQD", defaults.CostIQD, "cost_iqd");
  fill("AmountIQD", defaults.AmountIQD, "amount_iqd");
  fill("FeeUSD", defaults.FeeUSD, "fee_usd");
  fill("SyrCus", defaults.SyrCus, "syr_cus");
  fill("CarQty", defaults.CarQty, "car_qty");
  fill("TransPrice", defaults.TransPrice, "trans_price");

  if (
    canFillField("driver_name") &&
    !hasValue(next._driverText) &&
    hasValue(defaults.DriverName) &&
    (!hasValue(next.DriverID) || next.DriverID === defaults.DriverID)
  ) {
    next._driverText = defaults.DriverName;
  }
  if (
    canFillField("vehicle_plate") &&
    !hasValue(next._vehicleText) &&
    hasValue(defaults.VehiclePlate) &&
    (!hasValue(next.VehicleID) || next.VehicleID === defaults.VehicleID)
  ) {
    next._vehicleText = defaults.VehiclePlate;
  }
  if (
    canFillField("good_type") &&
    !hasValue(next._goodText) &&
    hasValue(defaults.GoodTypeName) &&
    (!hasValue(next.GoodTypeID) || next.GoodTypeID === defaults.GoodTypeID)
  ) {
    next._goodText = defaults.GoodTypeName;
  }
  if (
    canFillField("gov_name") &&
    !hasValue(next._govText) &&
    hasValue(defaults.GovName) &&
    (!hasValue(next.GovID) || next.GovID === defaults.GovID)
  ) {
    next._govText = defaults.GovName;
  }
  if (
    canFillField("company_name") &&
    !hasValue(next._companyText) &&
    hasValue(defaults.CompanyName) &&
    (!hasValue(next.CompanyID) || next.CompanyID === defaults.CompanyID)
  ) {
    next._companyText = defaults.CompanyName;
  }
  if (
    canFillField("carrier_name") &&
    !hasValue(next._carrierText) &&
    hasValue(defaults.CarrierName) &&
    (!hasValue(next.CarrierID) || next.CarrierID === defaults.CarrierID)
  ) {
    next._carrierText = defaults.CarrierName;
  }

  return next;
}

import {
  getDefaultSpecialAccountName,
  hasAnyBodyKey,
  hasBodyValue,
  normalizeDateValue,
  normalizeDecimal,
  normalizeInteger,
  normalizeText,
  pickBodyField,
} from "./specialAccountShared";

export function buildSpecialAccountMutationData(
  body: Record<string, any>,
  fallbackType?: string,
  options: { partial?: boolean } = {},
) {
  const partial = options.partial ?? false;
  const resolvedType = normalizeText(pickBodyField(body, "type", "Type") ?? fallbackType, fallbackType || "") || "";
  const data: Record<string, any> = {};

  const assign = (
    outputKey: string,
    inputKeys: string[],
    transform: (value: unknown) => unknown,
    fallbackValue?: unknown,
  ) => {
    if (partial && !hasAnyBodyKey(body, inputKeys)) return;
    const rawValue = pickBodyField(body, ...inputKeys);
    const sourceValue = rawValue === undefined ? fallbackValue : rawValue;
    data[outputKey] = transform(sourceValue);
  };

  if (!partial || fallbackType !== undefined || hasAnyBodyKey(body, ["type", "Type"])) {
    data.type = resolvedType;
  }

  assign(
    "name",
    ["name", "Name", "title", "Title"],
    (value) => normalizeText(value, getDefaultSpecialAccountName(resolvedType)),
    getDefaultSpecialAccountName(resolvedType),
  );
  assign("traderName", ["traderName", "TraderName"], (value) => normalizeText(value));
  assign("driverName", ["driverName", "DriverName"], (value) => normalizeText(value));
  assign("vehiclePlate", ["vehiclePlate", "VehiclePlate", "PlateNumber"], (value) => normalizeText(value));
  assign("goodType", ["goodType", "GoodType", "GoodTypeName"], (value) => normalizeText(value));
  assign("govName", ["govName", "GovName"], (value) => normalizeText(value));
  assign("portName", ["portName", "PortName", "port", "Port"], (value) => normalizeText(value));
  assign("companyName", ["companyName", "CompanyName"], (value) => normalizeText(value));
  assign("batchName", ["batchName", "BatchName"], (value) => normalizeText(value));
  assign("destination", ["destination", "Destination"], (value) => normalizeText(value));
  assign("amountUSD", ["amountUSD", "AmountUSD"], (value) => normalizeDecimal(value, true) ?? "0", "0");
  assign("amountIQD", ["amountIQD", "AmountIQD"], (value) => normalizeDecimal(value, true) ?? "0", "0");
  assign("costUSD", ["costUSD", "CostUSD"], (value) => normalizeDecimal(value, true) ?? "0", "0");
  assign("costIQD", ["costIQD", "CostIQD"], (value) => normalizeDecimal(value, true) ?? "0", "0");
  assign(
    "amountUSDPartner",
    ["amountUSDPartner", "AmountUSDPartner", "AmountUSD_Partner"],
    (value) => normalizeDecimal(value, true) ?? "0",
    "0",
  );
  assign("differenceIQD", ["differenceIQD", "DifferenceIQD"], (value) => normalizeDecimal(value, true) ?? "0", "0");
  assign("clr", ["clr", "CLR"], (value) => normalizeDecimal(value, true) ?? "0", "0");
  assign("tx", ["tx", "TX"], (value) => normalizeDecimal(value, true) ?? "0", "0");
  assign("taxiWater", ["taxiWater", "TaxiWater"], (value) => normalizeDecimal(value, true) ?? "0", "0");
  assign("weight", ["weight", "Weight"], (value) => normalizeDecimal(value));
  assign("meters", ["meters", "Meters"], (value) => normalizeDecimal(value));
  assign("qty", ["qty", "Qty"], (value) => normalizeInteger(value));
  assign("date", ["date", "Date", "TransDate"], (value) => normalizeDateValue(value));
  assign("notes", ["notes", "Notes"], (value) => normalizeText(value, ""));

  if (!partial || hasAnyBodyKey(body, ["description", "Description", "notes", "Notes"])) {
    data.description = normalizeText(pickBodyField(body, "description", "Description", "notes", "Notes"), "");
  }

  return data;
}

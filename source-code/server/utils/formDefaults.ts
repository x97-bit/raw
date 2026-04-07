type Nullable<T> = T | null | undefined;

type NamedRef = {
  id?: Nullable<number>;
  name?: Nullable<string>;
};

type AccountDefaultSource = {
  defaultCurrency?: Nullable<string>;
  defaultDriver?: Nullable<NamedRef>;
  defaultVehicle?: Nullable<NamedRef>;
  defaultGoodType?: Nullable<NamedRef>;
  defaultGov?: Nullable<NamedRef>;
  defaultCompany?: Nullable<NamedRef>;
  defaultCarrier?: Nullable<NamedRef>;
  defaultFeeUsd?: Nullable<number>;
  defaultSyrCus?: Nullable<number>;
  defaultCarQty?: Nullable<number>;
};

type RouteDefaultSource = {
  gov?: Nullable<NamedRef>;
  defaultTransPrice?: Nullable<number>;
  defaultFeeUsd?: Nullable<number>;
  defaultCostUsd?: Nullable<number>;
  defaultAmountUsd?: Nullable<number>;
  defaultCostIqd?: Nullable<number>;
  defaultAmountIqd?: Nullable<number>;
};

type RecentTransactionSource = {
  Currency?: Nullable<string>;
  DriverID?: Nullable<number>;
  DriverName?: Nullable<string>;
  VehicleID?: Nullable<number>;
  VehiclePlate?: Nullable<string>;
  GoodTypeID?: Nullable<number>;
  GoodTypeName?: Nullable<string>;
  GovID?: Nullable<number>;
  Governorate?: Nullable<string>;
  CompanyID?: Nullable<number>;
  CompanyName?: Nullable<string>;
  CarrierID?: Nullable<number>;
  CarrierName?: Nullable<string>;
  CostUSD?: Nullable<number>;
  AmountUSD?: Nullable<number>;
  CostIQD?: Nullable<number>;
  AmountIQD?: Nullable<number>;
  FeeUSD?: Nullable<number>;
  SyrCus?: Nullable<number>;
  CarQty?: Nullable<number>;
  TransPrice?: Nullable<number>;
};

type BuildTransactionFormDefaultsInput = {
  accountCurrency?: Nullable<string>;
  accountDefaults?: Nullable<AccountDefaultSource>;
  routeDefaults?: Nullable<RouteDefaultSource>;
  recentTransaction?: Nullable<RecentTransactionSource>;
};

const hasValue = (value: unknown) => value !== undefined && value !== null && value !== '';

const firstDefined = <T>(...values: Array<Nullable<T>>): T | null => {
  for (const value of values) {
    if (hasValue(value)) return value as T;
  }
  return null;
};

export function buildTransactionFormDefaults({
  accountCurrency,
  accountDefaults,
  routeDefaults,
  recentTransaction,
}: BuildTransactionFormDefaultsInput) {
  const currency = firstDefined(
    accountDefaults?.defaultCurrency,
    recentTransaction?.Currency,
    accountCurrency,
  );

  const govId = firstDefined(
    accountDefaults?.defaultGov?.id,
    routeDefaults?.gov?.id,
    recentTransaction?.GovID,
  );

  const govName = firstDefined(
    accountDefaults?.defaultGov?.name,
    routeDefaults?.gov?.name,
    recentTransaction?.Governorate,
  );

  return {
    Currency: currency,
    DriverID: firstDefined(accountDefaults?.defaultDriver?.id, recentTransaction?.DriverID),
    DriverName: firstDefined(accountDefaults?.defaultDriver?.name, recentTransaction?.DriverName),
    VehicleID: firstDefined(accountDefaults?.defaultVehicle?.id, recentTransaction?.VehicleID),
    VehiclePlate: firstDefined(accountDefaults?.defaultVehicle?.name, recentTransaction?.VehiclePlate),
    GoodTypeID: firstDefined(accountDefaults?.defaultGoodType?.id, recentTransaction?.GoodTypeID),
    GoodTypeName: firstDefined(accountDefaults?.defaultGoodType?.name, recentTransaction?.GoodTypeName),
    GovID: govId,
    GovName: govName,
    CompanyID: firstDefined(accountDefaults?.defaultCompany?.id, recentTransaction?.CompanyID),
    CompanyName: firstDefined(accountDefaults?.defaultCompany?.name, recentTransaction?.CompanyName),
    CarrierID: firstDefined(accountDefaults?.defaultCarrier?.id, recentTransaction?.CarrierID),
    CarrierName: firstDefined(accountDefaults?.defaultCarrier?.name, recentTransaction?.CarrierName),
    CostUSD: firstDefined(routeDefaults?.defaultCostUsd, recentTransaction?.CostUSD),
    AmountUSD: firstDefined(routeDefaults?.defaultAmountUsd, recentTransaction?.AmountUSD),
    CostIQD: firstDefined(routeDefaults?.defaultCostIqd, recentTransaction?.CostIQD),
    AmountIQD: firstDefined(routeDefaults?.defaultAmountIqd, recentTransaction?.AmountIQD),
    FeeUSD: firstDefined(accountDefaults?.defaultFeeUsd, routeDefaults?.defaultFeeUsd, recentTransaction?.FeeUSD),
    SyrCus: firstDefined(accountDefaults?.defaultSyrCus, recentTransaction?.SyrCus),
    CarQty: firstDefined(accountDefaults?.defaultCarQty, recentTransaction?.CarQty),
    TransPrice: firstDefined(routeDefaults?.defaultTransPrice, recentTransaction?.TransPrice),
    source: {
      accountDefaults: Boolean(accountDefaults),
      routeDefaults: Boolean(routeDefaults),
      recentTransaction: Boolean(recentTransaction),
    },
  };
}

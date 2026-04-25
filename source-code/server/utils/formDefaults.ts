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

const hasValue = (value: unknown) =>
  value !== undefined && value !== null && value !== "";

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
    accountCurrency
  );

  const govId = firstDefined(
    accountDefaults?.defaultGov?.id,
    routeDefaults?.gov?.id,
    recentTransaction?.GovID
  );

  const govName = firstDefined(
    accountDefaults?.defaultGov?.name,
    routeDefaults?.gov?.name,
    recentTransaction?.Governorate
  );

  return {
    Currency: currency,
    DriverID: firstDefined(accountDefaults?.defaultDriver?.id),
    DriverName: firstDefined(accountDefaults?.defaultDriver?.name),
    VehicleID: firstDefined(accountDefaults?.defaultVehicle?.id),
    VehiclePlate: firstDefined(accountDefaults?.defaultVehicle?.name),
    GoodTypeID: firstDefined(accountDefaults?.defaultGoodType?.id),
    GoodTypeName: firstDefined(accountDefaults?.defaultGoodType?.name),
    GovID: govId,
    GovName: govName,
    CompanyID: firstDefined(accountDefaults?.defaultCompany?.id),
    CompanyName: firstDefined(accountDefaults?.defaultCompany?.name),
    CarrierID: firstDefined(accountDefaults?.defaultCarrier?.id),
    CarrierName: firstDefined(accountDefaults?.defaultCarrier?.name),
    CostUSD: firstDefined(routeDefaults?.defaultCostUsd),
    AmountUSD: firstDefined(routeDefaults?.defaultAmountUsd),
    CostIQD: firstDefined(routeDefaults?.defaultCostIqd),
    AmountIQD: firstDefined(routeDefaults?.defaultAmountIqd),
    FeeUSD: firstDefined(
      accountDefaults?.defaultFeeUsd,
      routeDefaults?.defaultFeeUsd
    ),
    SyrCus: firstDefined(accountDefaults?.defaultSyrCus),
    CarQty: firstDefined(accountDefaults?.defaultCarQty),
    TransPrice: firstDefined(routeDefaults?.defaultTransPrice),
    source: {
      accountDefaults: Boolean(accountDefaults),
      routeDefaults: Boolean(routeDefaults),
      recentTransaction: false,
    },
  };
}

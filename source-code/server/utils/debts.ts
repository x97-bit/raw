export const DEBT_STATUS_LABELS = {
  pending: 'غير مسدد',
  partial: 'تسديد جزئي',
  paid: 'مسدد',
};

function hasBodyValue(value: unknown) {
  return value !== undefined && value !== null && value !== '';
}

function hasAnyBodyKey(body: Record<string, any>, keys: string[]) {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(body ?? {}, key));
}

function pickBodyField(body: Record<string, any>, ...keys: string[]) {
  for (const key of keys) {
    if (hasBodyValue(body?.[key])) return body[key];
  }
  return undefined;
}

function normalizeText(value: unknown, emptyValue: string | null = null) {
  if (!hasBodyValue(value)) return emptyValue;
  const normalized = String(value).trim();
  return normalized || emptyValue;
}

function normalizeDecimal(value: unknown, zeroFallback = false) {
  if (!hasBodyValue(value)) return zeroFallback ? '0' : null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return zeroFallback ? '0' : null;
  return String(parsed);
}

export function normalizeDebtStatus(value: unknown): 'pending' | 'partial' | 'paid' {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (['paid', 'مسدد', 'settled'].includes(normalized)) return 'paid';
  if (['partial', 'جزئي', 'تسديد جزئي', 'partial payment'].includes(normalized)) return 'partial';
  return 'pending';
}

export function getDebtStatusLabel(value: unknown) {
  return DEBT_STATUS_LABELS[normalizeDebtStatus(value)];
}

export function mapDebtRow(d: any) {
  const amountUSD = d.amountUSD ? parseFloat(d.amountUSD) : 0;
  const amountIQD = d.amountIQD ? parseFloat(d.amountIQD) : 0;
  const paidAmountUSD = d.paidAmountUSD ? parseFloat(d.paidAmountUSD) : 0;
  const paidAmountIQD = d.paidAmountIQD ? parseFloat(d.paidAmountIQD) : 0;

  return {
    ...d,
    DebtID: d.id,
    TransDate: d.date,
    AccountID: d.debtorName,
    AccountName: d.debtorName,
    AmountUSD: amountUSD,
    AmountIQD: amountIQD,
    FeeUSD: d.feeUSD ? parseFloat(d.feeUSD) : 0,
    FeeIQD: d.feeIQD ? parseFloat(d.feeIQD) : 0,
    PaidAmountUSD: paidAmountUSD,
    PaidAmountIQD: paidAmountIQD,
    RemainingUSD: amountUSD - paidAmountUSD,
    RemainingIQD: amountIQD - paidAmountIQD,
    FXRate: d.fxRate ? parseFloat(d.fxRate) : null,
    DriverName: d.driverName || '',
    VehiclePlate: d.carNumber || '',
    CarNumber: d.carNumber || '',
    GoodTypeName: d.goodType || '',
    GoodType: d.goodType || '',
    Weight: d.weight ? parseFloat(d.weight) : null,
    Meters: d.meters ? parseFloat(d.meters) : null,
    State: d.state || getDebtStatusLabel(d.status),
    Status: normalizeDebtStatus(d.status),
    TransType: d.transType || 'debt',
    FxNote: d.fxNote || '',
    Notes: d.description,
  };
}

export function buildDebtMutationData(
  body: Record<string, any>,
  resolvedDebtorName?: string | null,
  options: { partial?: boolean; now?: string } = {},
) {
  const partial = options.partial ?? false;
  const now = options.now || new Date().toISOString().split('T')[0];
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

  if (!partial || resolvedDebtorName !== undefined || hasAnyBodyKey(body, ['debtorName', 'accountName', 'AccountName', 'AccountID', 'accountId', 'account_id'])) {
    data.debtorName = normalizeText(
      resolvedDebtorName ?? pickBodyField(body, 'debtorName', 'accountName', 'AccountName', 'AccountID', 'accountId', 'account_id'),
      '',
    );
  }

  assign('amountUSD', ['amountUSD', 'AmountUSD'], (value) => normalizeDecimal(value, true) ?? '0', '0');
  assign('amountIQD', ['amountIQD', 'AmountIQD'], (value) => normalizeDecimal(value, true) ?? '0', '0');
  assign('feeUSD', ['feeUSD', 'FeeUSD'], (value) => normalizeDecimal(value, true) ?? '0', '0');
  assign('feeIQD', ['feeIQD', 'FeeIQD'], (value) => normalizeDecimal(value, true) ?? '0', '0');
  assign('paidAmountUSD', ['paidAmountUSD', 'PaidAmountUSD'], (value) => normalizeDecimal(value, true) ?? '0', '0');
  assign('paidAmountIQD', ['paidAmountIQD', 'PaidAmountIQD'], (value) => normalizeDecimal(value, true) ?? '0', '0');
  assign('transType', ['transType', 'TransType'], (value) => normalizeText(value));
  assign('fxRate', ['fxRate', 'FXRate'], (value) => normalizeDecimal(value));
  assign('driverName', ['driverName', 'DriverName'], (value) => normalizeText(value));
  assign('carNumber', ['carNumber', 'CarNumber', 'VehiclePlate'], (value) => normalizeText(value));
  assign('goodType', ['goodType', 'GoodType', 'GoodTypeName'], (value) => normalizeText(value));
  assign('weight', ['weight', 'Weight'], (value) => normalizeDecimal(value));
  assign('meters', ['meters', 'Meters'], (value) => normalizeDecimal(value));
  assign('description', ['description', 'Notes'], (value) => normalizeText(value, ''));
  assign('date', ['date', 'TransDate'], (value) => normalizeText(value, now), now);
  assign('status', ['status', 'Status', 'State'], (value) => normalizeDebtStatus(value), 'pending');
  assign('state', ['state', 'State'], (value) => normalizeText(value));
  assign('fxNote', ['fxNote', 'FxNote'], (value) => normalizeText(value));

  return data;
}

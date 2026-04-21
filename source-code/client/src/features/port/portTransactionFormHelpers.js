const TRANSIENT_PORT_FORM_KEYS = [
  '_driverText',
  '_vehicleText',
  '_goodText',
  '_govText',
  '_carrierText',
  '_companyText',
  '_newDriverName',
  '_newPlateNumber',
  '_newGoodType',
  '_newGovName',
];

export function sanitizePortTransactionPayload(form = {}) {
  const payload = { ...form };
  if (!payload.GovID && payload._govText?.trim()) {
    payload.GovName = payload._govText.trim();
  }
  TRANSIENT_PORT_FORM_KEYS.forEach((key) => {
    delete payload[key];
  });
  return payload;
}

export function buildPortAccountPayload({ traderText, accountType, portId }) {
  return {
    AccountName: traderText.trim(),
    AccountTypeID: accountType || 1,
    DefaultPortID: portId || null,
  };
}

export function getPortTransactionTarget(transactionOrType) {
  const typeId = typeof transactionOrType === 'object'
    ? transactionOrType?.TransTypeID
    : transactionOrType;
  if (typeId === 2) return 'payment';
  if (typeId === 3) return 'debit-note';
  return 'invoice';
}

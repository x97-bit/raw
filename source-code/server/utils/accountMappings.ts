export function mapAccount(account: any) {
  return {
    ...account,
    AccountID: account.id,
    AccountName: account.name,
    AccountTypeID: account.accountType,
    DefaultPortID: account.portId,
    Phone: account.phone,
    Notes: account.notes,
  };
}

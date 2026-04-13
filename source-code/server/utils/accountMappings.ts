import { accounts } from "../../drizzle/schema";

type AccountRow = typeof accounts.$inferSelect;

export function mapAccount(account: AccountRow) {
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

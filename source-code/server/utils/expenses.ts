import { expenses } from "../../drizzle/schema";
import { mapTransaction } from "./transactionEnrichment";

type ExpenseRow = typeof expenses.$inferSelect;

export type NormalizedExpenseChargeTarget = "port" | "trader";

export function parseStoredExpenseAmount(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeExpenseChargeTarget(value: unknown): NormalizedExpenseChargeTarget {
  return String(value || "").trim().toLowerCase() === "trader" ? "trader" : "port";
}

export function mapExpenseRow(expense: ExpenseRow) {
  return {
    ...expense,
    chargeTarget: normalizeExpenseChargeTarget(expense.chargeTarget),
    amountUSD: parseStoredExpenseAmount(expense.amountUSD),
    amountIQD: parseStoredExpenseAmount(expense.amountIQD),
    accountId: expense.accountId ? Number(expense.accountId) : null,
    accountName: expense.accountName || "",
  };
}

export function buildExpenseTotals(rows: ExpenseRow[]) {
  return rows.reduce((totals, expense) => {
    const chargeTarget = normalizeExpenseChargeTarget(expense.chargeTarget);
    const amountUSD = parseStoredExpenseAmount(expense.amountUSD);
    const amountIQD = parseStoredExpenseAmount(expense.amountIQD);

    totals.totalUSD += amountUSD;
    totals.totalIQD += amountIQD;
    totals.count += 1;

    if (chargeTarget === "trader") {
      totals.chargedToTraderUSD += amountUSD;
      totals.chargedToTraderIQD += amountIQD;
      totals.chargedToTraderCount += 1;
    } else {
      totals.directExpenseUSD += amountUSD;
      totals.directExpenseIQD += amountIQD;
      totals.directExpenseCount += 1;
    }

    return totals;
  }, {
    totalUSD: 0,
    totalIQD: 0,
    count: 0,
    directExpenseUSD: 0,
    directExpenseIQD: 0,
    directExpenseCount: 0,
    chargedToTraderUSD: 0,
    chargedToTraderIQD: 0,
    chargedToTraderCount: 0,
  });
}

export function mapChargedExpenseToStatementRow(expense: ExpenseRow, fallbackAccountName = "") {
  const mapped = mapTransaction({
    id: -Number(expense.id || 0),
    refNo: `EXP-${expense.id}`,
    direction: "IN",
    transDate: expense.expenseDate || "",
    accountId: Number(expense.accountId || 0),
    amountUsd: expense.amountUSD,
    amountIqd: expense.amountIQD,
    costUsd: "0",
    costIqd: "0",
    notes: expense.description,
    traderNote: "مصروف محمل على التاجر",
    recordType: "expense-charge",
    portId: expense.portId || null,
    accountType: null,
    _accountName: expense.accountName || fallbackAccountName,
  });

  return {
    ...mapped,
    ExpenseID: Number(expense.id || 0),
    TransTypeID: 3,
    TransTypeName: "مصروف محمل على التاجر",
    ChargeTarget: "trader",
    SourceType: "expense",
  };
}

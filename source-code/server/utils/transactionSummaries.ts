import { getAbsoluteAmount, getSignedDirectionAmount, isInvoiceDirection, isPaymentDirection } from "./direction";

type TransactionLike = Record<string, unknown>;

function getTransactionDirectionValue(transaction: TransactionLike): unknown {
  if (transaction.direction !== undefined && transaction.direction !== null && transaction.direction !== "") {
    return transaction.direction;
  }
  if (transaction.TransTypeID === 1 || transaction.TransTypeID === "1") return "IN";
  if (transaction.TransTypeID === 2 || transaction.TransTypeID === "2") return "OUT";
  return transaction.TransTypeName;
}

function getAmountValue(transaction: TransactionLike, rawKey: string, mappedKey: string): unknown {
  if (transaction[rawKey] !== undefined && transaction[rawKey] !== null && transaction[rawKey] !== "") {
    return transaction[rawKey];
  }
  return transaction[mappedKey];
}

export function calculateTransactionTotals(transactions: TransactionLike[]) {
  const totals = {
    count: transactions.length,
    invoiceCount: 0,
    paymentCount: 0,
    shipmentCount: 0,
    totalInvoicesUSD: 0,
    totalInvoicesIQD: 0,
    totalPaymentsUSD: 0,
    totalPaymentsIQD: 0,
    totalCostUSD: 0,
    totalCostIQD: 0,
    totalProfitUSD: 0,
    totalProfitIQD: 0,
    totalFeeUSD: 0,
    balanceUSD: 0,
    balanceIQD: 0,
  };

  for (const transaction of transactions || []) {
    const direction = getTransactionDirectionValue(transaction);
    const amountUsd = getAbsoluteAmount(getAmountValue(transaction, "amountUsd", "AmountUSD"));
    const amountIqd = getAbsoluteAmount(getAmountValue(transaction, "amountIqd", "AmountIQD"));
    const costUsd = getAbsoluteAmount(getAmountValue(transaction, "costUsd", "CostUSD"));
    const costIqd = getAbsoluteAmount(getAmountValue(transaction, "costIqd", "CostIQD"));
    const feeUsd = getAbsoluteAmount(getAmountValue(transaction, "feeUsd", "FeeUSD"));

    if (isInvoiceDirection(direction)) {
      totals.invoiceCount += 1;
      totals.shipmentCount += 1;
      totals.totalInvoicesUSD += amountUsd;
      totals.totalInvoicesIQD += amountIqd;
      totals.totalCostUSD += costUsd;
      totals.totalCostIQD += costIqd;
      totals.totalFeeUSD += feeUsd;
    } else if (isPaymentDirection(direction)) {
      totals.paymentCount += 1;
      totals.totalPaymentsUSD += amountUsd;
      totals.totalPaymentsIQD += amountIqd;
    }
  }

  totals.totalProfitUSD = totals.totalInvoicesUSD - totals.totalCostUSD;
  totals.totalProfitIQD = totals.totalInvoicesIQD - totals.totalCostIQD;
  totals.balanceUSD = totals.totalInvoicesUSD - totals.totalPaymentsUSD;
  totals.balanceIQD = totals.totalInvoicesIQD - totals.totalPaymentsIQD;

  return totals;
}

export function addRunningBalances<T extends TransactionLike>(transactions: T[]) {
  let runningUSD = 0;
  let runningIQD = 0;

  return (transactions || []).map((transaction) => {
    const direction = getTransactionDirectionValue(transaction);
    const amountUsd = getAmountValue(transaction, "amountUsd", "AmountUSD");
    const amountIqd = getAmountValue(transaction, "amountIqd", "AmountIQD");

    runningUSD += getSignedDirectionAmount(amountUsd, direction);
    runningIQD += getSignedDirectionAmount(amountIqd, direction);

    return {
      ...transaction,
      runningUSD,
      runningIQD,
    };
  });
}

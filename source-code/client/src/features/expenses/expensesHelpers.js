export function filterExpensesByPort(expenses = [], filterPort = '') {
  return filterPort
    ? expenses.filter((expense) => expense.portId === filterPort)
    : expenses;
}

export function sumExpenseAmounts(expenses = []) {
  return expenses.reduce((totals, expense) => ({
    totalUSD: totals.totalUSD + parseFloat(expense.amountUSD || '0'),
    totalIQD: totals.totalIQD + parseFloat(expense.amountIQD || '0'),
  }), {
    totalUSD: 0,
    totalIQD: 0,
  });
}

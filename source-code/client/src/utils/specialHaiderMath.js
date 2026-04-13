function toNumber(value) {
  return Number(value || 0);
}

export function isSpecialHaiderSettlementRow(row) {
  return !row?.DriverName && !row?.PlateNumber && !row?.GoodType;
}

export function buildSpecialHaiderTotals(rows) {
  const totals = rows.reduce((acc, row) => {
    acc.count += 1;
    acc.totalWeight += toNumber(row?.Weight);
    acc.totalCostUSD += toNumber(row?.CostUSD);
    acc.totalAmountUSD += toNumber(row?.AmountUSD);
    acc.totalCostIQD += toNumber(row?.CostIQD);
    acc.totalAmountIQD += toNumber(row?.AmountIQD);
    acc.totalDifferenceIQD += toNumber(row?.DifferenceIQD);
    return acc;
  }, {
    count: 0,
    totalWeight: 0,
    totalCostUSD: 0,
    totalAmountUSD: 0,
    totalCostIQD: 0,
    totalAmountIQD: 0,
    totalDifferenceIQD: 0,
  });

  totals.totalProfitUSD = totals.totalAmountUSD - totals.totalCostUSD;
  totals.totalNetIQD = totals.totalAmountIQD - totals.totalCostIQD + totals.totalDifferenceIQD;
  totals.totalGrandIQD = totals.totalAmountIQD + totals.totalDifferenceIQD;
  return totals;
}

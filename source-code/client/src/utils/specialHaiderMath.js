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
    acc.totalAmountUSD += toNumber(row?.AmountUSD);
    acc.totalAmountIQD += toNumber(row?.AmountIQD);
    acc.totalDifferenceIQD += toNumber(row?.DifferenceIQD);
    return acc;
  }, {
    count: 0,
    totalWeight: 0,
    totalAmountUSD: 0,
    totalAmountIQD: 0,
    totalDifferenceIQD: 0,
  });

  totals.totalGrandIQD = totals.totalAmountIQD + totals.totalDifferenceIQD;
  return totals;
}

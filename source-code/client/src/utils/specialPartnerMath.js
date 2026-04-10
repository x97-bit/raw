function toNumber(value) {
  return Number(value || 0);
}

export function getSpecialPartnerRowAmountOn(row) {
  return toNumber(row?.AmountUSD);
}

export function getSpecialPartnerRowPartnerBase(row) {
  return toNumber(row?.AmountUSD_Partner);
}

export function getSpecialPartnerRowClearance(row) {
  return toNumber(row?.CLR);
}

export function getSpecialPartnerRowDifference(row) {
  return toNumber(row?.DifferenceIQD);
}

export function getSpecialPartnerRowTaxiAndOfficer(row) {
  return toNumber(row?.TX) + toNumber(row?.TaxiWater);
}

export function getSpecialPartnerRowAmountFor(row) {
  return (
    getSpecialPartnerRowPartnerBase(row) +
    getSpecialPartnerRowClearance(row) +
    getSpecialPartnerRowDifference(row) +
    getSpecialPartnerRowTaxiAndOfficer(row)
  );
}

export function buildSpecialPartnerTotals(rows) {
  const totals = rows.reduce((acc, row) => {
    acc.count += 1;
    acc.totalAmountUSD += getSpecialPartnerRowAmountOn(row);
    acc.totalPartnerBaseUSD += getSpecialPartnerRowPartnerBase(row);
    acc.totalDifferenceIQD += getSpecialPartnerRowDifference(row);
    acc.totalCLR += getSpecialPartnerRowClearance(row);
    acc.totalTaxiAndOfficer += getSpecialPartnerRowTaxiAndOfficer(row);
    acc.totalTX += toNumber(row?.TX);
    acc.totalTaxiWater += toNumber(row?.TaxiWater);
    return acc;
  }, {
    count: 0,
    totalAmountUSD: 0,
    totalPartnerBaseUSD: 0,
    totalDifferenceIQD: 0,
    totalCLR: 0,
    totalTaxiAndOfficer: 0,
    totalTX: 0,
    totalTaxiWater: 0,
  });

  totals.totalPartnerUSD = totals.totalPartnerBaseUSD + totals.totalCLR + totals.totalDifferenceIQD + totals.totalTaxiAndOfficer;
  totals.totalNetUSD = totals.totalAmountUSD - totals.totalPartnerUSD;
  return totals;
}

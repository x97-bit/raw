import {
  getDefaultSpecialAccountName,
  normalizeDateValue,
  sortByDateDesc,
  withinDateRange,
} from "./specialAccountShared";

export function getSpecialAccountDateFilters(query: Record<string, unknown>) {
  return {
    from: normalizeDateValue(query.from ?? query.startDate),
    to: normalizeDateValue(query.to ?? query.endDate),
  };
}

export function buildHaiderSpecialReport(rows: any[], filters: { from?: string; to?: string } = {}) {
  const mappedRows = rows
    .filter((row) => withinDateRange(normalizeDateValue(row.date), filters.from, filters.to))
    .map((row) => {
      const amountUSD = Number(row.amountUSD || 0);
      const amountIQD = Number(row.amountIQD || 0);
      const costUSD = Number(row.costUSD || 0);
      const costIQD = Number(row.costIQD || 0);
      const differenceIQD = Number(row.differenceIQD || 0);
      const profitUSD = amountUSD - costUSD;

      return {
        id: row.id,
        type: row.type,
        name: row.name || getDefaultSpecialAccountName("haider"),
        TransDate: normalizeDateValue(row.date),
        DriverName: row.driverName || "",
        PlateNumber: row.vehiclePlate || "",
        GoodType: row.goodType || "",
        Weight: Number(row.weight || 0),
        Meters: Number(row.meters || 0),
        CostUSD: costUSD,
        AmountUSD: amountUSD,
        ProfitUSD: profitUSD,
        CostIQD: costIQD,
        AmountIQD: amountIQD,
        DifferenceIQD: differenceIQD,
        NetIQD: amountIQD - costIQD + differenceIQD,
        Destination: row.destination || row.govName || "",
        BatchName: row.batchName || row.name || "",
        TraderNote: row.notes || row.description || "",
      };
    });

  const statement = sortByDateDesc(mappedRows);
  const totals = {
    count: statement.length,
    totalWeight: statement.reduce((sum, row) => sum + Number(row.Weight || 0), 0),
    totalCostUSD: statement.reduce((sum, row) => sum + Number(row.CostUSD || 0), 0),
    totalAmountUSD: statement.reduce((sum, row) => sum + Number(row.AmountUSD || 0), 0),
    totalProfitUSD: statement.reduce((sum, row) => sum + Number(row.ProfitUSD || 0), 0),
    totalCostIQD: statement.reduce((sum, row) => sum + Number(row.CostIQD || 0), 0),
    totalAmountIQD: statement.reduce((sum, row) => sum + Number(row.AmountIQD || 0), 0),
    totalDifferenceIQD: statement.reduce((sum, row) => sum + Number(row.DifferenceIQD || 0), 0),
    totalNetIQD: statement.reduce((sum, row) => sum + Number(row.NetIQD || 0), 0),
  };

  return { statement, totals };
}

export function buildPartnershipSpecialReport(rows: any[], filters: { from?: string; to?: string } = {}) {
  const mappedRows = rows
    .filter((row) => withinDateRange(normalizeDateValue(row.date), filters.from, filters.to))
    .map((row) => ({
      id: row.id,
      type: row.type,
      name: row.name || getDefaultSpecialAccountName("partnership"),
      TransDate: normalizeDateValue(row.date),
      PortName: row.portName || "",
      TraderName: row.traderName || row.name || "",
      DriverName: row.driverName || "",
      VehiclePlate: row.vehiclePlate || "",
      GoodType: row.goodType || "",
      GovName: row.govName || "",
      CompanyName: row.companyName || "",
      Qty: Number(row.qty || 0),
      AmountUSD: Number(row.amountUSD || 0),
      AmountIQD: Number(row.amountIQD || 0),
      AmountUSD_Partner: Number(row.amountUSDPartner || 0),
      DifferenceIQD: Number(row.differenceIQD || 0),
      CLR: Number(row.clr || 0),
      TX: Number(row.tx || 0),
      TaxiWater: Number(row.taxiWater || 0),
      Notes: row.notes || row.description || "",
    }));

  const rowsResult = sortByDateDesc(mappedRows);
  const totals = {
    count: rowsResult.length,
    totalAmountUSD: rowsResult.reduce((sum, row) => sum + Number(row.AmountUSD || 0), 0),
    totalAmountIQD: rowsResult.reduce((sum, row) => sum + Number(row.AmountIQD || 0), 0),
    totalPartnerBaseUSD: rowsResult.reduce((sum, row) => sum + Number(row.AmountUSD_Partner || 0), 0),
    totalDifferenceIQD: rowsResult.reduce((sum, row) => sum + Number(row.DifferenceIQD || 0), 0),
    totalCLR: rowsResult.reduce((sum, row) => sum + Number(row.CLR || 0), 0),
    totalTX: rowsResult.reduce((sum, row) => sum + Number(row.TX || 0), 0),
    totalTaxiWater: rowsResult.reduce((sum, row) => sum + Number(row.TaxiWater || 0), 0),
  };
  totals.totalTaxiAndOfficer = totals.totalTX + totals.totalTaxiWater;
  totals.totalPartnerUSD = totals.totalPartnerBaseUSD;
  totals.totalPartnerIQD = totals.totalDifferenceIQD + totals.totalCLR + totals.totalTaxiAndOfficer;
  totals.totalNetUSD = totals.totalAmountUSD - totals.totalPartnerUSD;
  totals.totalNetIQD = totals.totalAmountIQD - totals.totalPartnerIQD;

  return { rows: rowsResult, totals };
}

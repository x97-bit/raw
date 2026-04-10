import { Router, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { accounts, accountDefaults, companies, drivers, goodsTypes, governorates, vehicles } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { parseNullableNumber, parseOptionalInt } from "../../utils/bodyFields";
import { requireDefaultAdmin } from "./shared";

function createNameMap(rows: Array<any>, valueSelector: (row: any) => string) {
  return new Map(rows.map((row) => [row.id, valueSelector(row)]));
}

async function loadAccountDefaultMaps(db: any) {
  const [allAccounts, allDrivers, allVehicles, allGoods, allGovs, allCompanies] = await Promise.all([
    db.select().from(accounts),
    db.select().from(drivers),
    db.select().from(vehicles),
    db.select().from(goodsTypes),
    db.select().from(governorates),
    db.select().from(companies),
  ]);

  return {
    accountMap: createNameMap(allAccounts, (row) => row.name),
    driverMap: createNameMap(allDrivers, (row) => row.name),
    vehicleMap: createNameMap(allVehicles, (row) => row.plateNumber),
    goodTypeMap: createNameMap(allGoods, (row) => row.name),
    govMap: createNameMap(allGovs, (row) => row.name),
    companyMap: createNameMap(allCompanies, (row) => row.name),
  };
}

function mapAccountDefaultRow(row: any, maps: Record<string, Map<any, string>>) {
  return {
    id: row.id,
    accountId: row.accountId,
    accountName: maps.accountMap.get(row.accountId) || "",
    sectionKey: row.sectionKey,
    defaultCurrency: row.defaultCurrency ?? null,
    defaultDriverId: row.defaultDriverId ?? null,
    defaultDriverName: row.defaultDriverId ? maps.driverMap.get(row.defaultDriverId) || "" : "",
    defaultVehicleId: row.defaultVehicleId ?? null,
    defaultVehicleName: row.defaultVehicleId ? maps.vehicleMap.get(row.defaultVehicleId) || "" : "",
    defaultGoodTypeId: row.defaultGoodTypeId ?? null,
    defaultGoodTypeName: row.defaultGoodTypeId ? maps.goodTypeMap.get(row.defaultGoodTypeId) || "" : "",
    defaultGovId: row.defaultGovId ?? null,
    defaultGovName: row.defaultGovId ? maps.govMap.get(row.defaultGovId) || "" : "",
    defaultCompanyId: row.defaultCompanyId ?? null,
    defaultCompanyName: row.defaultCompanyId ? maps.companyMap.get(row.defaultCompanyId) || "" : "",
    defaultCarrierId: row.defaultCarrierId ?? null,
    defaultCarrierName: row.defaultCarrierId ? maps.accountMap.get(row.defaultCarrierId) || "" : "",
    defaultFeeUsd: parseNullableNumber(row.defaultFeeUsd),
    defaultSyrCus: parseNullableNumber(row.defaultSyrCus),
    defaultCarQty: row.defaultCarQty ?? null,
    notes: row.notes ?? "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function applyAccountDefaultSearch(rows: Array<any>, search: string) {
  if (!search) {
    return rows;
  }

  return rows.filter(
    (row) =>
      row.accountName.toLowerCase().includes(search) ||
      row.sectionKey.toLowerCase().includes(search) ||
      row.defaultDriverName.toLowerCase().includes(search) ||
      row.defaultGovName.toLowerCase().includes(search),
  );
}

export function registerAccountDefaultReadRoutes(router: Router) {
  router.get("/defaults/account", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireDefaultAdmin(req, res)) return;

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const conditions: any[] = [];
      const sectionKey = req.query.sectionKey ? String(req.query.sectionKey).trim() : "";
      const accountId = parseOptionalInt(req.query.accountId);
      const search = req.query.search ? String(req.query.search).trim().toLowerCase() : "";

      if (sectionKey) conditions.push(eq(accountDefaults.sectionKey, sectionKey));
      if (accountId) conditions.push(eq(accountDefaults.accountId, accountId));

      let query = db.select().from(accountDefaults).orderBy(desc(accountDefaults.updatedAt), desc(accountDefaults.id));
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const [rows, maps] = await Promise.all([query, loadAccountDefaultMaps(db)]);
      const result = applyAccountDefaultSearch(rows.map((row: any) => mapAccountDefaultRow(row, maps)), search);

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

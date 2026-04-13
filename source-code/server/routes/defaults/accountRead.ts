import { Router, Response } from "express";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { accounts, accountDefaults, companies, drivers, goodsTypes, governorates, vehicles } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db";
import type { AppDb } from "../../dbTypes";
import { parseNullableNumber, parseOptionalInt } from "../../utils/bodyFields";
import { requireDefaultAdmin } from "./shared";

type AccountDefaultRow = typeof accountDefaults.$inferSelect;
type AccountDefaultTimestamp = AccountDefaultRow["createdAt"];
type AccountRow = typeof accounts.$inferSelect;
type DriverRow = typeof drivers.$inferSelect;
type VehicleRow = typeof vehicles.$inferSelect;
type GoodTypeRow = typeof goodsTypes.$inferSelect;
type GovernorateRow = typeof governorates.$inferSelect;
type CompanyRow = typeof companies.$inferSelect;

type AccountDefaultMaps = {
  accountMap: Map<number, string>;
  driverMap: Map<number, string>;
  vehicleMap: Map<number, string>;
  goodTypeMap: Map<number, string>;
  govMap: Map<number, string>;
  companyMap: Map<number, string>;
};

type AccountDefaultListRow = {
  id: number;
  accountId: number;
  accountName: string;
  sectionKey: string;
  defaultCurrency: string | null;
  defaultDriverId: number | null;
  defaultDriverName: string;
  defaultVehicleId: number | null;
  defaultVehicleName: string;
  defaultGoodTypeId: number | null;
  defaultGoodTypeName: string;
  defaultGovId: number | null;
  defaultGovName: string;
  defaultCompanyId: number | null;
  defaultCompanyName: string;
  defaultCarrierId: number | null;
  defaultCarrierName: string;
  defaultFeeUsd: number | null;
  defaultSyrCus: number | null;
  defaultCarQty: number | null;
  notes: string;
  createdAt: AccountDefaultTimestamp;
  updatedAt: AccountDefaultTimestamp;
};

function readQueryString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    const [firstValue] = value;
    return typeof firstValue === "string" ? readQueryString(firstValue) : undefined;
  }

  return undefined;
}

function createNameMap<TRow extends { id: number }>(rows: TRow[], valueSelector: (row: TRow) => string) {
  return new Map(rows.map((row) => [row.id, valueSelector(row)]));
}

async function loadAccountDefaultMaps(db: AppDb): Promise<AccountDefaultMaps> {
  const [allAccounts, allDrivers, allVehicles, allGoods, allGovs, allCompanies] = await Promise.all([
    db.select().from(accounts),
    db.select().from(drivers),
    db.select().from(vehicles),
    db.select().from(goodsTypes),
    db.select().from(governorates),
    db.select().from(companies),
  ]);

  return {
    accountMap: createNameMap(allAccounts as AccountRow[], (row) => row.name),
    driverMap: createNameMap(allDrivers as DriverRow[], (row) => row.name),
    vehicleMap: createNameMap(allVehicles as VehicleRow[], (row) => row.plateNumber),
    goodTypeMap: createNameMap(allGoods as GoodTypeRow[], (row) => row.name),
    govMap: createNameMap(allGovs as GovernorateRow[], (row) => row.name),
    companyMap: createNameMap(allCompanies as CompanyRow[], (row) => row.name),
  };
}

function getMappedName(map: Map<number, string>, id?: number | null): string {
  if (!id) return "";
  return map.get(id) || "";
}

function mapAccountDefaultRow(row: AccountDefaultRow, maps: AccountDefaultMaps): AccountDefaultListRow {
  return {
    id: row.id,
    accountId: row.accountId,
    accountName: maps.accountMap.get(row.accountId) || "",
    sectionKey: row.sectionKey,
    defaultCurrency: row.defaultCurrency ?? null,
    defaultDriverId: row.defaultDriverId ?? null,
    defaultDriverName: getMappedName(maps.driverMap, row.defaultDriverId),
    defaultVehicleId: row.defaultVehicleId ?? null,
    defaultVehicleName: getMappedName(maps.vehicleMap, row.defaultVehicleId),
    defaultGoodTypeId: row.defaultGoodTypeId ?? null,
    defaultGoodTypeName: getMappedName(maps.goodTypeMap, row.defaultGoodTypeId),
    defaultGovId: row.defaultGovId ?? null,
    defaultGovName: getMappedName(maps.govMap, row.defaultGovId),
    defaultCompanyId: row.defaultCompanyId ?? null,
    defaultCompanyName: getMappedName(maps.companyMap, row.defaultCompanyId),
    defaultCarrierId: row.defaultCarrierId ?? null,
    defaultCarrierName: getMappedName(maps.accountMap, row.defaultCarrierId),
    defaultFeeUsd: parseNullableNumber(row.defaultFeeUsd),
    defaultSyrCus: parseNullableNumber(row.defaultSyrCus),
    defaultCarQty: row.defaultCarQty ?? null,
    notes: row.notes ?? "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function applyAccountDefaultSearch(rows: AccountDefaultListRow[], search: string) {
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

      const conditions: SQL<unknown>[] = [];
      const sectionKey = readQueryString(req.query.sectionKey) ?? "";
      const accountId = parseOptionalInt(req.query.accountId);
      const search = (readQueryString(req.query.search) ?? "").toLowerCase();

      if (sectionKey) conditions.push(eq(accountDefaults.sectionKey, sectionKey));
      if (accountId) conditions.push(eq(accountDefaults.accountId, accountId));

      const query = conditions.length > 0
        ? db.select().from(accountDefaults).where(and(...conditions)).orderBy(desc(accountDefaults.updatedAt), desc(accountDefaults.id))
        : db.select().from(accountDefaults).orderBy(desc(accountDefaults.updatedAt), desc(accountDefaults.id));

      const [rows, maps] = await Promise.all([query, loadAccountDefaultMaps(db)]);
      const result = applyAccountDefaultSearch(rows.map((row) => mapAccountDefaultRow(row, maps)), search);

      return res.json(result);
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

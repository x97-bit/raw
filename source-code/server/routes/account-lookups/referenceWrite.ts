import { Router, Response } from "express";
import { eq } from "drizzle-orm";
import { companies, drivers, goodsTypes, governorates, vehicles } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db";
import type { AppDb } from "../../dbTypes";
import { COMPANY_NAME_REQUIRED, invalidateLookupReadCache } from "./shared";

async function getLookupDb(res: Response): Promise<AppDb | null> {
  const db = await getDb();
  if (!db) {
    res.status(500).json({ error: "Database unavailable" });
    return null;
  }

  return db;
}

export function registerReferenceLookupWriteRoutes(router: Router) {
  router.post("/lookups/drivers", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getLookupDb(res);
      if (!db) return;

      const name = req.body.name || req.body.DriverName;
      if (name) {
        const [existing] = await db.select().from(drivers).where(eq(drivers.name, name)).limit(1);
        if (existing) {
          return res.json({ id: existing.id, DriverID: existing.id, DriverName: existing.name, existing: true });
        }
      }

      const result = await db.insert(drivers).values({ name });
      const driverId = Number(result[0].insertId);
      invalidateLookupReadCache();
      return res.json({ id: driverId, DriverID: driverId, DriverName: name });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.post("/lookups/vehicles", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getLookupDb(res);
      if (!db) return;

      const plateNumber = req.body.plateNumber || req.body.PlateNumber;
      if (plateNumber) {
        const [existing] = await db.select().from(vehicles).where(eq(vehicles.plateNumber, plateNumber)).limit(1);
        if (existing) {
          return res.json({ id: existing.id, VehicleID: existing.id, PlateNumber: existing.plateNumber, existing: true });
        }
      }

      const result = await db.insert(vehicles).values({ plateNumber });
      const vehicleId = Number(result[0].insertId);
      invalidateLookupReadCache();
      return res.json({ id: vehicleId, VehicleID: vehicleId, PlateNumber: plateNumber });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.post("/lookups/companies", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getLookupDb(res);
      if (!db) return;

      const name = String(req.body.name || req.body.CompanyName || "").trim();
      if (!name) return res.status(400).json({ error: COMPANY_NAME_REQUIRED });

      const [existing] = await db.select().from(companies).where(eq(companies.name, name)).limit(1);
      if (existing) {
        return res.json({ id: existing.id, CompanyID: existing.id, CompanyName: existing.name, existing: true });
      }

      const result = await db.insert(companies).values({ name });
      const companyId = Number(result[0].insertId);
      invalidateLookupReadCache();
      return res.json({ id: companyId, CompanyID: companyId, CompanyName: name });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.post("/lookups/goods-types", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getLookupDb(res);
      if (!db) return;

      const name = req.body.name || req.body.TypeName;
      if (name) {
        const [existing] = await db.select().from(goodsTypes).where(eq(goodsTypes.name, name)).limit(1);
        if (existing) {
          return res.json({ id: existing.id, GoodTypeID: existing.id, TypeName: existing.name, existing: true });
        }
      }

      const result = await db.insert(goodsTypes).values({ name });
      const goodTypeId = Number(result[0].insertId);
      invalidateLookupReadCache();
      return res.json({ id: goodTypeId, GoodTypeID: goodTypeId, TypeName: name });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.post("/lookups/governorates", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getLookupDb(res);
      if (!db) return;

      const name = String(req.body.name || req.body.GovName || "").trim();
      if (!name) return res.status(400).json({ error: "اسم المحافظة مطلوب" });

      const [existing] = await db.select().from(governorates).where(eq(governorates.name, name)).limit(1);
      if (existing) {
        return res.json({ id: existing.id, GovID: existing.id, GovName: existing.name, existing: true });
      }

      const result = await db.insert(governorates).values({ name });
      const govId = Number(result[0].insertId);
      invalidateLookupReadCache();
      return res.json({ id: govId, GovID: govId, GovName: name });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

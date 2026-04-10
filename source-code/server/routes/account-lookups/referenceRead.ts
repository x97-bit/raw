import { Router, Response } from "express";
import { asc } from "drizzle-orm";
import { accountTypes, companies, drivers, goodsTypes, governorates, ports, vehicles } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { respondWithCachedLookup } from "./shared";

async function getLookupDb(res: Response) {
  const db = await getDb();
  if (!db) {
    res.status(500).json({ error: "Database unavailable" });
    return null;
  }

  return db;
}

export function registerReferenceLookupReadRoutes(router: Router) {
  router.get("/lookups/drivers", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getLookupDb(res);
      if (!db) return;

      return respondWithCachedLookup(req, res, "/lookups/drivers", async () => {
        const result = await db.select().from(drivers);
        return result.map((driver: any) => ({ ...driver, DriverID: driver.id, DriverName: driver.name }));
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get("/lookups/vehicles", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getLookupDb(res);
      if (!db) return;

      return respondWithCachedLookup(req, res, "/lookups/vehicles", async () => {
        const result = await db.select().from(vehicles);
        return result.map((vehicle: any) => ({ ...vehicle, VehicleID: vehicle.id, PlateNumber: vehicle.plateNumber }));
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get("/lookups/companies", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getLookupDb(res);
      if (!db) return;

      return respondWithCachedLookup(req, res, "/lookups/companies", async () => {
        const result = await db.select().from(companies).orderBy(asc(companies.name));
        return result.map((company: any) => ({
          ...company,
          CompanyID: company.id,
          CompanyName: company.name,
        }));
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get("/lookups/goods-types", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getLookupDb(res);
      if (!db) return;

      return respondWithCachedLookup(req, res, "/lookups/goods-types", async () => {
        const result = await db.select().from(goodsTypes);
        return result.map((goodType: any) => ({ ...goodType, GoodTypeID: goodType.id, TypeName: goodType.name }));
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get("/lookups/governorates", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getLookupDb(res);
      if (!db) return;

      return respondWithCachedLookup(req, res, "/lookups/governorates", async () => {
        const result = await db.select().from(governorates);
        return result.map((governorate: any) => ({
          ...governorate,
          GovID: governorate.id,
          GovName: governorate.name,
          GovernorateID: governorate.id,
          GovernorateName: governorate.name,
        }));
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get("/lookups/ports", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getLookupDb(res);
      if (!db) return;

      return respondWithCachedLookup(req, res, "/lookups/ports", async () => {
        const result = await db.select().from(ports);
        return result.map((port: any) => ({ ...port, PortID: port.portId, PortName: port.name }));
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get("/lookups/account-types", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getLookupDb(res);
      if (!db) return;

      return respondWithCachedLookup(req, res, "/lookups/account-types", async () => {
        const result = await db.select().from(accountTypes);
        return result.map((accountType: any) => ({
          ...accountType,
          AccountTypeID: accountType.typeId,
          TypeName: accountType.name,
        }));
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

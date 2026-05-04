import { Router, Response } from "express";
import { asc, eq, isNull, or } from "drizzle-orm";
import {
  accountTypes,
  companies,
  drivers,
  goodsTypes,
  governorates,
  ports,
  vehicles,
} from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db/db";
import type { AppDb } from "../../db/schema/dbTypes";
import { respondWithCachedLookup } from "./shared";

type DriverRow = typeof drivers.$inferSelect;
type VehicleRow = typeof vehicles.$inferSelect;
type CompanyRow = typeof companies.$inferSelect;
type GoodTypeRow = typeof goodsTypes.$inferSelect;
type GovernorateRow = typeof governorates.$inferSelect;
type PortRow = typeof ports.$inferSelect;
type AccountTypeRow = typeof accountTypes.$inferSelect;

async function getLookupDb(res: Response): Promise<AppDb | null> {
  const db = await getDb();
  if (!db) {
    res.status(500).json({ error: "Database unavailable" });
    return null;
  }

  return db;
}

export function registerReferenceLookupReadRoutes(router: Router) {
  router.get(
    "/lookups/drivers",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getLookupDb(res);
        if (!db) return;

        return respondWithCachedLookup(
          req,
          res,
          "/lookups/drivers",
          async () => {
            const result = await db.select().from(drivers);
            return result.map((driver: DriverRow) => ({
              ...driver,
              DriverID: driver.id,
              DriverName: driver.name,
            }));
          }
        );
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.get(
    "/lookups/vehicles",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getLookupDb(res);
        if (!db) return;

        return respondWithCachedLookup(
          req,
          res,
          "/lookups/vehicles",
          async () => {
            const result = await db.select().from(vehicles);
            return result.map((vehicle: VehicleRow) => ({
              ...vehicle,
              VehicleID: vehicle.id,
              PlateNumber: vehicle.plateNumber,
            }));
          }
        );
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.get(
    "/lookups/companies",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getLookupDb(res);
        if (!db) return;

        return respondWithCachedLookup(
          req,
          res,
          "/lookups/companies",
          async () => {
            const result = await db
              .select()
              .from(companies)
              .orderBy(asc(companies.name));
            return result.map((company: CompanyRow) => ({
              ...company,
              CompanyID: company.id,
              CompanyName: company.name,
            }));
          }
        );
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.get(
    "/lookups/goods-types",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getLookupDb(res);
        if (!db) return;

        const portFilter = (req.query.port as string) || "";

        return respondWithCachedLookup(
          req,
          res,
          "/lookups/goods-types",
          async () => {
            // If a port is specified, return only goods for that port
            // (plus any "global" goods that have no port assigned for backward compat)
            const query = portFilter
              ? db
                  .select()
                  .from(goodsTypes)
                  .where(
                    or(
                      eq(goodsTypes.portId, portFilter),
                      isNull(goodsTypes.portId)
                    )
                  )
              : db.select().from(goodsTypes);

            const result = await query;
            return result.map((goodType: GoodTypeRow) => ({
              ...goodType,
              GoodTypeID: goodType.id,
              TypeName: goodType.name,
            }));
          }
        );
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.get(
    "/lookups/governorates",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getLookupDb(res);
        if (!db) return;

        return respondWithCachedLookup(
          req,
          res,
          "/lookups/governorates",
          async () => {
            const result = await db.select().from(governorates);
            return result.map((governorate: GovernorateRow) => ({
              ...governorate,
              GovID: governorate.id,
              GovName: governorate.name,
              GovernorateID: governorate.id,
              GovernorateName: governorate.name,
            }));
          }
        );
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.get(
    "/lookups/ports",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getLookupDb(res);
        if (!db) return;

        return respondWithCachedLookup(req, res, "/lookups/ports", async () => {
          const result = await db.select().from(ports);
          return result.map((port: PortRow) => ({
            ...port,
            PortID: port.portId,
            PortName: port.name,
          }));
        });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.get(
    "/lookups/account-types",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getLookupDb(res);
        if (!db) return;

        return respondWithCachedLookup(
          req,
          res,
          "/lookups/account-types",
          async () => {
            const result = await db.select().from(accountTypes);
            return result.map((accountType: AccountTypeRow) => ({
              ...accountType,
              AccountTypeID: accountType.typeId,
              TypeName: accountType.name,
            }));
          }
        );
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

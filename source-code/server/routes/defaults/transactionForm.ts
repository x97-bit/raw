import { Router, Response } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  accounts,
  accountDefaults,
  routeDefaults,
  transactions,
} from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db/db";
import { parseNullableNumber } from "../../utils/bodyFields";
import { getDirectionAliases } from "../../utils/direction";
import { buildTransactionFormDefaults } from "../../utils/formDefaults";
import {
  enrichTransactions,
  getLookupNameById,
  type EnrichedTransactionRecord,
} from "../../utils/transactionEnrichment";

type RouteDefaultRow = typeof routeDefaults.$inferSelect;

export function registerTransactionFormDefaultRoutes(router: Router) {
  router.get(
    "/defaults/transaction-form",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const accountId = parseInt(String(req.query.accountId || "0"), 10);
        const sectionKey = String(
          req.query.sectionKey || req.query.portId || ""
        );
        const govId = req.query.govId
          ? parseInt(String(req.query.govId), 10)
          : null;
        const formType = String(req.query.formType || "invoice");
        const requestedCurrency = req.query.currency
          ? String(req.query.currency)
          : null;
        const direction = formType === "payment" ? "OUT" : "IN";

        if (!accountId || !sectionKey) {
          return res
            .status(400)
            .json({ error: "accountId and sectionKey are required" });
        }

        const [account] = await db
          .select()
          .from(accounts)
          .where(eq(accounts.id, accountId))
          .limit(1);
        const [defaultRow] = await db
          .select()
          .from(accountDefaults)
          .where(
            and(
              eq(accountDefaults.accountId, accountId),
              eq(accountDefaults.sectionKey, sectionKey)
            )
          )
          .limit(1);

        let routeRow: RouteDefaultRow | null = null;
        if (govId) {
          const matchingRouteRows = await db
            .select()
            .from(routeDefaults)
            .where(
              and(
                eq(routeDefaults.sectionKey, sectionKey),
                eq(routeDefaults.govId, govId)
              )
            );

          routeRow =
            matchingRouteRows.find(
              row => requestedCurrency && row.currency === requestedCurrency
            ) ||
            matchingRouteRows.find(row => row.active === 1) ||
            matchingRouteRows[0] ||
            null;
        }

        let recentTransaction: EnrichedTransactionRecord | null = null;
        const recentRows = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.accountId, accountId),
              eq(transactions.portId, sectionKey),
              inArray(transactions.direction, getDirectionAliases(direction))
            )
          )
          .orderBy(desc(transactions.id))
          .limit(1);

        if (recentRows.length > 0) {
          const [enriched] = await enrichTransactions(db, recentRows);
          recentTransaction = enriched || null;
        }

        const [
          defaultDriver,
          defaultVehicle,
          defaultGoodType,
          defaultGov,
          defaultCompany,
          defaultCarrier,
          routeGov,
        ] = await Promise.all([
          getLookupNameById(db, "driver", defaultRow?.defaultDriverId),
          getLookupNameById(db, "vehicle", defaultRow?.defaultVehicleId),
          getLookupNameById(db, "goodType", defaultRow?.defaultGoodTypeId),
          getLookupNameById(db, "governorate", defaultRow?.defaultGovId),
          getLookupNameById(db, "company", defaultRow?.defaultCompanyId),
          getLookupNameById(db, "account", defaultRow?.defaultCarrierId),
          getLookupNameById(db, "governorate", routeRow?.govId),
        ]);

        const defaults = buildTransactionFormDefaults({
          accountCurrency: account?.currency || null,
          accountDefaults: defaultRow
            ? {
                defaultCurrency: defaultRow.defaultCurrency,
                defaultDriver: defaultDriver || undefined,
                defaultVehicle: defaultVehicle || undefined,
                defaultGoodType: defaultGoodType || undefined,
                defaultGov: defaultGov || undefined,
                defaultCompany: defaultCompany || undefined,
                defaultCarrier: defaultCarrier || undefined,
                defaultFeeUsd: parseNullableNumber(defaultRow.defaultFeeUsd),
                defaultSyrCus: parseNullableNumber(defaultRow.defaultSyrCus),
                defaultCarQty: defaultRow.defaultCarQty ?? null,
              }
            : null,
          routeDefaults: routeRow
            ? {
                gov: routeGov || undefined,
                defaultTransPrice: parseNullableNumber(
                  routeRow.defaultTransPrice
                ),
                defaultFeeUsd: parseNullableNumber(routeRow.defaultFeeUsd),
                defaultCostUsd: parseNullableNumber(routeRow.defaultCostUsd),
                defaultAmountUsd: parseNullableNumber(
                  routeRow.defaultAmountUsd
                ),
                defaultCostIqd: parseNullableNumber(routeRow.defaultCostIqd),
                defaultAmountIqd: parseNullableNumber(
                  routeRow.defaultAmountIqd
                ),
              }
            : null,
          recentTransaction,
        });

        return res.json(defaults);
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

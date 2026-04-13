import { Router, Response } from "express";
import { and, eq } from "drizzle-orm";
import { routeDefaults } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { assertPositiveIntegerParam } from "../../_core/requestValidation";
import { getDb } from "../../db";
import { hasBodyValue, parseOptionalDecimal, parseOptionalInt } from "../../utils/bodyFields";
import { requireDefaultAdmin, ROUTE_DEFAULTS_DELETED_MESSAGE, ROUTE_DEFAULTS_SAVED_MESSAGE } from "./shared";

type RouteDefaultRow = typeof routeDefaults.$inferSelect;
type RouteDefaultInsert = typeof routeDefaults.$inferInsert;

function resolveDecimalValue(input: unknown, existingValue: string | null | undefined, replaceMode: boolean): string | null {
  const parsed = parseOptionalDecimal(input);
  return replaceMode ? parsed ?? null : parsed ?? existingValue ?? null;
}

function resolveTextValue(input: unknown, existingValue: string | null | undefined, replaceMode: boolean): string | null {
  if (replaceMode) {
    return hasBodyValue(input) ? String(input) : null;
  }

  return hasBodyValue(input) ? String(input) : existingValue ?? null;
}

function buildRouteDefaultPayload(
  body: Record<string, unknown>,
  existing: RouteDefaultRow | undefined,
  replaceMode: boolean,
  sectionKey: string,
  govId: number,
  currency: string,
): RouteDefaultInsert {
  return {
    sectionKey,
    govId,
    currency,
    defaultTransPrice: resolveDecimalValue(body.defaultTransPrice, existing?.defaultTransPrice, replaceMode),
    defaultFeeUsd: resolveDecimalValue(body.defaultFeeUsd, existing?.defaultFeeUsd, replaceMode),
    defaultCostUsd: resolveDecimalValue(body.defaultCostUsd, existing?.defaultCostUsd, replaceMode),
    defaultAmountUsd: resolveDecimalValue(body.defaultAmountUsd, existing?.defaultAmountUsd, replaceMode),
    defaultCostIqd: resolveDecimalValue(body.defaultCostIqd, existing?.defaultCostIqd, replaceMode),
    defaultAmountIqd: resolveDecimalValue(body.defaultAmountIqd, existing?.defaultAmountIqd, replaceMode),
    notes: resolveTextValue(body.notes, existing?.notes, replaceMode),
    active: 1,
  };
}

export function registerRouteDefaultMutationRoutes(router: Router) {
  router.post("/defaults/route", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireDefaultAdmin(req, res)) return;

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const replaceMode = req.body.replace === true;
      const sectionKey = String(req.body.sectionKey || "").trim();
      const govId = parseOptionalInt(req.body.govId);
      const currency = String(req.body.currency || "IQD").trim() || "IQD";

      if (!sectionKey || !govId) {
        return res.status(400).json({ error: "sectionKey and govId are required" });
      }

      const [existing] = await db
        .select()
        .from(routeDefaults)
        .where(
          and(eq(routeDefaults.sectionKey, sectionKey), eq(routeDefaults.govId, govId), eq(routeDefaults.currency, currency)),
        )
        .limit(1);

      const payload = buildRouteDefaultPayload(req.body, existing, replaceMode, sectionKey, govId, currency);

      await db.insert(routeDefaults).values(payload).onDuplicateKeyUpdate({
        set: {
          defaultTransPrice: payload.defaultTransPrice,
          defaultFeeUsd: payload.defaultFeeUsd,
          defaultCostUsd: payload.defaultCostUsd,
          defaultAmountUsd: payload.defaultAmountUsd,
          defaultCostIqd: payload.defaultCostIqd,
          defaultAmountIqd: payload.defaultAmountIqd,
          notes: payload.notes,
          active: 1,
        },
      });

      return res.json({ message: ROUTE_DEFAULTS_SAVED_MESSAGE });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.delete("/defaults/route/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireDefaultAdmin(req, res)) return;

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const defaultId = assertPositiveIntegerParam(req.params.id, "route default id");
      await db.delete(routeDefaults).where(eq(routeDefaults.id, defaultId));
      return res.json({ message: ROUTE_DEFAULTS_DELETED_MESSAGE });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

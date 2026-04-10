import { Router, Response } from "express";
import { and, eq } from "drizzle-orm";
import { routeDefaults } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { hasBodyValue, parseOptionalDecimal, parseOptionalInt } from "../../utils/bodyFields";
import { requireDefaultAdmin, ROUTE_DEFAULTS_DELETED_MESSAGE, ROUTE_DEFAULTS_SAVED_MESSAGE } from "./shared";

function resolveDecimalValue(input: unknown, existingValue: unknown, replaceMode: boolean) {
  const parsed = parseOptionalDecimal(input);
  return replaceMode ? parsed ?? null : parsed ?? existingValue ?? null;
}

function resolveTextValue(input: unknown, existingValue: unknown, replaceMode: boolean) {
  if (replaceMode) {
    return hasBodyValue(input) ? String(input) : null;
  }

  return hasBodyValue(input) ? String(input) : existingValue ?? null;
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

      const payload: any = {
        sectionKey,
        govId,
        currency,
        defaultTransPrice: resolveDecimalValue(req.body.defaultTransPrice, existing?.defaultTransPrice, replaceMode),
        defaultFeeUsd: resolveDecimalValue(req.body.defaultFeeUsd, existing?.defaultFeeUsd, replaceMode),
        defaultCostUsd: resolveDecimalValue(req.body.defaultCostUsd, existing?.defaultCostUsd, replaceMode),
        defaultAmountUsd: resolveDecimalValue(req.body.defaultAmountUsd, existing?.defaultAmountUsd, replaceMode),
        defaultCostIqd: resolveDecimalValue(req.body.defaultCostIqd, existing?.defaultCostIqd, replaceMode),
        defaultAmountIqd: resolveDecimalValue(req.body.defaultAmountIqd, existing?.defaultAmountIqd, replaceMode),
        notes: resolveTextValue(req.body.notes, existing?.notes, replaceMode),
        active: 1,
      };

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
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.delete("/defaults/route/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireDefaultAdmin(req, res)) return;

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      await db.delete(routeDefaults).where(eq(routeDefaults.id, parseInt(req.params.id, 10)));
      return res.json({ message: ROUTE_DEFAULTS_DELETED_MESSAGE });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

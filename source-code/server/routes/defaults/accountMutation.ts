import { Router, Response } from "express";
import { and, eq } from "drizzle-orm";
import { accountDefaults } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { assertPositiveIntegerParam } from "../../_core/requestValidation";
import { getDb } from "../../db/db";
import {
  hasBodyValue,
  parseOptionalDecimal,
  parseOptionalInt,
} from "../../utils/bodyFields";
import {
  ACCOUNT_DEFAULTS_DELETED_MESSAGE,
  ACCOUNT_DEFAULTS_SAVED_MESSAGE,
  requireDefaultAdmin,
} from "./shared";

type AccountDefaultRow = typeof accountDefaults.$inferSelect;
type AccountDefaultInsert = typeof accountDefaults.$inferInsert;

function resolveTextValue(
  input: unknown,
  existingValue: string | null | undefined,
  replaceMode: boolean
): string | null {
  if (replaceMode) {
    return hasBodyValue(input) ? String(input) : null;
  }

  return hasBodyValue(input) ? String(input) : (existingValue ?? null);
}

function resolveIntValue(
  input: unknown,
  existingValue: number | null | undefined,
  replaceMode: boolean
): number | null {
  const parsed = parseOptionalInt(input);
  return replaceMode ? (parsed ?? null) : (parsed ?? existingValue ?? null);
}

function resolveDecimalValue(
  input: unknown,
  existingValue: string | null | undefined,
  replaceMode: boolean
): string | null {
  const parsed = parseOptionalDecimal(input);
  return replaceMode ? (parsed ?? null) : (parsed ?? existingValue ?? null);
}

function buildAccountDefaultPayload(
  body: Record<string, unknown>,
  existing: AccountDefaultRow | undefined,
  replaceMode: boolean,
  accountId: number,
  sectionKey: string
): AccountDefaultInsert {
  return {
    accountId,
    sectionKey,
    defaultCurrency: resolveTextValue(
      body.defaultCurrency,
      existing?.defaultCurrency,
      replaceMode
    ),
    defaultDriverId: resolveIntValue(
      body.defaultDriverId,
      existing?.defaultDriverId,
      replaceMode
    ),
    defaultVehicleId: resolveIntValue(
      body.defaultVehicleId,
      existing?.defaultVehicleId,
      replaceMode
    ),
    defaultGoodTypeId: resolveIntValue(
      body.defaultGoodTypeId,
      existing?.defaultGoodTypeId,
      replaceMode
    ),
    defaultGovId: resolveIntValue(
      body.defaultGovId,
      existing?.defaultGovId,
      replaceMode
    ),
    defaultCompanyId: resolveIntValue(
      body.defaultCompanyId,
      existing?.defaultCompanyId,
      replaceMode
    ),
    defaultCarrierId: resolveIntValue(
      body.defaultCarrierId,
      existing?.defaultCarrierId,
      replaceMode
    ),
    defaultFeeUsd: resolveDecimalValue(
      body.defaultFeeUsd,
      existing?.defaultFeeUsd,
      replaceMode
    ),
    defaultSyrCus: resolveDecimalValue(
      body.defaultSyrCus,
      existing?.defaultSyrCus,
      replaceMode
    ),
    defaultCarQty: resolveIntValue(
      body.defaultCarQty,
      existing?.defaultCarQty,
      replaceMode
    ),
    notes: resolveTextValue(body.notes, existing?.notes, replaceMode),
  };
}

export function registerAccountDefaultMutationRoutes(router: Router) {
  router.post(
    "/defaults/account",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!requireDefaultAdmin(req, res)) return;

        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const replaceMode = req.body.replace === true;
        const accountId = parseOptionalInt(req.body.accountId);
        const sectionKey = String(req.body.sectionKey || "").trim();

        if (!accountId || !sectionKey) {
          return res
            .status(400)
            .json({ error: "accountId and sectionKey are required" });
        }

        const [existing] = await db
          .select()
          .from(accountDefaults)
          .where(
            and(
              eq(accountDefaults.accountId, accountId),
              eq(accountDefaults.sectionKey, sectionKey)
            )
          )
          .limit(1);

        const payload = buildAccountDefaultPayload(
          req.body,
          existing,
          replaceMode,
          accountId,
          sectionKey
        );

        await db
          .insert(accountDefaults)
          .values(payload)
          .onDuplicateKeyUpdate({
            set: {
              defaultCurrency: payload.defaultCurrency,
              defaultDriverId: payload.defaultDriverId,
              defaultVehicleId: payload.defaultVehicleId,
              defaultGoodTypeId: payload.defaultGoodTypeId,
              defaultGovId: payload.defaultGovId,
              defaultCompanyId: payload.defaultCompanyId,
              defaultCarrierId: payload.defaultCarrierId,
              defaultFeeUsd: payload.defaultFeeUsd,
              defaultSyrCus: payload.defaultSyrCus,
              defaultCarQty: payload.defaultCarQty,
              notes: payload.notes,
            },
          });

        return res.json({ message: ACCOUNT_DEFAULTS_SAVED_MESSAGE });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.delete(
    "/defaults/account/:id",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!requireDefaultAdmin(req, res)) return;

        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const defaultId = assertPositiveIntegerParam(
          req.params.id,
          "account default id"
        );
        await db
          .delete(accountDefaults)
          .where(eq(accountDefaults.id, defaultId));
        return res.json({ message: ACCOUNT_DEFAULTS_DELETED_MESSAGE });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

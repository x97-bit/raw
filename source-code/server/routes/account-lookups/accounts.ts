import { Router, Response } from "express";
import { and, eq, sql, type SQL } from "drizzle-orm";
import { accounts } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { assertPositiveIntegerParam } from "../../_core/requestValidation";
import { getDb } from "../../db/db";
import { hasBodyValue, pickBodyField } from "../../utils/bodyFields";
import { mapAccount } from "../../utils/accountMappings";
import {
  ACCOUNT_CREATED_MESSAGE,
  ACCOUNT_DELETED_MESSAGE,
  ACCOUNT_EXISTS_MESSAGE,
  ACCOUNT_UPDATED_MESSAGE,
  invalidateLookupReadCache,
  respondWithCachedLookup,
} from "./shared";
import { normalizeArabicText } from "../../utils/textNormalization";

type AccountInsert = typeof accounts.$inferInsert;

function readQueryString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    const [firstValue] = value;
    return typeof firstValue === "string"
      ? readQueryString(firstValue)
      : undefined;
  }

  return undefined;
}

function readBodyString(value: unknown): string | null {
  if (!hasBodyValue(value)) return null;
  return String(value).trim() || null;
}

export function registerAccountRoutes(router: Router) {
  router.get(
    "/accounts",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        return respondWithCachedLookup(req, res, "/accounts", async () => {
          const accountType = readQueryString(req.query.accountType);
          const type = readQueryString(req.query.type);
          const portId = readQueryString(req.query.portId);
          const port = readQueryString(req.query.port);
          const conditions: SQL<unknown>[] = [];
          if (accountType)
            conditions.push(eq(accounts.accountType, accountType));
          if (type) conditions.push(eq(accounts.accountType, type));
          if (portId) conditions.push(eq(accounts.portId, portId));
          if (port && port !== "null")
            conditions.push(eq(accounts.portId, port));

          const query =
            conditions.length > 0
              ? db
                  .select()
                  .from(accounts)
                  .where(and(...conditions))
              : db.select().from(accounts);

          const result = await query;
          return result.map(mapAccount);
        });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.post(
    "/accounts",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const data: AccountInsert = {
          name:
            readBodyString(pickBodyField(req.body, "name", "AccountName")) ??
            "",
          accountType:
            readBodyString(
              pickBodyField(req.body, "accountType", "AccountTypeID")
            ) ?? "",
          portId: readBodyString(
            pickBodyField(req.body, "portId", "DefaultPortID")
          ),
          phone: readBodyString(pickBodyField(req.body, "phone", "Phone")),
          notes: readBodyString(pickBodyField(req.body, "notes", "Notes")),
        };

        if (data.name) {
          const normalizedInputName = normalizeArabicText(data.name);

          if (normalizedInputName) {
            // ── Targeted SQL query instead of full-table scan ──
            // Build conditions to narrow the search scope
            const dupConditions: SQL<unknown>[] = [
              eq(accounts.name, data.name),
            ];
            if (data.accountType) {
              dupConditions.push(eq(accounts.accountType, String(data.accountType)));
            }
            if (data.portId) {
              dupConditions.push(eq(accounts.portId, String(data.portId)));
            }

            // First try exact match (fast, uses index)
            const exactMatches = await db
              .select({ id: accounts.id, name: accounts.name })
              .from(accounts)
              .where(and(...dupConditions))
              .limit(1);

            let existing = exactMatches[0] || null;

            // If no exact match, do a narrower search with Arabic normalization
            // Only fetch accounts with matching type+port (not the entire table)
            if (!existing) {
              const narrowConditions: SQL<unknown>[] = [];
              if (data.accountType) {
                narrowConditions.push(eq(accounts.accountType, String(data.accountType)));
              }
              if (data.portId) {
                narrowConditions.push(eq(accounts.portId, String(data.portId)));
              }

              const candidates =
                narrowConditions.length > 0
                  ? await db
                      .select({ id: accounts.id, name: accounts.name })
                      .from(accounts)
                      .where(and(...narrowConditions))
                  : await db
                      .select({ id: accounts.id, name: accounts.name })
                      .from(accounts);

              existing =
                candidates.find(
                  (acc) => normalizeArabicText(acc.name) === normalizedInputName
                ) || null;
            }

            if (existing) {
              return res.json({
                id: existing.id,
                message: ACCOUNT_EXISTS_MESSAGE,
                existing: true,
              });
            }
          }
        }

        const result = await db.insert(accounts).values(data);
        invalidateLookupReadCache();
        return res.json({
          id: Number(result[0].insertId),
          message: ACCOUNT_CREATED_MESSAGE,
        });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.put(
    "/accounts/:id",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const accountId = assertPositiveIntegerParam(
          req.params.id,
          "account id"
        );
        const updates: Partial<AccountInsert> = {};

        const name = readBodyString(
          pickBodyField(req.body, "name", "AccountName")
        );
        if (name !== null) updates.name = name;

        const phone = readBodyString(pickBodyField(req.body, "phone", "Phone"));
        if (phone !== null) updates.phone = phone;

        const accountType = readBodyString(
          pickBodyField(req.body, "accountType", "AccountTypeID")
        );
        if (accountType !== null) updates.accountType = accountType;

        const portId = readBodyString(
          pickBodyField(req.body, "portId", "DefaultPortID")
        );
        if (portId !== null) updates.portId = portId;

        const notes = readBodyString(pickBodyField(req.body, "notes", "Notes"));
        if (notes !== null) updates.notes = notes;

        await db
          .update(accounts)
          .set(updates)
          .where(eq(accounts.id, accountId));
        invalidateLookupReadCache();
        return res.json({ message: ACCOUNT_UPDATED_MESSAGE });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.delete(
    "/accounts/:id",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const accountId = assertPositiveIntegerParam(
          req.params.id,
          "account id"
        );
        await db.delete(accounts).where(eq(accounts.id, accountId));
        invalidateLookupReadCache();
        return res.json({ message: ACCOUNT_DELETED_MESSAGE });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

import { Router, Response } from "express";
import { and, eq, type SQL } from "drizzle-orm";
import { accounts } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { assertPositiveIntegerParam } from "../../_core/requestValidation";
import { getDb } from "../../db";
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

type AccountInsert = typeof accounts.$inferInsert;
type AccountRecord = ReturnType<typeof mapAccount>;

const APPROVED_TRANSPORT_TRADER_GROUPS = [
  {
    canonical: "ابراهيم سعد",
    aliases: ["ابراهيم سعد", "إبراهيم سعد", "ابراهيم سعد رمضان", "إبراهيم سعد رمضان"],
  },
  {
    canonical: "عبدالعزيز",
    aliases: ["عبدالعزيز", "عبد العزيز", "عبدالعزيز احمد", "عبد العزيز احمد"],
  },
  {
    canonical: "صباح اسماعيل",
    aliases: ["صباح اسماعيل", "صباح إسماعيل"],
  },
];

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

function readBodyString(value: unknown): string | null {
  if (!hasBodyValue(value)) return null;
  return String(value).trim() || null;
}

function normalizeTransportTraderName(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

function isTransportAccountsScope({
  accountType,
  type,
  portId,
  port,
}: {
  accountType?: unknown;
  type?: unknown;
  portId?: unknown;
  port?: unknown;
}) {
  const normalizedPort = String(portId ?? port ?? "").trim();
  const normalizedAccountType = String(accountType ?? type ?? "").trim();
  return normalizedPort === "transport-1" || normalizedAccountType === "2";
}

function isApprovedTransportTraderName(name: unknown) {
  const normalizedName = normalizeTransportTraderName(name);
  return APPROVED_TRANSPORT_TRADER_GROUPS
    .some((group) => group.aliases.some((alias) => normalizeTransportTraderName(alias) === normalizedName));
}

function getApprovedTransportTraderCanonicalName(name: unknown) {
  const normalizedName = normalizeTransportTraderName(name);
  const group = APPROVED_TRANSPORT_TRADER_GROUPS
    .find((candidate) => candidate.aliases.some((alias) => normalizeTransportTraderName(alias) === normalizedName));
  return group?.canonical || String(name || "").trim();
}

function getApprovedTransportTraderOrderIndex(name: unknown) {
  const canonicalName = normalizeTransportTraderName(getApprovedTransportTraderCanonicalName(name));
  return APPROVED_TRANSPORT_TRADER_GROUPS
    .map((group) => normalizeTransportTraderName(group.canonical))
    .indexOf(canonicalName);
}

function filterApprovedTransportAccounts(result: AccountRecord[]) {
  return (result || [])
    .filter((account) => isApprovedTransportTraderName(account.AccountName || account.name))
    .map((account) => {
      const canonicalName = getApprovedTransportTraderCanonicalName(account.AccountName || account.name);
      return {
        ...account,
        AccountName: canonicalName,
        name: canonicalName,
      };
    })
    .sort((left, right) => {
      const leftIndex = getApprovedTransportTraderOrderIndex(left.AccountName || left.name);
      const rightIndex = getApprovedTransportTraderOrderIndex(right.AccountName || right.name);
      const normalizedLeftIndex = leftIndex >= 0 ? leftIndex : Number.MAX_SAFE_INTEGER;
      const normalizedRightIndex = rightIndex >= 0 ? rightIndex : Number.MAX_SAFE_INTEGER;
      return normalizedLeftIndex - normalizedRightIndex;
    })
    .filter((account, index, list) => {
      const normalizedName = normalizeTransportTraderName(account.AccountName || account.name);
      return list.findIndex((item) => normalizeTransportTraderName(item.AccountName || item.name) === normalizedName) === index;
    });
}

export function registerAccountRoutes(router: Router) {
  router.get("/accounts", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      return respondWithCachedLookup(req, res, "/accounts", async () => {
        const accountType = readQueryString(req.query.accountType);
        const type = readQueryString(req.query.type);
        const portId = readQueryString(req.query.portId);
        const port = readQueryString(req.query.port);
        const conditions: SQL<unknown>[] = [];
        if (accountType) conditions.push(eq(accounts.accountType, accountType));
        if (type) conditions.push(eq(accounts.accountType, type));
        if (portId) conditions.push(eq(accounts.portId, portId));
        if (port && port !== "null") conditions.push(eq(accounts.portId, port));

        const query = conditions.length > 0
          ? db.select().from(accounts).where(and(...conditions))
          : db.select().from(accounts);

        const result = await query;
        const mappedAccounts = result.map(mapAccount);
        if (isTransportAccountsScope({ accountType, type, portId, port })) {
          return filterApprovedTransportAccounts(mappedAccounts);
        }
        return mappedAccounts;
      });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.post("/accounts", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const data: AccountInsert = {
        name: readBodyString(pickBodyField(req.body, "name", "AccountName")) ?? "",
        accountType: readBodyString(pickBodyField(req.body, "accountType", "AccountTypeID")) ?? "",
        portId: readBodyString(pickBodyField(req.body, "portId", "DefaultPortID")),
        phone: readBodyString(pickBodyField(req.body, "phone", "Phone")),
        notes: readBodyString(pickBodyField(req.body, "notes", "Notes")),
      };

      if (isTransportAccountsScope({ accountType: data.accountType, portId: data.portId }) && !isApprovedTransportTraderName(data.name)) {
        return res.status(400).json({
          error: "في النقل، التجار المعتمدون حاليًا هم: ابراهيم سعد، عبدالعزيز، صباح اسماعيل",
        });
      }

      if (data.name) {
        const conditions: SQL<unknown>[] = [eq(accounts.name, data.name)];
        if (data.accountType) conditions.push(eq(accounts.accountType, String(data.accountType)));
        if (data.portId) conditions.push(eq(accounts.portId, String(data.portId)));

        const [existing] = await db.select().from(accounts).where(and(...conditions)).limit(1);
        if (existing) {
          return res.json({ id: existing.id, message: ACCOUNT_EXISTS_MESSAGE, existing: true });
        }
      }

      const result = await db.insert(accounts).values(data);
      invalidateLookupReadCache();
      return res.json({ id: Number(result[0].insertId), message: ACCOUNT_CREATED_MESSAGE });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.put("/accounts/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const accountId = assertPositiveIntegerParam(req.params.id, "account id");
      const updates: Partial<AccountInsert> = {};

      const name = readBodyString(pickBodyField(req.body, "name", "AccountName"));
      if (name !== null) updates.name = name;

      const phone = readBodyString(pickBodyField(req.body, "phone", "Phone"));
      if (phone !== null) updates.phone = phone;

      const accountType = readBodyString(pickBodyField(req.body, "accountType", "AccountTypeID"));
      if (accountType !== null) updates.accountType = accountType;

      const portId = readBodyString(pickBodyField(req.body, "portId", "DefaultPortID"));
      if (portId !== null) updates.portId = portId;

      const notes = readBodyString(pickBodyField(req.body, "notes", "Notes"));
      if (notes !== null) updates.notes = notes;

      await db.update(accounts).set(updates).where(eq(accounts.id, accountId));
      invalidateLookupReadCache();
      return res.json({ message: ACCOUNT_UPDATED_MESSAGE });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.delete("/accounts/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const accountId = assertPositiveIntegerParam(req.params.id, "account id");
      await db.delete(accounts).where(eq(accounts.id, accountId));
      invalidateLookupReadCache();
      return res.json({ message: ACCOUNT_DELETED_MESSAGE });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

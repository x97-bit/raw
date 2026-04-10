import { Router, Response } from "express";
import { and, eq } from "drizzle-orm";
import { accounts } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { mapAccount } from "../../utils/accountMappings";
import {
  ACCOUNT_CREATED_MESSAGE,
  ACCOUNT_DELETED_MESSAGE,
  ACCOUNT_EXISTS_MESSAGE,
  ACCOUNT_UPDATED_MESSAGE,
  invalidateLookupReadCache,
  respondWithCachedLookup,
} from "./shared";

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

function filterApprovedTransportAccounts(result: any[]) {
  return (result || [])
    .filter((account) => isApprovedTransportTraderName(account?.AccountName || account?.name))
    .map((account) => {
      const canonicalName = getApprovedTransportTraderCanonicalName(account?.AccountName || account?.name);
      return {
        ...account,
        AccountName: canonicalName,
        name: canonicalName,
      };
    })
    .sort((left, right) => {
      const leftIndex = getApprovedTransportTraderOrderIndex(left?.AccountName || left?.name);
      const rightIndex = getApprovedTransportTraderOrderIndex(right?.AccountName || right?.name);
      const normalizedLeftIndex = leftIndex >= 0 ? leftIndex : Number.MAX_SAFE_INTEGER;
      const normalizedRightIndex = rightIndex >= 0 ? rightIndex : Number.MAX_SAFE_INTEGER;
      return normalizedLeftIndex - normalizedRightIndex;
    })
    .filter((account, index, list) => {
      const normalizedName = normalizeTransportTraderName(account?.AccountName || account?.name);
      return list.findIndex((item) => normalizeTransportTraderName(item?.AccountName || item?.name) === normalizedName) === index;
    });
}

export function registerAccountRoutes(router: Router) {
  router.get("/accounts", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      return respondWithCachedLookup(req, res, "/accounts", async () => {
        const { accountType, portId, port, type } = req.query;
        const conditions: any[] = [];
        if (accountType) conditions.push(eq(accounts.accountType, String(accountType)));
        if (type) conditions.push(eq(accounts.accountType, String(type)));
        if (portId) conditions.push(eq(accounts.portId, String(portId)));
        if (port && port !== "null") conditions.push(eq(accounts.portId, String(port)));

        let query = db.select().from(accounts);
        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as any;
        }

        const result = await query;
        const mappedAccounts = result.map(mapAccount);
        if (isTransportAccountsScope({ accountType, type, portId, port })) {
          return filterApprovedTransportAccounts(mappedAccounts);
        }
        return mappedAccounts;
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post("/accounts", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const data = {
        name: req.body.name || req.body.AccountName,
        accountType: req.body.accountType || req.body.AccountTypeID || "",
        portId: req.body.portId || req.body.DefaultPortID || null,
        phone: req.body.phone || req.body.Phone || null,
        notes: req.body.notes || req.body.Notes || null,
      };

      if (isTransportAccountsScope({ accountType: data.accountType, portId: data.portId }) && !isApprovedTransportTraderName(data.name)) {
        return res.status(400).json({
          error: "في النقل، التجار المعتمدون حاليًا هم: ابراهيم سعد، عبدالعزيز، صباح اسماعيل",
        });
      }

      if (data.name) {
        const conditions: any[] = [eq(accounts.name, data.name)];
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
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.put("/accounts/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const updates: any = {};
      if (req.body.name || req.body.AccountName) updates.name = req.body.name || req.body.AccountName;
      if (req.body.phone || req.body.Phone) updates.phone = req.body.phone || req.body.Phone;
      if (req.body.accountType || req.body.AccountTypeID) updates.accountType = req.body.accountType || req.body.AccountTypeID;
      if (req.body.portId || req.body.DefaultPortID) updates.portId = req.body.portId || req.body.DefaultPortID;
      if (req.body.notes || req.body.Notes) updates.notes = req.body.notes || req.body.Notes;

      await db.update(accounts).set(updates).where(eq(accounts.id, parseInt(req.params.id, 10)));
      invalidateLookupReadCache();
      return res.json({ message: ACCOUNT_UPDATED_MESSAGE });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.delete("/accounts/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      await db.delete(accounts).where(eq(accounts.id, parseInt(req.params.id, 10)));
      invalidateLookupReadCache();
      return res.json({ message: ACCOUNT_DELETED_MESSAGE });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

import { Router, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { accounts, debts } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware, requireAppUser } from "../../_core/appAuth";
import { financialWriteRateLimit } from "../../_core/financialRateLimits";
import { respondRouteError } from "../../_core/routeResponses";
import { assertPositiveIntegerParam, validateInput } from "../../_core/requestValidation";
import { getDb } from "../../db";
import type { AppDb } from "../../dbTypes";
import { hasBodyValue, parseOptionalInt, pickBodyField } from "../../utils/bodyFields";
import { buildDebtMutationData, mapDebtRow } from "../../utils/debts";
import { safeWriteAuditLog } from "../../utils/safeAuditLog";
import { debtCreateSchema, debtUpdateSchema } from "../../utils/financialValidation";

type DebtInsert = typeof debts.$inferInsert;

const DEBT_VALIDATION_MESSAGE = "ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¯ظٹظ† ط؛ظٹط± طµط§ظ„ط­ط©";
const DEBT_UPDATE_VALIDATION_MESSAGE =
  "ط¨ظٹط§ظ†ط§طھ طھط­ط¯ظٹط« ط§ظ„ط¯ظٹظ† ط؛ظٹط± طµط§ظ„ط­ط©";
const DEBT_ID_LABEL = "ظ…ط¹ط±ظپ ط§ظ„ط¯ظٹظ†";
const DEBT_NOT_FOUND_MESSAGE = "ط§ظ„ط¯ظٹظ† ط؛ظٹط± ظ…ظˆط¬ظˆط¯";
const DEBT_CREATED_MESSAGE = "طھظ… ط¥ط¶ط§ظپط© ط§ظ„ط¯ظٹظ†";
const DEBT_UPDATED_MESSAGE = "طھظ… طھط­ط¯ظٹط« ط§ظ„ط¯ظٹظ†";
const DEBT_DELETED_MESSAGE = "طھظ… ط­ط°ظپ ط§ظ„ط¯ظٹظ†";
const DEBT_NO_CHANGES_MESSAGE = "ظ„ط§ طھظˆط¬ط¯ طھط؛ظٹظٹط±ط§طھ";
const DEBT_CREATE_SUMMARY_PREFIX = "ط¥ظ†ط´ط§ط، ط¯ظٹظ†";
const DEBT_UPDATE_SUMMARY_PREFIX = "طھط­ط¯ظٹط« ط¯ظٹظ†";
const DEBT_DELETE_SUMMARY_PREFIX = "ط­ط°ظپ ط¯ظٹظ†";

async function resolveDebtDebtorName(db: AppDb, body: Record<string, unknown>) {
  const directName = pickBodyField(body, "debtorName", "accountName", "AccountName");
  if (hasBodyValue(directName)) return String(directName).trim();

  const accountId = parseOptionalInt(pickBodyField(body, "AccountID", "accountId", "account_id"));
  if (accountId) {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    if (account?.name) return account.name;
  }

  return "";
}

export function registerDebtRoutes(router: Router) {
  router.get("/debts", authMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const rows = await db.select().from(debts).orderBy(desc(debts.id));
      return res.json(rows.map(mapDebtRow));
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.post("/debts", authMiddleware, financialWriteRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const appUser = requireAppUser(req);
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const debtorName = await resolveDebtDebtorName(db, req.body);
      const data: DebtInsert = validateInput(
        debtCreateSchema,
        buildDebtMutationData(req.body, debtorName),
        DEBT_VALIDATION_MESSAGE,
      );

      const result = await db.insert(debts).values(data);
      const debtId = Number(result[0].insertId);

      await safeWriteAuditLog(db, {
        entityType: "debt",
        entityId: debtId,
        action: "create",
        summary: `${DEBT_CREATE_SUMMARY_PREFIX} ${debtorName || debtId}`,
        after: { id: debtId, ...data },
        appUser,
        metadata: { debtorName },
      });

      return res.json({ id: debtId, message: DEBT_CREATED_MESSAGE });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.put("/debts/:id", authMiddleware, financialWriteRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const appUser = requireAppUser(req);
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const debtId = assertPositiveIntegerParam(req.params.id, DEBT_ID_LABEL);
      const [existingDebt] = await db.select().from(debts).where(eq(debts.id, debtId)).limit(1);
      if (!existingDebt) return res.status(404).json({ error: DEBT_NOT_FOUND_MESSAGE });

      const debtorName = await resolveDebtDebtorName(db, req.body);
      const updates: Partial<DebtInsert> = validateInput(
        debtUpdateSchema,
        buildDebtMutationData(req.body, debtorName || undefined, { partial: true }),
        DEBT_UPDATE_VALIDATION_MESSAGE,
      );
      if (Object.keys(updates).length === 0) {
        return res.json({ message: DEBT_NO_CHANGES_MESSAGE });
      }

      await db.update(debts).set(updates).where(eq(debts.id, debtId));
      await safeWriteAuditLog(db, {
        entityType: "debt",
        entityId: debtId,
        action: "update",
        summary: `${DEBT_UPDATE_SUMMARY_PREFIX} ${existingDebt.debtorName || debtId}`,
        before: existingDebt,
        after: { ...existingDebt, ...updates },
        appUser,
        metadata: { debtorName: existingDebt.debtorName || debtorName || null, changedKeys: Object.keys(updates) },
      });

      return res.json({ message: DEBT_UPDATED_MESSAGE });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.delete("/debts/:id", authMiddleware, financialWriteRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const appUser = requireAppUser(req);
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const debtId = assertPositiveIntegerParam(req.params.id, DEBT_ID_LABEL);
      const [existingDebt] = await db.select().from(debts).where(eq(debts.id, debtId)).limit(1);
      if (!existingDebt) return res.status(404).json({ error: DEBT_NOT_FOUND_MESSAGE });

      await db.delete(debts).where(eq(debts.id, debtId));
      await safeWriteAuditLog(db, {
        entityType: "debt",
        entityId: debtId,
        action: "delete",
        summary: `${DEBT_DELETE_SUMMARY_PREFIX} ${existingDebt.debtorName || debtId}`,
        before: existingDebt,
        appUser,
        metadata: { debtorName: existingDebt.debtorName || null },
      });

      return res.json({ message: DEBT_DELETED_MESSAGE });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

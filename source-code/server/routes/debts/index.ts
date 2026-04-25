import { Router, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { accounts, debts } from "../../../drizzle/schema";
import {
  AuthRequest,
  authMiddleware,
  requireAppUser,
  requirePermission,
} from "../../_core/appAuth";
import { financialWriteRateLimit } from "../../_core/financialRateLimits";
import { respondRouteError } from "../../_core/routeResponses";
import {
  assertPositiveIntegerParam,
  validateInput,
} from "../../_core/requestValidation";
import { getDb } from "../../db/db";
import type { AppDb } from "../../db/schema/dbTypes";
import {
  hasBodyValue,
  parseOptionalInt,
  pickBodyField,
} from "../../utils/bodyFields";
import { buildDebtMutationData, mapDebtRow } from "../../utils/debts";
import { safeWriteAuditLog } from "../../utils/safeAuditLog";
import {
  debtCreateSchema,
  debtUpdateSchema,
} from "../../utils/financialValidation";

type DebtInsert = typeof debts.$inferInsert;

const DEBT_VALIDATION_MESSAGE = "بيانات الدين غير صالحة";
const DEBT_UPDATE_VALIDATION_MESSAGE = "بيانات تحديث الدين غير صالحة";
const DEBT_ID_LABEL = "معرف الدين";
const DEBT_NOT_FOUND_MESSAGE = "الدين غير موجود";
const DEBT_CREATED_MESSAGE = "تم إضافة الدين";
const DEBT_UPDATED_MESSAGE = "تم تحديث الدين";
const DEBT_DELETED_MESSAGE = "تم حذف الدين";
const DEBT_NO_CHANGES_MESSAGE = "لا توجد تغييرات";
const DEBT_CREATE_SUMMARY_PREFIX = "إنشاء دين";
const DEBT_UPDATE_SUMMARY_PREFIX = "تحديث دين";
const DEBT_DELETE_SUMMARY_PREFIX = "حذف دين";

async function resolveDebtDebtorName(db: AppDb, body: Record<string, unknown>) {
  const directName = pickBodyField(
    body,
    "debtorName",
    "accountName",
    "AccountName"
  );
  if (hasBodyValue(directName)) return String(directName).trim();

  const accountId = parseOptionalInt(
    pickBodyField(body, "AccountID", "accountId", "account_id")
  );
  if (accountId) {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);
    if (account?.name) return account.name;
  }

  return "";
}

export function registerDebtRoutes(router: Router) {
  router.get(
    "/debts",
    authMiddleware,
    async (_req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const rows = await db.select().from(debts).orderBy(desc(debts.id));
        return res.json(rows.map(mapDebtRow));
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.post(
    "/debts",
    authMiddleware,
    financialWriteRateLimit,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!requirePermission(req, res, "manage_debts")) return;

        const appUser = requireAppUser(req);
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const debtorName = await resolveDebtDebtorName(db, req.body);
        const data: DebtInsert = validateInput(
          debtCreateSchema,
          buildDebtMutationData(req.body, debtorName),
          DEBT_VALIDATION_MESSAGE
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
    }
  );

  router.put(
    "/debts/:id",
    authMiddleware,
    financialWriteRateLimit,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!requirePermission(req, res, "manage_debts")) return;

        const appUser = requireAppUser(req);
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const debtId = assertPositiveIntegerParam(req.params.id, DEBT_ID_LABEL);
        const [existingDebt] = await db
          .select()
          .from(debts)
          .where(eq(debts.id, debtId))
          .limit(1);
        if (!existingDebt)
          return res.status(404).json({ error: DEBT_NOT_FOUND_MESSAGE });

        const debtorName = await resolveDebtDebtorName(db, req.body);
        const updates: Partial<DebtInsert> = validateInput(
          debtUpdateSchema,
          buildDebtMutationData(req.body, debtorName || undefined, {
            partial: true,
          }),
          DEBT_UPDATE_VALIDATION_MESSAGE
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
          metadata: {
            debtorName: existingDebt.debtorName || debtorName || null,
            changedKeys: Object.keys(updates),
          },
        });

        return res.json({ message: DEBT_UPDATED_MESSAGE });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.delete(
    "/debts/:id",
    authMiddleware,
    financialWriteRateLimit,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!requirePermission(req, res, "manage_debts")) return;

        const appUser = requireAppUser(req);
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const debtId = assertPositiveIntegerParam(req.params.id, DEBT_ID_LABEL);
        const [existingDebt] = await db
          .select()
          .from(debts)
          .where(eq(debts.id, debtId))
          .limit(1);
        if (!existingDebt)
          return res.status(404).json({ error: DEBT_NOT_FOUND_MESSAGE });

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
    }
  );
}

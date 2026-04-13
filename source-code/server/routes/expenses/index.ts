import { Router, Response } from "express";
import { accounts, expenses } from "../../../drizzle/schema";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { AuthRequest, authMiddleware, requireAppUser } from "../../_core/appAuth";
import { financialWriteRateLimit } from "../../_core/financialRateLimits";
import { respondRouteError } from "../../_core/routeResponses";
import { assertPositiveIntegerParam, validateInput } from "../../_core/requestValidation";
import { getDb } from "../../db";
import type { AppDb } from "../../dbTypes";
import { expenseMutationSchema, expenseUpdateSchema } from "../../utils/financialValidation";
import { normalizeExpenseChargeTarget } from "../../utils/expenses";
import { safeWriteAuditLog } from "../../utils/safeAuditLog";

const CREATE_VALIDATION_MESSAGE = "بيانات المصروف غير صالحة";
const UPDATE_VALIDATION_MESSAGE = "بيانات تحديث المصروف غير صالحة";
const EXPENSE_ID_LABEL = "معرف المصروف";
const EXPENSE_NOT_FOUND_MESSAGE = "المصروف غير موجود";
const CREATE_SUCCESS_MESSAGE = "تمت إضافة المصروف بنجاح";
const UPDATE_SUCCESS_MESSAGE = "تم تحديث المصروف";
const DELETE_SUCCESS_MESSAGE = "تم حذف المصروف";
const CREATE_SUMMARY_PREFIX = "إنشاء مصروف";
const UPDATE_SUMMARY_PREFIX = "تحديث مصروف";
const DELETE_SUMMARY_PREFIX = "حذف مصروف";

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

async function resolveExpenseAccount(db: AppDb, accountId: unknown) {
  const normalizedAccountId = Number(accountId);
  if (!Number.isInteger(normalizedAccountId) || normalizedAccountId <= 0) {
    return { accountId: null, accountName: null };
  }

  const [account] = await db.select().from(accounts).where(eq(accounts.id, normalizedAccountId)).limit(1);
  return {
    accountId: account ? account.id : null,
    accountName: account ? account.name : null,
  };
}

export function registerExpenseRoutes(router: Router) {
  router.get("/expenses", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const requestedPortId = readQueryString(req.query.portId);
      const conditions: SQL<unknown>[] = [];
      if (requestedPortId) conditions.push(eq(expenses.portId, requestedPortId));

      const query = conditions.length > 0
        ? db.select().from(expenses).where(and(...conditions))
        : db.select().from(expenses);
      const rows = await query.orderBy(desc(expenses.expenseDate));

      return res.json(rows);
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.post("/expenses", authMiddleware, financialWriteRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const appUser = requireAppUser(req);
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const chargeTarget = normalizeExpenseChargeTarget(req.body?.chargeTarget);
      const resolvedAccount = chargeTarget === "trader"
        ? await resolveExpenseAccount(db, req.body?.accountId)
        : { accountId: null, accountName: null };

      const data = validateInput(
        expenseMutationSchema,
        {
          expenseDate: req.body?.expenseDate || new Date().toISOString().split("T")[0],
          amountUSD: req.body?.amountUSD ? String(req.body.amountUSD) : "0",
          amountIQD: req.body?.amountIQD ? String(req.body.amountIQD) : "0",
          description: req.body?.description || null,
          portId: req.body?.portId || "general",
          chargeTarget,
          accountId: resolvedAccount.accountId,
          accountName: resolvedAccount.accountName,
          createdBy: appUser.id,
        },
        CREATE_VALIDATION_MESSAGE,
      );

      const result = await db.insert(expenses).values(data);
      const expenseId = Number(result[0].insertId);
      await safeWriteAuditLog(db, {
        entityType: "expense",
        entityId: expenseId,
        action: "create",
        summary: `${CREATE_SUMMARY_PREFIX} ${data.portId}`,
        after: { id: expenseId, ...data },
        appUser,
        metadata: { portId: data.portId, chargeTarget: data.chargeTarget, accountId: data.accountId || null },
      });

      return res.json({ id: expenseId, message: CREATE_SUCCESS_MESSAGE });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.put("/expenses/:id", authMiddleware, financialWriteRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const appUser = requireAppUser(req);
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const expenseId = assertPositiveIntegerParam(req.params.id, EXPENSE_ID_LABEL);
      const [existingExpense] = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);
      if (!existingExpense) return res.status(404).json({ error: EXPENSE_NOT_FOUND_MESSAGE });

      const nextChargeTarget = req.body?.chargeTarget !== undefined
        ? normalizeExpenseChargeTarget(req.body?.chargeTarget)
        : normalizeExpenseChargeTarget(existingExpense.chargeTarget);

      const resolvedAccount = nextChargeTarget === "trader"
        ? await resolveExpenseAccount(db, req.body?.accountId ?? existingExpense.accountId)
        : { accountId: null, accountName: null };

      const rawUpdates: Record<string, unknown> = {};
      if (req.body?.expenseDate !== undefined) rawUpdates.expenseDate = req.body.expenseDate;
      if (req.body?.amountUSD !== undefined) rawUpdates.amountUSD = String(req.body.amountUSD ?? "0");
      if (req.body?.amountIQD !== undefined) rawUpdates.amountIQD = String(req.body.amountIQD ?? "0");
      if (req.body?.description !== undefined) rawUpdates.description = req.body.description || null;
      if (req.body?.portId !== undefined) rawUpdates.portId = req.body.portId || "general";
      if (req.body?.chargeTarget !== undefined) rawUpdates.chargeTarget = nextChargeTarget;
      if (req.body?.accountId !== undefined || req.body?.chargeTarget !== undefined) {
        rawUpdates.accountId = resolvedAccount.accountId;
        rawUpdates.accountName = resolvedAccount.accountName;
      }

      const updates = validateInput(expenseUpdateSchema, rawUpdates, UPDATE_VALIDATION_MESSAGE);
      await db.update(expenses).set(updates).where(eq(expenses.id, expenseId));
      await safeWriteAuditLog(db, {
        entityType: "expense",
        entityId: expenseId,
        action: "update",
        summary: `${UPDATE_SUMMARY_PREFIX} ${existingExpense.portId || expenseId}`,
        before: existingExpense,
        after: { ...existingExpense, ...updates },
        appUser,
        metadata: { portId: updates.portId || existingExpense.portId, chargeTarget: updates.chargeTarget || existingExpense.chargeTarget },
      });

      return res.json({ message: UPDATE_SUCCESS_MESSAGE });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.delete("/expenses/:id", authMiddleware, financialWriteRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const appUser = requireAppUser(req);
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const expenseId = assertPositiveIntegerParam(req.params.id, EXPENSE_ID_LABEL);
      const [existingExpense] = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);
      if (!existingExpense) return res.status(404).json({ error: EXPENSE_NOT_FOUND_MESSAGE });

      await db.delete(expenses).where(eq(expenses.id, expenseId));
      await safeWriteAuditLog(db, {
        entityType: "expense",
        entityId: expenseId,
        action: "delete",
        summary: `${DELETE_SUMMARY_PREFIX} ${existingExpense.portId || expenseId}`,
        before: existingExpense,
        appUser,
        metadata: { portId: existingExpense.portId || null, chargeTarget: existingExpense.chargeTarget || null },
      });

      return res.json({ message: DELETE_SUCCESS_MESSAGE });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

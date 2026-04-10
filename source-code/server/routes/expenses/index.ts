import { Router, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { expenses } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { financialWriteRateLimit } from "../../_core/financialRateLimits";
import { respondRouteError } from "../../_core/routeResponses";
import { assertPositiveIntegerParam, validateInput } from "../../_core/requestValidation";
import { getDb } from "../../db";
import { expenseMutationSchema, expenseUpdateSchema } from "../../utils/financialValidation";
import { safeWriteAuditLog } from "../../utils/safeAuditLog";

const CREATE_VALIDATION_MESSAGE = "بيانات المصروف غير صالحة";
const UPDATE_VALIDATION_MESSAGE = "بيانات تحديث المصروف غير صالحة";
const EXPENSE_ID_LABEL = "معرف المصروف";
const EXPENSE_NOT_FOUND_MESSAGE = "المصروف غير موجود";
const CREATE_SUCCESS_MESSAGE = "تم إضافة المصروف بنجاح";
const UPDATE_SUCCESS_MESSAGE = "تم تحديث المصروف";
const DELETE_SUCCESS_MESSAGE = "تم حذف المصروف";
const CREATE_SUMMARY_PREFIX = "إنشاء مصروف";
const UPDATE_SUMMARY_PREFIX = "تحديث مصروف";
const DELETE_SUMMARY_PREFIX = "حذف مصروف";

export function registerExpenseRoutes(router: Router) {
  router.get("/expenses", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const { portId } = req.query;
      const conditions: any[] = [];
      if (portId) conditions.push(eq(expenses.portId, String(portId)));

      let query = db.select().from(expenses);
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const rows = await (query as any).orderBy(desc(expenses.expenseDate));
      return res.json(rows);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post("/expenses", authMiddleware, financialWriteRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const { expenseDate, amountUSD, amountIQD, description, portId } = req.body;
      const data = validateInput(
        expenseMutationSchema,
        {
          expenseDate: expenseDate || new Date().toISOString().split("T")[0],
          amountUSD: amountUSD ? String(amountUSD) : "0",
          amountIQD: amountIQD ? String(amountIQD) : "0",
          description: description || null,
          portId: portId || "general",
          createdBy: req.appUser?.id || null,
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
        appUser: req.appUser,
        metadata: { portId: data.portId },
      });

      return res.json({ id: result[0].insertId, message: CREATE_SUCCESS_MESSAGE });
    } catch (error: any) {
      return respondRouteError(res, error);
    }
  });

  router.put("/expenses/:id", authMiddleware, financialWriteRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const expenseId = assertPositiveIntegerParam(req.params.id, EXPENSE_ID_LABEL);
      const [existingExpense] = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);
      if (!existingExpense) return res.status(404).json({ error: EXPENSE_NOT_FOUND_MESSAGE });

      const { expenseDate, amountUSD, amountIQD, description, portId } = req.body;
      const rawUpdates: Record<string, unknown> = {};
      if (expenseDate !== undefined) rawUpdates.expenseDate = expenseDate;
      if (amountUSD !== undefined) rawUpdates.amountUSD = String(amountUSD ?? "0");
      if (amountIQD !== undefined) rawUpdates.amountIQD = String(amountIQD ?? "0");
      if (description !== undefined) rawUpdates.description = description || null;
      if (portId !== undefined) rawUpdates.portId = portId || "general";

      const updates = validateInput(expenseUpdateSchema, rawUpdates, UPDATE_VALIDATION_MESSAGE);
      await db.update(expenses).set(updates).where(eq(expenses.id, expenseId));
      await safeWriteAuditLog(db, {
        entityType: "expense",
        entityId: expenseId,
        action: "update",
        summary: `${UPDATE_SUMMARY_PREFIX} ${existingExpense.portId || expenseId}`,
        before: existingExpense,
        after: { ...existingExpense, ...updates },
        appUser: req.appUser,
        metadata: { portId: updates.portId },
      });

      return res.json({ message: UPDATE_SUCCESS_MESSAGE });
    } catch (error: any) {
      return respondRouteError(res, error);
    }
  });

  router.delete("/expenses/:id", authMiddleware, financialWriteRateLimit, async (req: AuthRequest, res: Response) => {
    try {
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
        appUser: req.appUser,
        metadata: { portId: existingExpense.portId || null },
      });

      return res.json({ message: DELETE_SUCCESS_MESSAGE });
    } catch (error: any) {
      return respondRouteError(res, error);
    }
  });
}

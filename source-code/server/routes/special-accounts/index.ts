import { Router, Response } from "express";
import { eq, inArray } from "drizzle-orm";
import { specialAccounts } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { financialWriteRateLimit } from "../../_core/financialRateLimits";
import { respondRouteError } from "../../_core/routeResponses";
import { assertPositiveIntegerParam, validateInput } from "../../_core/requestValidation";
import { getDb } from "../../db";
import {
  buildHaiderSpecialReport,
  buildPartnershipSpecialReport,
  buildSpecialAccountMutationData,
  getSpecialAccountDateFilters,
} from "../../utils/specialAccounts";
import { specialAccountCreateSchema, specialAccountUpdateSchema } from "../../utils/financialValidation";
import { safeWriteAuditLog } from "../../utils/safeAuditLog";

type SpecialAccountInsert = typeof specialAccounts.$inferInsert;

const CREATE_VALIDATION_MESSAGE = "بيانات الحساب الخاص غير صالحة";
const UPDATE_VALIDATION_MESSAGE = "بيانات تحديث الحساب الخاص غير صالحة";
const SPECIAL_ACCOUNT_ID_LABEL = "معرف الحساب الخاص";
const SPECIAL_ACCOUNT_NOT_FOUND_MESSAGE = "السجل غير موجود";
const NO_CHANGES_MESSAGE = "لا توجد تغييرات";
const CREATED_MESSAGE = "تمت الإضافة";
const UPDATED_MESSAGE = "تم التحديث";
const DELETED_MESSAGE = "تم الحذف";
const CREATE_SUMMARY_PREFIX = "إنشاء سجل حساب خاص";
const UPDATE_SUMMARY_PREFIX = "تحديث سجل حساب خاص";
const DELETE_SUMMARY_PREFIX = "حذف سجل حساب خاص";

export function registerSpecialAccountRoutes(router: Router) {
  router.get("/special/haider", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const rows = await db.select().from(specialAccounts).where(eq(specialAccounts.type, "haider"));
      const filters = getSpecialAccountDateFilters(req.query as Record<string, unknown>);
      return res.json(buildHaiderSpecialReport(rows, filters));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get("/special/partnership", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const rows = await db.select().from(specialAccounts).where(inArray(specialAccounts.type, ["partnership", "yaser"]));
      const filters = getSpecialAccountDateFilters(req.query as Record<string, unknown>);
      return res.json(buildPartnershipSpecialReport(rows, filters));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post("/special", authMiddleware, financialWriteRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const payload = validateInput(
        specialAccountCreateSchema,
        buildSpecialAccountMutationData(req.body) as SpecialAccountInsert,
        CREATE_VALIDATION_MESSAGE,
      ) as SpecialAccountInsert;

      const result = await db.insert(specialAccounts).values(payload);
      const specialId = Number(result[0].insertId);
      await safeWriteAuditLog(db, {
        entityType: "special_account",
        entityId: specialId,
        action: "create",
        summary: `${CREATE_SUMMARY_PREFIX} ${payload.type || ""}`.trim(),
        after: { id: specialId, ...payload },
        appUser: req.appUser,
        metadata: { type: payload.type || null, name: payload.name || null },
      });

      return res.json({ id: specialId, message: CREATED_MESSAGE });
    } catch (error: any) {
      return respondRouteError(res, error);
    }
  });

  router.put("/special/:id", authMiddleware, financialWriteRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const specialId = assertPositiveIntegerParam(req.params.id, SPECIAL_ACCOUNT_ID_LABEL);
      const [existingSpecial] = await db.select().from(specialAccounts).where(eq(specialAccounts.id, specialId)).limit(1);
      if (!existingSpecial) return res.status(404).json({ error: SPECIAL_ACCOUNT_NOT_FOUND_MESSAGE });

      const payload = validateInput(
        specialAccountUpdateSchema,
        buildSpecialAccountMutationData(req.body, undefined, { partial: true }) as Partial<SpecialAccountInsert>,
        UPDATE_VALIDATION_MESSAGE,
      ) as Partial<SpecialAccountInsert>;
      if (Object.keys(payload).length === 0) return res.json({ message: NO_CHANGES_MESSAGE });

      await db.update(specialAccounts).set(payload).where(eq(specialAccounts.id, specialId));
      await safeWriteAuditLog(db, {
        entityType: "special_account",
        entityId: specialId,
        action: "update",
        summary: `${UPDATE_SUMMARY_PREFIX} ${existingSpecial.type || ""}`.trim(),
        before: existingSpecial,
        after: { ...existingSpecial, ...payload },
        appUser: req.appUser,
        metadata: { type: existingSpecial.type || null, changedKeys: Object.keys(payload) },
      });

      return res.json({ message: UPDATED_MESSAGE });
    } catch (error: any) {
      return respondRouteError(res, error);
    }
  });

  router.delete("/special/:id", authMiddleware, financialWriteRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const specialId = assertPositiveIntegerParam(req.params.id, SPECIAL_ACCOUNT_ID_LABEL);
      const [existingSpecial] = await db.select().from(specialAccounts).where(eq(specialAccounts.id, specialId)).limit(1);
      if (!existingSpecial) return res.status(404).json({ error: SPECIAL_ACCOUNT_NOT_FOUND_MESSAGE });

      await db.delete(specialAccounts).where(eq(specialAccounts.id, specialId));
      await safeWriteAuditLog(db, {
        entityType: "special_account",
        entityId: specialId,
        action: "delete",
        summary: `${DELETE_SUMMARY_PREFIX} ${existingSpecial.type || ""}`.trim(),
        before: existingSpecial,
        appUser: req.appUser,
        metadata: { type: existingSpecial.type || null, name: existingSpecial.name || null },
      });

      return res.json({ message: DELETED_MESSAGE });
    } catch (error: any) {
      return respondRouteError(res, error);
    }
  });
}

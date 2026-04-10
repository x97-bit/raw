import { Router, Response } from "express";
import { and, eq } from "drizzle-orm";
import { customFieldValues } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { assertPositiveIntegerParam } from "../../_core/requestValidation";
import { getDb } from "../../db";
import { safeWriteAuditLog } from "../../utils/safeAuditLog";
import {
  CUSTOM_FIELD_VALUES_SAVED_MESSAGE,
  CUSTOM_FIELD_VALUE_ENTITY_ID_LABEL,
  VALUES_ARRAY_REQUIRED_MESSAGE,
} from "./shared";

export function registerCustomFieldValueRoutes(router: Router) {
  router.get("/custom-field-values/:entityType/:entityId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const values = await db
        .select()
        .from(customFieldValues)
        .where(
          and(
            eq(customFieldValues.entityType, req.params.entityType),
            eq(
              customFieldValues.entityId,
              assertPositiveIntegerParam(req.params.entityId, CUSTOM_FIELD_VALUE_ENTITY_ID_LABEL),
            ),
          ),
        );
      return res.json(values);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post("/custom-field-values/:entityType/:entityId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const { values } = req.body;
      const entityType = req.params.entityType;
      const entityId = assertPositiveIntegerParam(req.params.entityId, CUSTOM_FIELD_VALUE_ENTITY_ID_LABEL);
      if (!Array.isArray(values)) return res.status(400).json({ error: VALUES_ARRAY_REQUIRED_MESSAGE });

      const beforeValues = await db
        .select()
        .from(customFieldValues)
        .where(and(eq(customFieldValues.entityType, entityType), eq(customFieldValues.entityId, entityId)));

      await db
        .delete(customFieldValues)
        .where(and(eq(customFieldValues.entityType, entityType), eq(customFieldValues.entityId, entityId)));

      for (const value of values) {
        if (value.value !== null && value.value !== undefined && value.value !== "") {
          await db.insert(customFieldValues).values({
            customFieldId: value.customFieldId,
            entityType,
            entityId,
            value: String(value.value),
          });
        }
      }

      const afterValues = await db
        .select()
        .from(customFieldValues)
        .where(and(eq(customFieldValues.entityType, entityType), eq(customFieldValues.entityId, entityId)));

      await safeWriteAuditLog(db, {
        entityType: "custom_field_values",
        entityId,
        action: "update",
        summary: `طھط­ط¯ظٹط« ظ‚ظٹظ… ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ظ…ط®طµطµط© ظ„ظ„ظƒظٹط§ظ† ${entityType}#${entityId}`,
        before: { entityType, entityId, values: beforeValues },
        after: { entityType, entityId, values: afterValues },
        appUser: req.appUser,
        metadata: { entityType, entityId, valueCount: afterValues.length },
      });

      return res.json({ message: CUSTOM_FIELD_VALUES_SAVED_MESSAGE });
    } catch (error: any) {
      return respondRouteError(res, error);
    }
  });
}

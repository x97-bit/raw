import { Router, Response } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { customFieldValues, customFields, fieldConfig } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { assertPositiveIntegerParam } from "../../_core/requestValidation";
import { getDb } from "../../db";
import { getCustomFieldsWithSections, syncCustomFieldSections } from "../../utils/customFieldSections";
import {
  CUSTOM_FIELD_CREATED_MESSAGE,
  CUSTOM_FIELD_DELETED_MESSAGE,
  CUSTOM_FIELD_ID_LABEL,
  CUSTOM_FIELD_NOT_FOUND_MESSAGE,
  CUSTOM_FIELD_UPDATED_MESSAGE,
} from "./shared";

export function registerCustomFieldRoutes(router: Router) {
  router.get("/custom-fields", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const sectionKey = typeof req.query.sectionKey === "string" ? req.query.sectionKey : undefined;
      const fields = await getCustomFieldsWithSections(db, sectionKey);
      return res.json(fields);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post("/custom-fields", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const { label, fieldType, options, defaultValue, placement, sections, formula } = req.body;
      const maxIdResult = await db.select({ maxId: sql<number>`COALESCE(MAX(id), 0)` }).from(customFields);
      const nextId = (maxIdResult[0]?.maxId || 0) + 1;
      const fieldKey = `custom_${nextId}`;
      const result = await db.insert(customFields).values({
        fieldKey,
        label,
        fieldType: fieldType || "text",
        options: options || null,
        defaultValue: defaultValue || null,
        formula: fieldType === "formula" ? formula || null : null,
        placement: placement || "transaction",
      });

      const newId = Number(result[0].insertId);
      if (Array.isArray(sections)) {
        for (const sectionKey of sections) {
          const maxOrder = await db
            .select({ maxOrder: sql<number>`COALESCE(MAX(sort_order), 0)` })
            .from(fieldConfig)
            .where(eq(fieldConfig.sectionKey, sectionKey));
          const nextOrder = (maxOrder[0]?.maxOrder || 0) + 1;
          await db.insert(fieldConfig).values({
            sectionKey,
            fieldKey,
            visible: 1,
            sortOrder: nextOrder,
            displayLabel: null,
          });
        }
      }

      return res.json({ id: newId, fieldKey, message: CUSTOM_FIELD_CREATED_MESSAGE });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.put("/custom-fields/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const id = assertPositiveIntegerParam(req.params.id, CUSTOM_FIELD_ID_LABEL);
      const { label, fieldType, options, defaultValue, placement, formula, sections } = req.body;
      const [existingField] = await db.select().from(customFields).where(eq(customFields.id, id)).limit(1);
      if (!existingField) return res.status(404).json({ error: CUSTOM_FIELD_NOT_FOUND_MESSAGE });

      const beforeSections = await db
        .select()
        .from(fieldConfig)
        .where(eq(fieldConfig.fieldKey, existingField.fieldKey))
        .orderBy(asc(fieldConfig.sectionKey), asc(fieldConfig.sortOrder));

      await db
        .update(customFields)
        .set({
          label,
          fieldType,
          options,
          defaultValue,
          placement,
          formula: fieldType === "formula" ? formula || null : null,
        })
        .where(eq(customFields.id, id));

      if (Array.isArray(sections)) {
        await syncCustomFieldSections(db, existingField.fieldKey, sections);
      }

      const [updatedField] = await db.select().from(customFields).where(eq(customFields.id, id)).limit(1);
      const afterSections = await db
        .select()
        .from(fieldConfig)
        .where(eq(fieldConfig.fieldKey, existingField.fieldKey))
        .orderBy(asc(fieldConfig.sectionKey), asc(fieldConfig.sortOrder));

      return res.json({ message: CUSTOM_FIELD_UPDATED_MESSAGE });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.delete("/custom-fields/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const id = assertPositiveIntegerParam(req.params.id, CUSTOM_FIELD_ID_LABEL);
      const field = await db.select().from(customFields).where(eq(customFields.id, id));
      if (field.length === 0) return res.status(404).json({ error: CUSTOM_FIELD_NOT_FOUND_MESSAGE });

      const fieldKey = field[0].fieldKey;
      const existingSections = await db
        .select()
        .from(fieldConfig)
        .where(eq(fieldConfig.fieldKey, fieldKey))
        .orderBy(asc(fieldConfig.sectionKey), asc(fieldConfig.sortOrder));
      const existingValues = await db.select().from(customFieldValues).where(eq(customFieldValues.customFieldId, id));

      await db.delete(customFieldValues).where(eq(customFieldValues.customFieldId, id));
      await db.delete(fieldConfig).where(eq(fieldConfig.fieldKey, fieldKey));
      await db.delete(customFields).where(eq(customFields.id, id));

      return res.json({ message: CUSTOM_FIELD_DELETED_MESSAGE });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

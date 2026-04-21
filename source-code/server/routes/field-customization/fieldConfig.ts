import { Router, Response } from "express";
import { and, asc, eq } from "drizzle-orm";
import { fieldConfig } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { FIELD_SETTINGS_UPDATED_MESSAGE, FIELDS_ARRAY_REQUIRED_MESSAGE } from "./shared";

export function registerFieldConfigRoutes(router: Router) {
  router.get("/field-config/:sectionKey", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const configs = await db
        .select()
        .from(fieldConfig)
        .where(eq(fieldConfig.sectionKey, req.params.sectionKey))
        .orderBy(asc(fieldConfig.sortOrder));
      return res.json(configs);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get("/field-config", authMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const configs = await db.select().from(fieldConfig).orderBy(asc(fieldConfig.sectionKey), asc(fieldConfig.sortOrder));
      return res.json(configs);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.put("/field-config/:sectionKey", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const sectionKey = req.params.sectionKey;
      const { fields } = req.body;
      if (!Array.isArray(fields)) return res.status(400).json({ error: FIELDS_ARRAY_REQUIRED_MESSAGE });

      const beforeConfigs = await db
        .select()
        .from(fieldConfig)
        .where(eq(fieldConfig.sectionKey, sectionKey))
        .orderBy(asc(fieldConfig.sortOrder));

      for (const field of fields) {
        const displayLabel =
          typeof field.displayLabel === "string" && field.displayLabel.trim() ? field.displayLabel.trim() : null;
        const existing = await db
          .select()
          .from(fieldConfig)
          .where(and(eq(fieldConfig.sectionKey, sectionKey), eq(fieldConfig.fieldKey, field.fieldKey)));

        if (existing.length > 0) {
          await db
            .update(fieldConfig)
            .set({ visible: field.visible ? 1 : 0, sortOrder: field.sortOrder || 0, displayLabel })
            .where(and(eq(fieldConfig.sectionKey, sectionKey), eq(fieldConfig.fieldKey, field.fieldKey)));
        } else {
          await db.insert(fieldConfig).values({
            sectionKey,
            fieldKey: field.fieldKey,
            visible: field.visible ? 1 : 0,
            sortOrder: field.sortOrder || 0,
            displayLabel,
          });
        }
      }

      const afterConfigs = await db
        .select()
        .from(fieldConfig)
        .where(eq(fieldConfig.sectionKey, sectionKey))
        .orderBy(asc(fieldConfig.sortOrder));

      return res.json({ message: FIELD_SETTINGS_UPDATED_MESSAGE });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

import { Router, Response } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import { fieldConfig } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db/db";
import {
  FIELD_SETTINGS_UPDATED_MESSAGE,
  FIELDS_ARRAY_REQUIRED_MESSAGE,
} from "./shared";

export function registerFieldConfigRoutes(router: Router) {
  router.get(
    "/field-config/:sectionKey",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
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
    }
  );

  router.get(
    "/field-config",
    authMiddleware,
    async (_req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const configs = await db
          .select()
          .from(fieldConfig)
          .orderBy(asc(fieldConfig.sectionKey), asc(fieldConfig.sortOrder));
        return res.json(configs);
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }
  );

  router.put(
    "/field-config/:sectionKey",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const sectionKey = req.params.sectionKey;
        const { fields } = req.body;
        if (!Array.isArray(fields))
          return res.status(400).json({ error: FIELDS_ARRAY_REQUIRED_MESSAGE });

        if (fields.length === 0)
          return res.json({ message: FIELD_SETTINGS_UPDATED_MESSAGE });

        // ── Bulk Upsert: single query instead of N+1 ────────────────────
        // Build a single INSERT ... ON DUPLICATE KEY UPDATE statement
        // to handle all fields in one round-trip to the database.
        const valueTuples = fields.map((field: any) => {
          const displayLabel =
            typeof field.displayLabel === "string" && field.displayLabel.trim()
              ? field.displayLabel.trim()
              : null;
          const visible = field.visible ? 1 : 0;
          const sortOrder = field.sortOrder || 0;
          const fieldKey = String(field.fieldKey || "").trim();

          return { sectionKey, fieldKey, visible, sortOrder, displayLabel };
        });

        // Filter out entries with empty fieldKey
        const validTuples = valueTuples.filter(
          (t: any) => t.fieldKey.length > 0
        );

        if (validTuples.length === 0)
          return res.json({ message: FIELD_SETTINGS_UPDATED_MESSAGE });

        // Use raw SQL for efficient bulk upsert with ON DUPLICATE KEY UPDATE.
        // This requires a unique index on (section_key, field_key).
        // First, ensure the unique index exists (idempotent).
        try {
          await db.execute(
            sql`ALTER TABLE field_config ADD UNIQUE INDEX uk_section_field (section_key, field_key)`
          );
        } catch {
          // Index already exists — safe to ignore
        }

        // Build parameterized bulk insert
        const sqlChunks: any[] = [];
        sqlChunks.push(
          sql`INSERT INTO field_config (section_key, field_key, visible, sort_order, display_label) VALUES `
        );

        for (let i = 0; i < validTuples.length; i++) {
          const t = validTuples[i];
          if (i > 0) sqlChunks.push(sql`, `);
          sqlChunks.push(
            sql`(${t.sectionKey}, ${t.fieldKey}, ${t.visible}, ${t.sortOrder}, ${t.displayLabel})`
          );
        }

        sqlChunks.push(
          sql` ON DUPLICATE KEY UPDATE visible = VALUES(visible), sort_order = VALUES(sort_order), display_label = VALUES(display_label)`
        );

        // Combine all chunks into a single SQL statement
        const finalSql = sql.join(sqlChunks, sql.raw(""));
        await db.execute(finalSql);

        return res.json({ message: FIELD_SETTINGS_UPDATED_MESSAGE });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }
  );
}

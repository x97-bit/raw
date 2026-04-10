import { Response, Router } from "express";
import { and, desc, eq, like, sql } from "drizzle-orm";
import { auditLogs } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db";
import { parseOptionalInt } from "../../utils/bodyFields";
import { requireAdmin } from "./shared";

export function registerAuditLogRoutes(router: Router) {
  router.get("/audit-logs", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const conditions = [];
      if (req.query.entityType) conditions.push(eq(auditLogs.entityType, String(req.query.entityType)));
      const entityId = parseOptionalInt(req.query.entityId);
      if (entityId) conditions.push(eq(auditLogs.entityId, entityId));
      if (req.query.action) conditions.push(eq(auditLogs.action, String(req.query.action)));
      if (typeof req.query.username === "string" && req.query.username.trim()) {
        conditions.push(like(auditLogs.username, `%${req.query.username.trim()}%`));
      }
      if (typeof req.query.from === "string" && req.query.from.trim()) {
        conditions.push(sql`DATE(${auditLogs.createdAt}) >= ${req.query.from.trim()}`);
      }
      if (typeof req.query.to === "string" && req.query.to.trim()) {
        conditions.push(sql`DATE(${auditLogs.createdAt}) <= ${req.query.to.trim()}`);
      }

      let query: any = db.select().from(auditLogs);
      if (conditions.length > 0) query = query.where(and(...conditions));

      const limit = Math.min(parseOptionalInt(req.query.limit) ?? 100, 500);
      const rows = await query.orderBy(desc(auditLogs.id)).limit(limit);
      return res.json(rows);
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

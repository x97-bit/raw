import { Response, Router } from "express";
import { and, desc, eq, like, sql, type SQL } from "drizzle-orm";
import { auditLogs } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db";
import { parseOptionalInt } from "../../utils/bodyFields";
import { requireAdmin } from "./shared";

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

export function registerAuditLogRoutes(router: Router) {
  router.get("/audit-logs", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const conditions: SQL<unknown>[] = [];
      const entityType = readQueryString(req.query.entityType);
      if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
      const entityId = parseOptionalInt(req.query.entityId);
      if (entityId) conditions.push(eq(auditLogs.entityId, entityId));
      const action = readQueryString(req.query.action);
      if (action) conditions.push(eq(auditLogs.action, action));
      const username = readQueryString(req.query.username);
      if (username) {
        conditions.push(like(auditLogs.username, `%${username}%`));
      }
      const from = readQueryString(req.query.from);
      if (from) {
        conditions.push(sql`DATE(${auditLogs.createdAt}) >= ${from}`);
      }
      const to = readQueryString(req.query.to);
      if (to) {
        conditions.push(sql`DATE(${auditLogs.createdAt}) <= ${to}`);
      }

      const query = conditions.length > 0
        ? db.select().from(auditLogs).where(and(...conditions))
        : db.select().from(auditLogs);

      const limit = Math.min(parseOptionalInt(req.query.limit) ?? 100, 500);
      const rows = await query.orderBy(desc(auditLogs.id)).limit(limit);
      return res.json(rows);
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

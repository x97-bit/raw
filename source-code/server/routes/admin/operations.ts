import { Router, Response } from "express";
import { sql } from "drizzle-orm";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { getDb } from "../../db/db";
import { logSystemError } from "../../_core/logger";
import { getCacheStatus } from "../../_core/cacheInit";
import { getRealtimeStatus } from "../../_core/realtimeInit";

// ============================================================================
// Admin Operations API
// ============================================================================
// Provides a secure, audited interface for administrative operations
// that previously required direct server access and running scripts.
// All operations require admin-level authentication and are fully logged.
// ============================================================================

function requireAdmin(req: AuthRequest, res: Response): boolean {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "غير مصرح - يتطلب صلاحيات المدير" });
    return false;
  }
  return true;
}

export function registerAdminOperationRoutes(router: Router) {
  // ── System Health Check ─────────────────────────────────────────────────
  router.get(
    "/admin/system-status",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!requireAdmin(req, res)) return;

        const db = await getDb();
        const dbStatus = db ? "connected" : "disconnected";

        // Get table row counts for monitoring
        let tableCounts: Record<string, number> = {};
        if (db) {
          try {
            const [rows] = await db.execute(sql`
              SELECT TABLE_NAME, TABLE_ROWS
              FROM information_schema.TABLES
              WHERE TABLE_SCHEMA = DATABASE()
              ORDER BY TABLE_ROWS DESC
            `) as any;
            for (const row of rows || []) {
              tableCounts[row.TABLE_NAME] = Number(row.TABLE_ROWS || 0);
            }
          } catch {
            tableCounts = { error: -1 };
          }
        }

        const cacheStatus = getCacheStatus();
        const realtimeStatus = getRealtimeStatus();

        return res.json({
          status: "healthy",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          database: dbStatus,
          tableCounts,
          cache: cacheStatus,
          realtime: realtimeStatus,
          nodeVersion: process.version,
        });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  // ── Cache Management ────────────────────────────────────────────────────
  router.post(
    "/admin/cache/clear",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!requireAdmin(req, res)) return;

        const { financialReportsCache, lookupDataCache } = await import("../../_core/redisCache");
        await financialReportsCache.clear();
        await lookupDataCache.clear();

        // Log the operation
        await logSystemError("admin:cache-clear", `Cache cleared by ${req.user?.username}`, {
          userId: req.user?.userId,
          action: "cache_clear",
        });

        return res.json({
          success: true,
          message: "تم مسح التخزين المؤقت بنجاح",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  // ── Database Backup Status ──────────────────────────────────────────────
  router.get(
    "/admin/backup-status",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!requireAdmin(req, res)) return;

        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const backupDir = path.resolve(process.cwd(), "database", "backups");

        let backups: Array<{ name: string; size: number; date: string }> = [];
        try {
          const files = await fs.readdir(backupDir);
          for (const file of files.slice(-20)) { // Last 20 backups
            const stat = await fs.stat(path.join(backupDir, file));
            backups.push({
              name: file,
              size: stat.size,
              date: stat.mtime.toISOString(),
            });
          }
          backups.sort((a, b) => b.date.localeCompare(a.date));
        } catch {
          // Backup directory doesn't exist
        }

        return res.json({
          backupDir,
          backups,
          totalBackups: backups.length,
        });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  // ── Audit Log Summary ───────────────────────────────────────────────────
  router.get(
    "/admin/audit-summary",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!requireAdmin(req, res)) return;

        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const [recentActivity] = await db.execute(sql`
          SELECT
            user_id AS userId,
            username,
            action,
            COUNT(*) AS actionCount,
            MAX(created_at) AS lastAction
          FROM audit_logs
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
          GROUP BY user_id, username, action
          ORDER BY lastAction DESC
          LIMIT 50
        `) as any;

        const [dailyCounts] = await db.execute(sql`
          SELECT
            DATE(created_at) AS date,
            COUNT(*) AS totalActions
          FROM audit_logs
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `) as any;

        return res.json({
          recentActivity: recentActivity || [],
          dailyCounts: dailyCounts || [],
          generatedAt: new Date().toISOString(),
        });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  // ── Safe Data Export ────────────────────────────────────────────────────
  router.post(
    "/admin/export-table",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!requireAdmin(req, res)) return;

        const { table } = req.body;
        const allowedTables = [
          "transactions", "accounts", "debts", "expenses",
          "drivers", "vehicles", "companies", "goods_types",
          "governorates", "audit_logs",
        ];

        if (!table || !allowedTables.includes(table)) {
          return res.status(400).json({
            error: "جدول غير مسموح",
            allowedTables,
          });
        }

        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const [rows] = await db.execute(
          sql.raw(`SELECT * FROM \`${table}\` ORDER BY id DESC LIMIT 10000`)
        ) as any;

        // Log the export
        await logSystemError("admin:export", `Table ${table} exported by ${req.user?.username}`, {
          userId: req.user?.userId,
          table,
          rowCount: rows?.length || 0,
        });

        return res.json({
          table,
          rowCount: rows?.length || 0,
          rows: rows || [],
          exportedAt: new Date().toISOString(),
          exportedBy: req.user?.username,
        });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

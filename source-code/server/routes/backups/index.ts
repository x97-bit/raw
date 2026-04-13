import { Response, Router } from "express";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { createRateLimitMiddleware } from "../../_core/rateLimit";
import { requireAdmin } from "../auth-users/shared";
import {
  APP_BACKUP_DIR,
  BACKUP_IMPORT_CONFIRM_PHRASE,
  buildBackupPayload,
  buildDownloadFileName,
  getBackupStatus,
  importBackupPayload,
  parseImportRequest,
  saveBackupPayload,
  validateBackupImportPayload,
} from "./shared";

const backupWriteRateLimit = createRateLimitMiddleware({
  keyPrefix: "backup-admin-write",
  windowMs: 10 * 60 * 1000,
  max: 12,
  message: "تم تجاوز عدد طلبات النسخ الاحتياطي. حاول مرة أخرى بعد قليل.",
});

const backupReadRateLimit = createRateLimitMiddleware({
  keyPrefix: "backup-admin-read",
  windowMs: 5 * 60 * 1000,
  max: 90,
  message: "تم تجاوز الحد المسموح لطلبات مراقبة النسخ الاحتياطي. حاول مرة أخرى بعد قليل.",
});

const backupDownloadRateLimit = createRateLimitMiddleware({
  keyPrefix: "backup-admin-download",
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "تم تجاوز الحد المسموح لطلبات تنزيل النسخ الاحتياطية. حاول مرة أخرى بعد قليل.",
});

function resolveActorLabel(req: AuthRequest) {
  return req.appUser?.username || req.appUser?.name || "admin";
}

function sendJsonDownload(res: Response, payload: unknown, fileName: string) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.status(200).send(JSON.stringify(payload, null, 2));
}

export function registerBackupRoutes(router: Router) {
  router.get("/backups/status", authMiddleware, backupReadRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;

      const status = await getBackupStatus();
      return res.json(status);
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.post("/backups/create", authMiddleware, backupWriteRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;

      const payload = await buildBackupPayload({
        templateOnly: false,
        generatedBy: resolveActorLabel(req),
      });
      const savedFile = await saveBackupPayload(payload);

      return res.json({
        message: "تم إنشاء النسخة الاحتياطية داخل الخادم.",
        file: savedFile,
        directory: APP_BACKUP_DIR,
        counts: payload.counts,
      });
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.get("/backups/export", authMiddleware, backupDownloadRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;

      const payload = await buildBackupPayload({
        templateOnly: false,
        generatedBy: resolveActorLabel(req),
      });

      return sendJsonDownload(res, payload, buildDownloadFileName("alrawi-backup-export"));
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.get("/backups/template", authMiddleware, backupDownloadRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;

      const payload = await buildBackupPayload({
        templateOnly: true,
        generatedBy: resolveActorLabel(req),
      });

      return sendJsonDownload(res, payload, buildDownloadFileName("alrawi-database-template"));
    } catch (error) {
      return respondRouteError(res, error);
    }
  });

  router.post("/backups/import", authMiddleware, backupWriteRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      if (!requireAdmin(req, res)) return;

      const payload = parseImportRequest(req.body);
      validateBackupImportPayload(payload.backup);

      if (payload.confirmPhrase !== BACKUP_IMPORT_CONFIRM_PHRASE) {
        return res.status(400).json({ error: "تأكيد الاستيراد مفقود أو غير صحيح." });
      }

      const result = await importBackupPayload({
        backup: payload.backup,
        includeUsers: payload.includeUsers,
        sourceFileName: payload.sourceFileName,
        generatedBy: resolveActorLabel(req),
      });

      return res.json(result);
    } catch (error) {
      return respondRouteError(res, error);
    }
  });
}

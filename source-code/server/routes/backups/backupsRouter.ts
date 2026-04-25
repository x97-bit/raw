import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, router } from "../../_core/trpc";
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

export const backupsRouter = router({
  status: adminProcedure.query(async () => {
    try {
      const status = await getBackupStatus();
      return status;
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to fetch backup status",
      });
    }
  }),

  create: adminProcedure.mutation(async ({ ctx }) => {
    try {
      const actorLabel = ctx.user.name || ctx.user.email || "admin";
      const payload = await buildBackupPayload({
        templateOnly: false,
        generatedBy: actorLabel,
      });
      const savedFile = await saveBackupPayload(payload);

      return {
        message: "تم إنشاء النسخة الاحتياطية داخل الخادم.",
        file: savedFile,
        directory: APP_BACKUP_DIR,
        counts: payload.counts,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to create backup",
      });
    }
  }),

  export: adminProcedure.mutation(async ({ ctx }) => {
    try {
      const actorLabel = ctx.user.name || ctx.user.email || "admin";
      const payload = await buildBackupPayload({
        templateOnly: false,
        generatedBy: actorLabel,
      });

      // Instead of streaming the file directly (which tRPC doesn't easily support via standard JSON),
      // we return the payload and the recommended filename. The frontend will trigger the download.
      return {
        payload,
        fileName: buildDownloadFileName("alrawi-backup-export"),
      };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to export backup",
      });
    }
  }),

  template: adminProcedure.mutation(async ({ ctx }) => {
    try {
      const actorLabel = ctx.user.name || ctx.user.email || "admin";
      const payload = await buildBackupPayload({
        templateOnly: true,
        generatedBy: actorLabel,
      });

      return {
        payload,
        fileName: buildDownloadFileName("alrawi-database-template"),
      };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to export template",
      });
    }
  }),

  import: adminProcedure
    .input(
      z.object({
        backup: z.any(),
        sourceFileName: z.string(),
        confirmPhrase: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const payload = parseImportRequest(input);
        validateBackupImportPayload(payload.backup);

        if (payload.confirmPhrase !== BACKUP_IMPORT_CONFIRM_PHRASE) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "تأكيد الاستيراد مفقود أو غير صحيح.",
          });
        }

        const actorLabel = ctx.user.name || ctx.user.email || "admin";
        const result = await importBackupPayload({
          backup: payload.backup,
          includeUsers: payload.includeUsers,
          sourceFileName: payload.sourceFileName,
          generatedBy: actorLabel,
        });

        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to import backup",
        });
      }
    }),
});

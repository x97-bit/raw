import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../../routers";
import { TRPCError } from "@trpc/server";

const mockShared = vi.hoisted(() => ({
  getBackupStatus: vi.fn().mockResolvedValue({ status: "ok" }),
  buildBackupPayload: vi
    .fn()
    .mockResolvedValue({ mock: "payload", counts: { users: 1 } }),
  saveBackupPayload: vi
    .fn()
    .mockResolvedValue({ fileName: "test-backup.json" }),
  parseImportRequest: vi.fn(input => input),
  validateBackupImportPayload: vi.fn(),
  importBackupPayload: vi
    .fn()
    .mockResolvedValue({ message: "تم الاستيراد بنجاح" }),
  buildDownloadFileName: vi.fn().mockReturnValue("mock-file.json"),
  APP_BACKUP_DIR: "/mock/dir",
  BACKUP_IMPORT_CONFIRM_PHRASE: "confirm-import",
}));

vi.mock("./shared", () => mockShared);

describe("backupsRouter", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const createContext = (role: "admin" | "user", id = 1) => ({
    user: { id, role, username: "test_user", active: 1, permissions: [] },
  });

  it("allows admin to get backup status", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const result = await caller.backups.status();
    expect(result.status).toBe("ok");
    expect(mockShared.getBackupStatus).toHaveBeenCalled();
  });

  it("rejects non-admin from getting backup status", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.backups.status()).rejects.toThrowError(TRPCError);
  });

  it("allows admin to create a server backup", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const result = await caller.backups.create();
    expect(result.message).toBe("تم إنشاء النسخة الاحتياطية داخل الخادم.");
    expect(result.file.fileName).toBe("test-backup.json");
    expect(mockShared.buildBackupPayload).toHaveBeenCalledWith({
      templateOnly: false,
      generatedBy: "test_user",
    });
    expect(mockShared.saveBackupPayload).toHaveBeenCalled();
  });

  it("rejects non-admin from creating a backup", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.backups.create()).rejects.toThrowError(TRPCError);
  });

  it("allows admin to export backup payload", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const result = await caller.backups.export();
    expect(result.payload.mock).toBe("payload");
    expect(result.fileName).toBe("mock-file.json");
  });

  it("rejects non-admin from exporting backup", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.backups.export()).rejects.toThrowError(TRPCError);
  });

  it("allows admin to import backup with correct confirm phrase", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const result = await caller.backups.import({
      backup: { some: "data" },
      sourceFileName: "source.json",
      confirmPhrase: "confirm-import",
    });
    expect(result.message).toBe("تم الاستيراد بنجاح");
    expect(mockShared.importBackupPayload).toHaveBeenCalled();
  });

  it("rejects admin from importing backup with invalid confirm phrase", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(
      caller.backups.import({
        backup: { some: "data" },
        sourceFileName: "source.json",
        confirmPhrase: "wrong-phrase",
      })
    ).rejects.toThrowError(/تأكيد الاستيراد مفقود أو غير صحيح/);
  });

  it("rejects non-admin from importing backup", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(
      caller.backups.import({
        backup: { some: "data" },
        sourceFileName: "source.json",
        confirmPhrase: "confirm-import",
      })
    ).rejects.toThrowError(TRPCError);
  });
});

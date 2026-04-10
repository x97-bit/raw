import { writeAuditLog } from "./audit";

export async function safeWriteAuditLog(db: any, payload: Parameters<typeof writeAuditLog>[1]) {
  try {
    await writeAuditLog(db, payload);
  } catch (error) {
    console.warn("[Audit] Failed to write audit log:", error);
  }
}

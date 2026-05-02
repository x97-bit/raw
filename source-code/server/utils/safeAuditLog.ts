import { writeAuditLog } from "./audit";
import type { AppDb } from "../db/schema/dbTypes";

export async function safeWriteAuditLog(
  db: AppDb | null | undefined,
  payload: Parameters<typeof writeAuditLog>[1]
) {
  try {
    await writeAuditLog(db, payload);
  } catch (error) {
    console.warn("[Audit] Failed to write audit log:", error);
  }
}

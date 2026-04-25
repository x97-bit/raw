import { auditLogs } from "../../drizzle/schema";

type AuditAction = "create" | "update" | "delete";

type AuditPayload = {
  entityType: string;
  entityId?: number | null;
  action: AuditAction;
  summary: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  appUser?: {
    id?: number | null;
    username?: string | null;
    name?: string | null;
  } | null;
  metadata?: Record<string, unknown> | null;
};

const REDACTED_KEYS = new Set(["password"]);

function normalizePrimitive(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return String(value);
  return value;
}

function sanitizeForAudit(value: unknown): unknown {
  const normalized = normalizePrimitive(value);

  if (normalized === undefined) return null;
  if (normalized === null) return null;
  if (Array.isArray(normalized))
    return normalized.map(entry => sanitizeForAudit(entry));
  if (typeof normalized !== "object") return normalized;

  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(
    normalized as Record<string, unknown>
  )) {
    if (REDACTED_KEYS.has(key)) {
      output[key] = "[REDACTED]";
      continue;
    }
    output[key] = sanitizeForAudit(entry);
  }
  return output;
}

function isEqualValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function buildAuditChanges(
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null
) {
  const safeBefore = sanitizeForAudit(before ?? null) as Record<
    string,
    unknown
  > | null;
  const safeAfter = sanitizeForAudit(after ?? null) as Record<
    string,
    unknown
  > | null;
  const changes: Record<string, { before: unknown; after: unknown }> = {};

  const keys = new Set([
    ...Object.keys(safeBefore ?? {}),
    ...Object.keys(safeAfter ?? {}),
  ]);

  for (const key of Array.from(keys)) {
    const beforeValue = safeBefore?.[key] ?? null;
    const afterValue = safeAfter?.[key] ?? null;
    if (isEqualValue(beforeValue, afterValue)) continue;
    changes[key] = {
      before: beforeValue,
      after: afterValue,
    };
  }

  return {
    beforeData: safeBefore,
    afterData: safeAfter,
    changes,
  };
}

export async function writeAuditLog(db: any, payload: AuditPayload) {
  if (!db) return;

  const { beforeData, afterData, changes } = buildAuditChanges(
    payload.before,
    payload.after
  );
  if (payload.action === "update" && Object.keys(changes).length === 0) {
    return;
  }
  const actor = payload.appUser ?? null;

  await db.insert(auditLogs).values({
    entityType: payload.entityType,
    entityId: payload.entityId ?? null,
    action: payload.action,
    summary: payload.summary,
    beforeData,
    afterData,
    changes,
    metadata: sanitizeForAudit(payload.metadata ?? null),
    userId: actor?.id ?? null,
    username: actor?.username ?? actor?.name ?? null,
  });
}

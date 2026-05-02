import { emitTransactionEvent, emitDebtEvent, emitReportInvalidation } from "./websocket";
import { financialReportsCache } from "./redisCache";

// ============================================================================
// Mutation Broadcast Module
// ============================================================================
// Centralizes the side effects that should occur after any data mutation:
// 1. Invalidate relevant caches (Redis or in-memory)
// 2. Broadcast real-time events to connected WebSocket clients
//
// Usage: Call the appropriate function after a successful database mutation.
// ============================================================================

/**
 * Call after creating a new transaction.
 */
export async function onTransactionCreated(
  transaction: { id: number; portId?: string; accountType?: string; accountId?: number },
  userId?: number
): Promise<void> {
  // Invalidate financial reports cache
  await financialReportsCache.clear();

  // Broadcast to connected clients
  emitTransactionEvent("created", transaction, userId);
  emitReportInvalidation(transaction.portId, transaction.accountType);
}

/**
 * Call after updating an existing transaction.
 */
export async function onTransactionUpdated(
  transaction: { id: number; portId?: string; accountType?: string; accountId?: number },
  userId?: number
): Promise<void> {
  await financialReportsCache.clear();
  emitTransactionEvent("updated", transaction, userId);
  emitReportInvalidation(transaction.portId, transaction.accountType);
}

/**
 * Call after deleting a transaction.
 */
export async function onTransactionDeleted(
  transaction: { id: number; portId?: string; accountType?: string; accountId?: number },
  userId?: number
): Promise<void> {
  await financialReportsCache.clear();
  emitTransactionEvent("deleted", transaction, userId);
  emitReportInvalidation(transaction.portId, transaction.accountType);
}

/**
 * Call after creating a new debt.
 */
export async function onDebtCreated(
  debt: { id: number; portId?: string; accountId?: number },
  userId?: number
): Promise<void> {
  await financialReportsCache.clear();
  emitDebtEvent("created", debt, userId);
}

/**
 * Call after updating an existing debt.
 */
export async function onDebtUpdated(
  debt: { id: number; portId?: string; accountId?: number },
  userId?: number
): Promise<void> {
  await financialReportsCache.clear();
  emitDebtEvent("updated", debt, userId);
}

/**
 * Call after deleting a debt.
 */
export async function onDebtDeleted(
  debt: { id: number; portId?: string; accountId?: number },
  userId?: number
): Promise<void> {
  await financialReportsCache.clear();
  emitDebtEvent("deleted", debt, userId);
}

/**
 * Call after any expense mutation.
 */
export async function onExpenseMutated(
  expense: { id: number; portId?: string; accountId?: number },
  action: "created" | "updated" | "deleted",
  userId?: number
): Promise<void> {
  await financialReportsCache.clear();
  emitReportInvalidation(expense.portId);
}

/**
 * Call after account data changes (name, type, etc.)
 */
export async function onAccountUpdated(
  account: { id: number; portId?: string },
  userId?: number
): Promise<void> {
  // Clear lookup cache as well since account names are cached
  const { lookupDataCache } = await import("./redisCache");
  await lookupDataCache.clear();
  await financialReportsCache.clear();
}

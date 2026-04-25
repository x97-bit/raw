import { Router, Response } from "express";
import { eq } from "drizzle-orm";
import { transactions } from "../../../drizzle/schema";
import {
  AuthRequest,
  authMiddleware,
  requireAppUser,
  requirePermission,
} from "../../_core/appAuth";
import { financialWriteRateLimit } from "../../_core/financialRateLimits";
import { respondRouteError } from "../../_core/routeResponses";
import { assertPositiveIntegerParam } from "../../_core/requestValidation";
import { getDb } from "../../db/db";
import { rebuildPaymentMatchesForAccounts } from "../../utils/paymentMatchingAutoMatch";
import { safeWriteAuditLog } from "../../utils/safeAuditLog";
import {
  buildTransactionCreateInput,
  buildTransactionUpdateInput,
} from "./builders";
import {
  TRANSACTION_CREATE_SUMMARY_PREFIX,
  TRANSACTION_CREATED_MESSAGE,
  TRANSACTION_DELETE_SUMMARY_PREFIX,
  TRANSACTION_DELETED_MESSAGE,
  TRANSACTION_ID_LABEL,
  TRANSACTION_NOT_FOUND_MESSAGE,
  TRANSACTION_UPDATE_SUMMARY_PREFIX,
  TRANSACTION_UPDATED_MESSAGE,
} from "./shared";

export function registerTransactionMutationRoutes(router: Router) {
  router.post(
    "/transactions",
    authMiddleware,
    financialWriteRateLimit,
    async (req: AuthRequest, res: Response) => {
      try {
        const appUser = requireAppUser(req);
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const { data, refNo } = await buildTransactionCreateInput(
          db,
          req.body,
          appUser.id
        );

        const isInvoice =
          data.direction?.toUpperCase() === "IN" ||
          data.direction?.toUpperCase() === "DR";
        const requiredPerm = isInvoice ? "add_invoice" : "add_payment";
        if (!requirePermission(req, res, requiredPerm)) return;

        const result = await db.insert(transactions).values(data);
        const transactionId = Number(result[0].insertId);
        await rebuildPaymentMatchesForAccounts(db, [data.accountId]);

        await safeWriteAuditLog(db, {
          entityType: "transaction",
          entityId: transactionId,
          action: "create",
          summary: `${TRANSACTION_CREATE_SUMMARY_PREFIX} ${refNo}`,
          after: { id: transactionId, ...data },
          appUser,
          metadata: { refNo, portId: data.portId, accountId: data.accountId },
        });

        return res.json({
          id: transactionId,
          refNo,
          message: TRANSACTION_CREATED_MESSAGE,
        });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.put(
    "/transactions/:id",
    authMiddleware,
    financialWriteRateLimit,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!requirePermission(req, res, "edit_transaction")) return;

        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const transactionId = assertPositiveIntegerParam(
          req.params.id,
          TRANSACTION_ID_LABEL
        );
        const [existingTransaction] = await db
          .select()
          .from(transactions)
          .where(eq(transactions.id, transactionId))
          .limit(1);
        if (!existingTransaction)
          return res.status(404).json({ error: TRANSACTION_NOT_FOUND_MESSAGE });

        const validatedUpdates = await buildTransactionUpdateInput(
          db,
          req.body
        );
        await db
          .update(transactions)
          .set(validatedUpdates)
          .where(eq(transactions.id, transactionId));
        await rebuildPaymentMatchesForAccounts(db, [
          existingTransaction.accountId,
          validatedUpdates.accountId || existingTransaction.accountId,
        ]);

        await safeWriteAuditLog(db, {
          entityType: "transaction",
          entityId: transactionId,
          action: "update",
          summary: `${TRANSACTION_UPDATE_SUMMARY_PREFIX} ${existingTransaction.refNo || transactionId}`,
          before: existingTransaction,
          after: { ...existingTransaction, ...validatedUpdates },
          appUser: req.appUser,
          metadata: {
            refNo: existingTransaction.refNo || null,
            changedKeys: Object.keys(validatedUpdates),
          },
        });

        return res.json({ message: TRANSACTION_UPDATED_MESSAGE });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );

  router.delete(
    "/transactions/:id",
    authMiddleware,
    financialWriteRateLimit,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!requirePermission(req, res, "delete_transaction")) return;

        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const transactionId = assertPositiveIntegerParam(
          req.params.id,
          TRANSACTION_ID_LABEL
        );
        const [existingTransaction] = await db
          .select()
          .from(transactions)
          .where(eq(transactions.id, transactionId))
          .limit(1);
        if (!existingTransaction)
          return res.status(404).json({ error: TRANSACTION_NOT_FOUND_MESSAGE });

        await db.delete(transactions).where(eq(transactions.id, transactionId));
        await rebuildPaymentMatchesForAccounts(db, [
          existingTransaction.accountId,
        ]);
        await safeWriteAuditLog(db, {
          entityType: "transaction",
          entityId: transactionId,
          action: "delete",
          summary: `${TRANSACTION_DELETE_SUMMARY_PREFIX} ${existingTransaction.refNo || transactionId}`,
          before: existingTransaction,
          appUser: req.appUser,
          metadata: { refNo: existingTransaction.refNo || null },
        });

        return res.json({ message: TRANSACTION_DELETED_MESSAGE });
      } catch (error) {
        return respondRouteError(res, error);
      }
    }
  );
}

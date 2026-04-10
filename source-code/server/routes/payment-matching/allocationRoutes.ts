import { Router, Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import { paymentMatching, transactions } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { respondRouteError } from "../../_core/routeResponses";
import { assertPositiveIntegerParam, validateInput } from "../../_core/requestValidation";
import { getDb } from "../../db";
import { getAbsoluteAmount, isInvoiceDirection, isPaymentDirection } from "../../utils/direction";
import { paymentMatchingCreateSchema } from "../../utils/financialValidation";
import {
  ACCOUNT_MISMATCH_MESSAGE,
  ALLOCATION_ID_LABEL,
  DELETE_ALLOCATION_MESSAGE,
  DUPLICATE_MATCH_MESSAGE,
  FIRST_RECORD_MUST_BE_INVOICE_MESSAGE,
  INVOICE_OR_PAYMENT_NOT_FOUND_MESSAGE,
  IQD_OVERMATCH_MESSAGE,
  MATCH_CREATED_MESSAGE,
  MATCH_DELETED_MESSAGE,
  MATCH_ID_LABEL,
  MATCHING_VALIDATION_MESSAGE,
  matchingRateLimit,
  SECOND_RECORD_MUST_BE_PAYMENT_MESSAGE,
  USD_OVERMATCH_MESSAGE,
} from "./mutationShared";

export function registerPaymentMatchingAllocationRoutes(router: Router) {
  router.delete("/payment-matching/allocate/:id", authMiddleware, matchingRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const allocationId = assertPositiveIntegerParam(req.params.id, ALLOCATION_ID_LABEL);
      await db.delete(paymentMatching).where(eq(paymentMatching.id, allocationId));
      return res.json({ message: DELETE_ALLOCATION_MESSAGE });
    } catch (error: any) {
      return respondRouteError(res, error);
    }
  });

  router.post("/payment-matching", authMiddleware, matchingRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const payload = validateInput(
        paymentMatchingCreateSchema,
        {
          invoiceId: Number(req.body?.invoiceId),
          paymentId: Number(req.body?.paymentId),
          amountUSD: String(req.body?.amountUSD ?? "0"),
          amountIQD: String(req.body?.amountIQD ?? "0"),
          notes: req.body?.notes ?? null,
        },
        MATCHING_VALIDATION_MESSAGE,
      );

      const [invoiceRows, paymentRows] = await Promise.all([
        db.select().from(transactions).where(eq(transactions.id, payload.invoiceId)).limit(1),
        db.select().from(transactions).where(eq(transactions.id, payload.paymentId)).limit(1),
      ]);

      const invoice = invoiceRows[0];
      const payment = paymentRows[0];
      if (!invoice || !payment) {
        return res.status(404).json({ error: INVOICE_OR_PAYMENT_NOT_FOUND_MESSAGE });
      }
      if (!isInvoiceDirection(invoice.direction)) {
        return res.status(400).json({ error: FIRST_RECORD_MUST_BE_INVOICE_MESSAGE });
      }
      if (!isPaymentDirection(payment.direction)) {
        return res.status(400).json({ error: SECOND_RECORD_MUST_BE_PAYMENT_MESSAGE });
      }
      if (invoice.accountId !== payment.accountId) {
        return res.status(400).json({ error: ACCOUNT_MISMATCH_MESSAGE });
      }

      const existingMatchRows = await db
        .select()
        .from(paymentMatching)
        .where(and(eq(paymentMatching.invoiceId, payload.invoiceId), eq(paymentMatching.paymentId, payload.paymentId)))
        .limit(1);
      if (existingMatchRows[0]) {
        return res.status(409).json({ error: DUPLICATE_MATCH_MESSAGE });
      }

      const [invoiceUsageRows, paymentUsageRows] = await Promise.all([
        db
          .select({
            amountUsd: sql<number>`COALESCE(SUM(CAST(${paymentMatching.amountUSD} AS DECIMAL(15,2))), 0)`,
            amountIqd: sql<number>`COALESCE(SUM(CAST(${paymentMatching.amountIQD} AS DECIMAL(15,0))), 0)`,
          })
          .from(paymentMatching)
          .where(eq(paymentMatching.invoiceId, payload.invoiceId)),
        db
          .select({
            amountUsd: sql<number>`COALESCE(SUM(CAST(${paymentMatching.amountUSD} AS DECIMAL(15,2))), 0)`,
            amountIqd: sql<number>`COALESCE(SUM(CAST(${paymentMatching.amountIQD} AS DECIMAL(15,0))), 0)`,
          })
          .from(paymentMatching)
          .where(eq(paymentMatching.paymentId, payload.paymentId)),
      ]);

      const requestedUsd = getAbsoluteAmount(payload.amountUSD);
      const requestedIqd = getAbsoluteAmount(payload.amountIQD);
      const invoiceRemainingUsd = Math.max(0, getAbsoluteAmount(invoice.amountUsd) - Number(invoiceUsageRows[0]?.amountUsd || 0));
      const invoiceRemainingIqd = Math.max(0, getAbsoluteAmount(invoice.amountIqd) - Number(invoiceUsageRows[0]?.amountIqd || 0));
      const paymentRemainingUsd = Math.max(0, getAbsoluteAmount(payment.amountUsd) - Number(paymentUsageRows[0]?.amountUsd || 0));
      const paymentRemainingIqd = Math.max(0, getAbsoluteAmount(payment.amountIqd) - Number(paymentUsageRows[0]?.amountIqd || 0));

      if (requestedUsd > invoiceRemainingUsd || requestedUsd > paymentRemainingUsd) {
        return res.status(400).json({ error: USD_OVERMATCH_MESSAGE });
      }
      if (requestedIqd > invoiceRemainingIqd || requestedIqd > paymentRemainingIqd) {
        return res.status(400).json({ error: IQD_OVERMATCH_MESSAGE });
      }

      const result = await db.insert(paymentMatching).values(payload);
      return res.json({ id: Number(result[0].insertId), message: MATCH_CREATED_MESSAGE });
    } catch (error: any) {
      return respondRouteError(res, error);
    }
  });

  router.delete("/payment-matching/:id", authMiddleware, matchingRateLimit, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const allocationId = assertPositiveIntegerParam(req.params.id, MATCH_ID_LABEL);
      await db.delete(paymentMatching).where(eq(paymentMatching.id, allocationId));
      return res.json({ message: MATCH_DELETED_MESSAGE });
    } catch (error: any) {
      return respondRouteError(res, error);
    }
  });
}

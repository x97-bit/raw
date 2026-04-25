import { Router, Response } from "express";
import { sql } from "drizzle-orm";
import { paymentMatching } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db/db";
import {
  AutoMatchInvoiceRow,
  AutoMatchPaymentRow,
  buildAutoMatchAllocations,
} from "../../utils/paymentMatchingAutoMatch";
import {
  AUTO_MATCH_NOTE,
  buildAutoMatchSuccessMessage,
  heavyJobRateLimit,
} from "./mutationShared";

export { buildAutoMatchAllocations } from "../../utils/paymentMatchingAutoMatch";

export function registerPaymentMatchingAutoMatchRoutes(router: Router) {
  router.post(
    "/payment-matching/auto-match-all",
    authMiddleware,
    heavyJobRateLimit,
    async (_req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const payments: any[] = await db.execute(sql`
        SELECT
          t.id AS payment_id,
          t.account_id,
          COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)), 0) AS total_usd,
          COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)), 0) AS total_iqd,
          COALESCE(pm_agg.used_usd, 0) AS used_usd,
          COALESCE(pm_agg.used_iqd, 0) AS used_iqd
        FROM transactions t
        LEFT JOIN (
          SELECT paymentId,
            SUM(CAST(amountUSD AS DECIMAL(15,2))) AS used_usd,
            SUM(CAST(amountIQD AS DECIMAL(15,0))) AS used_iqd
          FROM payment_matching
          GROUP BY paymentId
        ) pm_agg ON pm_agg.paymentId = t.id
        WHERE t.direction IN ('OUT', 'out', 'CR', 'cr')
        HAVING (total_usd - used_usd > 0) OR (total_iqd - used_iqd > 0)
        ORDER BY t.trans_date ASC
      `);

        const accountIds = Array.from(
          new Set(
            payments
              .map(payment => Number(payment.account_id))
              .filter(accountId => Number.isInteger(accountId) && accountId > 0)
          )
        );

        const invoices: AutoMatchInvoiceRow[] =
          accountIds.length > 0
            ? ((await db.execute(sql`
          SELECT
            t.id AS invoice_id,
            t.account_id,
            COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)), 0) AS amount_usd,
            COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)), 0) AS amount_iqd,
            COALESCE(pm_agg.paid_usd, 0) AS paid_usd,
            COALESCE(pm_agg.paid_iqd, 0) AS paid_iqd
          FROM transactions t
          LEFT JOIN (
            SELECT invoiceId,
              SUM(CAST(amountUSD AS DECIMAL(15,2))) AS paid_usd,
              SUM(CAST(amountIQD AS DECIMAL(15,0))) AS paid_iqd
            FROM payment_matching
            GROUP BY invoiceId
          ) pm_agg ON pm_agg.invoiceId = t.id
          WHERE t.direction IN ('IN', 'in', 'DR', 'dr')
            AND t.account_id IN (${sql.join(
              accountIds.map(accountId => sql`${accountId}`),
              sql`, `
            )})
          HAVING (amount_usd - COALESCE(paid_usd, 0) > 0) OR (amount_iqd - COALESCE(paid_iqd, 0) > 0)
          ORDER BY t.account_id ASC, t.trans_date ASC, t.id ASC
        `)) as unknown as AutoMatchInvoiceRow[])
            : [];

        const allocations = buildAutoMatchAllocations(
          payments as AutoMatchPaymentRow[],
          invoices
        ).map(allocation => ({ ...allocation, notes: AUTO_MATCH_NOTE }));

        const chunkSize = 250;
        for (let start = 0; start < allocations.length; start += chunkSize) {
          const chunk = allocations.slice(start, start + chunkSize);
          if (chunk.length > 0) {
            await db.insert(paymentMatching).values(chunk);
          }
        }

        return res.json({
          message: buildAutoMatchSuccessMessage(allocations.length),
          matched: allocations.length,
        });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }
  );
}

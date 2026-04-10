import { Router, Response } from "express";
import { sql } from "drizzle-orm";
import { paymentMatching } from "../../../drizzle/schema";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { AUTO_MATCH_NOTE, buildAutoMatchSuccessMessage, heavyJobRateLimit } from "./mutationShared";

export function registerPaymentMatchingAutoMatchRoutes(router: Router) {
  router.post("/payment-matching/auto-match-all", authMiddleware, heavyJobRateLimit, async (_req: AuthRequest, res: Response) => {
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

      let matchCount = 0;
      for (const payment of payments) {
        let availableUsd = (Number(payment.total_usd) || 0) - (Number(payment.used_usd) || 0);
        let availableIqd = (Number(payment.total_iqd) || 0) - (Number(payment.used_iqd) || 0);
        if (availableUsd <= 0 && availableIqd <= 0) continue;

        const invoices: any[] = await db.execute(sql`
          SELECT
            t.id AS invoice_id,
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
          WHERE t.direction IN ('IN', 'in', 'DR', 'dr') AND t.account_id = ${payment.account_id}
          HAVING (amount_usd - COALESCE(paid_usd, 0) > 0) OR (amount_iqd - COALESCE(paid_iqd, 0) > 0)
          ORDER BY t.trans_date ASC
        `);

        for (const invoice of invoices) {
          if (availableUsd <= 0 && availableIqd <= 0) break;

          const needUsd = Math.max(0, (Number(invoice.amount_usd) || 0) - (Number(invoice.paid_usd) || 0));
          const needIqd = Math.max(0, (Number(invoice.amount_iqd) || 0) - (Number(invoice.paid_iqd) || 0));
          const allocatedUsd = Math.min(availableUsd, needUsd);
          const allocatedIqd = Math.min(availableIqd, needIqd);

          if (allocatedUsd > 0 || allocatedIqd > 0) {
            await db.insert(paymentMatching).values({
              invoiceId: invoice.invoice_id,
              paymentId: payment.payment_id,
              amountUSD: String(allocatedUsd),
              amountIQD: String(allocatedIqd),
              notes: AUTO_MATCH_NOTE,
            });
            availableUsd -= allocatedUsd;
            availableIqd -= allocatedIqd;
            matchCount += 1;
          }
        }
      }

      return res.json({
        message: buildAutoMatchSuccessMessage(matchCount),
        matched: matchCount,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

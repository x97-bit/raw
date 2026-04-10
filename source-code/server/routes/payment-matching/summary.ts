import { Router, Response } from "express";
import { sql } from "drizzle-orm";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { mapShipmentPaymentStatus } from "./shared";

export function registerPaymentMatchingSummaryRoutes(router: Router) {
  router.get("/payment-matching/summary/:accountId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const accountId = parseInt(req.params.accountId, 10);
      const rows: any[] = await db.execute(sql`
        SELECT
          t.id,
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
        WHERE t.direction IN ('IN', 'in', 'DR', 'dr') AND t.account_id = ${accountId}
      `);

      const paid = { count: 0, remaining_usd: 0, remaining_iqd: 0 };
      const partial = { count: 0, remaining_usd: 0, remaining_iqd: 0 };
      const unpaid = { count: 0, remaining_usd: 0, remaining_iqd: 0 };

      for (const shipment of rows.map(mapShipmentPaymentStatus)) {
        if (shipment.payment_status === "paid") {
          paid.count += 1;
        } else if (shipment.payment_status === "partial") {
          partial.count += 1;
          partial.remaining_usd += shipment.remaining_usd;
          partial.remaining_iqd += shipment.remaining_iqd;
        } else {
          unpaid.count += 1;
          unpaid.remaining_usd += shipment.remaining_usd;
          unpaid.remaining_iqd += shipment.remaining_iqd;
        }
      }

      return res.json({
        shipments: [
          { payment_status: "paid", ...paid },
          { payment_status: "partial", ...partial },
          { payment_status: "unpaid", ...unpaid },
        ],
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

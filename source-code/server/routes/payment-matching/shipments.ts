import { Router, Response } from "express";
import { sql } from "drizzle-orm";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db";
import { ACCOUNT_PARAMETER_REQUIRED_MESSAGE, mapShipmentPaymentStatus, SHIPMENT_NOT_FOUND_MESSAGE } from "./shared";

export function registerPaymentMatchingShipmentRoutes(router: Router) {
  router.get("/payment-matching/shipments", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const accountId = parseInt(req.query.account as string, 10);
      const limit = parseInt(req.query.limit as string, 10) || 200;
      if (!accountId) return res.status(400).json({ error: ACCOUNT_PARAMETER_REQUIRED_MESSAGE });

      const rows: any[] = await db.execute(sql`
        SELECT
          t.id AS shipment_id,
          t.ref_no,
          t.trans_date,
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
        ORDER BY t.trans_date DESC
        LIMIT ${limit}
      `);

      const enriched = rows.map(mapShipmentPaymentStatus);
      return res.json({ rows: enriched, total: enriched.length });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get("/payment-matching/shipments/:shipmentId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const shipmentId = parseInt(req.params.shipmentId, 10);
      const shipmentRows: any[] = await db.execute(sql`
        SELECT
          t.id AS shipment_id,
          t.ref_no,
          t.trans_date,
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
        WHERE t.id = ${shipmentId}
      `);

      if (!shipmentRows.length) return res.status(404).json({ error: SHIPMENT_NOT_FOUND_MESSAGE });

      const shipment = mapShipmentPaymentStatus(shipmentRows[0]);
      const allocations: any[] = await db.execute(sql`
        SELECT
          pm.id,
          pm.paymentId,
          CAST(pm.amountUSD AS DECIMAL(15,2)) AS allocated_usd,
          CAST(pm.amountIQD AS DECIMAL(15,0)) AS allocated_iqd,
          pm.notes,
          pm.createdAt,
          t.ref_no AS payment_ref,
          t.trans_date AS payment_date
        FROM payment_matching pm
        LEFT JOIN transactions t ON t.id = pm.paymentId
        WHERE pm.invoiceId = ${shipmentId}
        ORDER BY pm.createdAt DESC
      `);

      return res.json({ shipment, allocations });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });
}

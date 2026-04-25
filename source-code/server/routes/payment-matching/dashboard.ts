import { Router, Response } from "express";
import { sql } from "drizzle-orm";
import { AuthRequest, authMiddleware } from "../../_core/appAuth";
import { getDb } from "../../db/db";
import { mapShipmentPaymentStatus, UNKNOWN_ACCOUNT_NAME } from "./shared";

export function registerPaymentMatchingDashboardRoutes(router: Router) {
  router.get(
    "/payment-matching/dashboard",
    authMiddleware,
    async (_req: AuthRequest, res: Response) => {
      try {
        const db = await getDb();
        if (!db) return res.status(500).json({ error: "Database unavailable" });

        const shipmentRows: any[] = await db.execute(sql`
        SELECT
          t.id AS shipment_id,
          t.ref_no,
          t.trans_date,
          t.account_id,
          a.name AS AccountName,
          COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)), 0) AS amount_usd,
          COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)), 0) AS amount_iqd,
          COALESCE(pm_agg.paid_usd, 0) AS paid_usd,
          COALESCE(pm_agg.paid_iqd, 0) AS paid_iqd
        FROM transactions t
        LEFT JOIN accounts a ON a.id = t.account_id
        LEFT JOIN (
          SELECT invoiceId,
            SUM(CAST(amountUSD AS DECIMAL(15,2))) AS paid_usd,
            SUM(CAST(amountIQD AS DECIMAL(15,0))) AS paid_iqd
          FROM payment_matching
          GROUP BY invoiceId
        ) pm_agg ON pm_agg.invoiceId = t.id
        WHERE t.direction IN ('IN', 'in', 'DR', 'dr')
      `);

        let paidCount = 0;
        let paidTotalUsd = 0;
        let paidTotalIqd = 0;
        let partialCount = 0;
        let partialRemUsd = 0;
        let partialRemIqd = 0;
        let unpaidCount = 0;
        let unpaidRemUsd = 0;
        let unpaidRemIqd = 0;
        const accountMap: Record<
          number,
          {
            account_id: number;
            AccountName: string;
            unpaid_count: number;
            remaining_usd: number;
            remaining_iqd: number;
          }
        > = {};

        for (const shipment of shipmentRows.map(mapShipmentPaymentStatus)) {
          if (shipment.payment_status === "paid") {
            paidCount += 1;
            paidTotalUsd += Number(shipment.amount_usd) || 0;
            paidTotalIqd += Number(shipment.amount_iqd) || 0;
          } else if (shipment.payment_status === "partial") {
            partialCount += 1;
            partialRemUsd += shipment.remaining_usd;
            partialRemIqd += shipment.remaining_iqd;
          } else {
            unpaidCount += 1;
            unpaidRemUsd += shipment.remaining_usd;
            unpaidRemIqd += shipment.remaining_iqd;
          }

          if (shipment.remaining_usd > 0 || shipment.remaining_iqd > 0) {
            const accountId = shipment.account_id;
            if (!accountMap[accountId]) {
              accountMap[accountId] = {
                account_id: accountId,
                AccountName: shipment.AccountName || UNKNOWN_ACCOUNT_NAME,
                unpaid_count: 0,
                remaining_usd: 0,
                remaining_iqd: 0,
              };
            }
            accountMap[accountId].unpaid_count += 1;
            accountMap[accountId].remaining_usd += shipment.remaining_usd;
            accountMap[accountId].remaining_iqd += shipment.remaining_iqd;
          }
        }

        const paymentRows: any[] = await db.execute(sql`
        SELECT
          COALESCE(SUM(CAST(t.amount_usd AS DECIMAL(15,2))), 0) AS total_payment_usd,
          COALESCE(SUM(CAST(t.amount_iqd AS DECIMAL(15,0))), 0) AS total_payment_iqd
        FROM transactions t
        WHERE t.direction IN ('OUT', 'out', 'CR', 'cr')
      `);
        const allocatedRows: any[] = await db.execute(sql`
        SELECT
          COALESCE(SUM(CAST(amountUSD AS DECIMAL(15,2))), 0) AS allocated_usd,
          COALESCE(SUM(CAST(amountIQD AS DECIMAL(15,0))), 0) AS allocated_iqd
        FROM payment_matching
      `);

        const totalPayUsd = Number(paymentRows[0]?.total_payment_usd) || 0;
        const totalPayIqd = Number(paymentRows[0]?.total_payment_iqd) || 0;
        const allocatedUsd = Number(allocatedRows[0]?.allocated_usd) || 0;
        const allocatedIqd = Number(allocatedRows[0]?.allocated_iqd) || 0;
        const topRemaining = Object.values(accountMap)
          .sort(
            (left, right) =>
              right.remaining_usd - left.remaining_usd ||
              right.remaining_iqd - left.remaining_iqd
          )
          .slice(0, 20);

        return res.json({
          shipmentStats: [
            {
              payment_status: "paid",
              count: paidCount,
              total_usd: paidTotalUsd,
              total_iqd: paidTotalIqd,
            },
            {
              payment_status: "partial",
              count: partialCount,
              remaining_usd: partialRemUsd,
              remaining_iqd: partialRemIqd,
            },
            {
              payment_status: "unpaid",
              count: unpaidCount,
              remaining_usd: unpaidRemUsd,
              remaining_iqd: unpaidRemIqd,
            },
          ],
          paymentStats: {
            total_usd: totalPayUsd,
            total_iqd: totalPayIqd,
            allocated_usd: allocatedUsd,
            allocated_iqd: allocatedIqd,
            unallocated_usd: Math.max(0, totalPayUsd - allocatedUsd),
            unallocated_iqd: Math.max(0, totalPayIqd - allocatedIqd),
          },
          topRemaining,
        });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }
  );
}

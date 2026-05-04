import { z } from "zod";
import { sql } from "drizzle-orm";
import { protectedProcedure, router } from "../../_core/trpc";
import { getDb } from "../../db/db";
import { TRPCError } from "@trpc/server";
import { paymentMatching } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";

import {
  mapShipmentPaymentStatus,
  UNKNOWN_ACCOUNT_NAME,
} from "./shared";
import {
  AutoMatchInvoiceRow,
  AutoMatchPaymentRow,
  buildAutoMatchAllocations,
} from "../../utils/paymentMatchingAutoMatch";
import {
  buildAutoMatchSuccessMessage,
  AUTO_MATCH_NOTE,
} from "./mutationShared";

export const paymentMatchingRouter = router({
  getDashboard: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    }

    const [shipmentRows]: [any[], unknown] = await db.execute(sql`
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
      `) as any;

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

    const [paymentRows]: [any[], unknown] = await db.execute(sql`
        SELECT
          COALESCE(SUM(CAST(t.amount_usd AS DECIMAL(15,2))), 0) AS total_payment_usd,
          COALESCE(SUM(CAST(t.amount_iqd AS DECIMAL(15,0))), 0) AS total_payment_iqd
        FROM transactions t
        WHERE t.direction IN ('OUT', 'out', 'CR', 'cr')
      `) as any;
    const [allocatedRows]: [any[], unknown] = await db.execute(sql`
        SELECT
          COALESCE(SUM(CAST(amountUSD AS DECIMAL(15,2))), 0) AS allocated_usd,
          COALESCE(SUM(CAST(amountIQD AS DECIMAL(15,0))), 0) AS allocated_iqd
        FROM payment_matching
      `) as any;

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

    return {
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
    };
  }),

  getSummary: protectedProcedure
    .input(z.object({ accountId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      const [rows]: [any[], unknown] = await db.execute(sql`
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
        WHERE t.direction IN ('IN', 'in', 'DR', 'dr') AND t.account_id = ${input.accountId}
      `) as any;

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

      return {
        shipments: [
          { payment_status: "paid", ...paid },
          { payment_status: "partial", ...partial },
          { payment_status: "unpaid", ...unpaid },
        ],
      };
    }),

  getShipments: protectedProcedure
    .input(
      z.object({
        account: z.number().int().optional(),
        limit: z.number().int().default(200),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      const limit = Math.min(input.limit, 1000);
      let rows: any[];

      if (input.account) {
        [rows] = await db.execute(sql`
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
          WHERE t.direction IN ('IN', 'in', 'DR', 'dr') AND t.account_id = ${input.account}
          ORDER BY t.trans_date DESC
          LIMIT ${limit}
        `) as any;
      } else {
        [rows] = await db.execute(sql`
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
          ORDER BY t.trans_date DESC
          LIMIT ${limit}
        `) as any;
      }

      const results = rows.map(mapShipmentPaymentStatus);
      return {
        rows: results,
        total: results.length, // approximation
      };
    }),

  getShipmentDetail: protectedProcedure
    .input(z.object({ shipmentId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      const shipmentId = input.shipmentId;
      const [shipmentRows]: [any[], unknown] = await db.execute(sql`
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
        WHERE t.id = ${shipmentId} AND t.direction IN ('IN', 'in', 'DR', 'dr')
      `) as any;

      if (!shipmentRows || shipmentRows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shipment not found",
        });
      }

      const shipment = mapShipmentPaymentStatus(shipmentRows[0]);

      const [allocations]: [any[], unknown] = await db.execute(sql`
        SELECT
          pm.id AS allocation_id,
          pm.paymentId AS payment_id,
          pm.amountUSD AS allocated_usd,
          pm.amountIQD AS allocated_iqd,
          pm.notes,
          pm.createdAt AS allocation_date,
          t.ref_no AS payment_ref,
          t.trans_date AS payment_date,
          COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)), 0) AS payment_total_usd,
          COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)), 0) AS payment_total_iqd
        FROM payment_matching pm
        INNER JOIN transactions t ON t.id = pm.paymentId
        WHERE pm.invoiceId = ${shipmentId}
        ORDER BY pm.createdAt DESC
      `) as any;

      return {
        shipment,
        allocations,
      };
    }),

  autoMatchAll: protectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    }

    const [payments]: [any[], unknown] = await db.execute(sql`
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
      `) as any;

    const accountIds = Array.from(
      new Set(
        payments
          .map((payment: any) => Number(payment.account_id))
          .filter((accountId: number) => Number.isInteger(accountId) && accountId > 0)
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
              accountIds.map((accountId: number) => sql`${accountId}`),
              sql`, `
            )})
          HAVING (amount_usd - COALESCE(paid_usd, 0) > 0) OR (amount_iqd - COALESCE(paid_iqd, 0) > 0)
          ORDER BY t.account_id ASC, t.trans_date ASC, t.id ASC
        `)) as unknown as [AutoMatchInvoiceRow[], unknown])[0]
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

    return {
      message: buildAutoMatchSuccessMessage(allocations.length),
      matched: allocations.length,
    };
  }),

  allocate: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number().int(),
        paymentId: z.number().int(),
        amountUSD: z.number().min(0).optional(),
        amountIQD: z.number().min(0).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      await db.insert(paymentMatching).values({
        invoiceId: input.invoiceId,
        paymentId: input.paymentId,
        amountUSD: input.amountUSD?.toString() || "0",
        amountIQD: input.amountIQD?.toString() || "0",
        notes: input.notes,
      });

      return { success: true };
    }),

  getUnmatchedPayments: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    }

    const [rows]: [any[], unknown] = await db.execute(sql`
      SELECT
        t.id AS payment_id,
        t.ref_no,
        t.trans_date,
        t.account_id,
        a.name AS AccountName,
        COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)), 0) AS total_usd,
        COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)), 0) AS total_iqd,
        COALESCE(pm_agg.used_usd, 0) AS used_usd,
        COALESCE(pm_agg.used_iqd, 0) AS used_iqd
      FROM transactions t
      LEFT JOIN accounts a ON a.id = t.account_id
      LEFT JOIN (
        SELECT paymentId,
          SUM(CAST(amountUSD AS DECIMAL(15,2))) AS used_usd,
          SUM(CAST(amountIQD AS DECIMAL(15,0))) AS used_iqd
        FROM payment_matching
        GROUP BY paymentId
      ) pm_agg ON pm_agg.paymentId = t.id
      WHERE t.direction IN ('OUT', 'out', 'CR', 'cr')
      HAVING (total_usd - COALESCE(used_usd, 0) > 0) OR (total_iqd - COALESCE(used_iqd, 0) > 0)
      ORDER BY (total_usd - COALESCE(used_usd, 0)) DESC, t.trans_date DESC
      LIMIT 50
    `) as any;

    const payments = rows.map((row: any) => {
      const totalUsd = Number(row.total_usd) || 0;
      const totalIqd = Number(row.total_iqd) || 0;
      const usedUsd = Number(row.used_usd) || 0;
      const usedIqd = Number(row.used_iqd) || 0;
      return {
        payment_id: row.payment_id,
        ref_no: row.ref_no,
        trans_date: row.trans_date,
        account_id: row.account_id,
        AccountName: row.AccountName || "غير معروف",
        total_usd: totalUsd,
        total_iqd: totalIqd,
        used_usd: usedUsd,
        used_iqd: usedIqd,
        remaining_usd: Math.max(0, totalUsd - usedUsd),
        remaining_iqd: Math.max(0, totalIqd - usedIqd),
      };
    });

    const totalRemainingUsd = payments.reduce((sum: number, p: any) => sum + p.remaining_usd, 0);
    const totalRemainingIqd = payments.reduce((sum: number, p: any) => sum + p.remaining_iqd, 0);

    return {
      payments,
      total: payments.length,
      totalRemainingUsd,
      totalRemainingIqd,
    };
  }),

  autoMatchPreview: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    }

    const [payments]: [any[], unknown] = await db.execute(sql`
      SELECT
        t.id AS payment_id,
        t.account_id,
        a.name AS AccountName,
        COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)), 0) AS total_usd,
        COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)), 0) AS total_iqd,
        COALESCE(pm_agg.used_usd, 0) AS used_usd,
        COALESCE(pm_agg.used_iqd, 0) AS used_iqd
      FROM transactions t
      LEFT JOIN accounts a ON a.id = t.account_id
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
    `) as any;

    const accountIds = Array.from(
      new Set(
        payments
          .map((payment: any) => Number(payment.account_id))
          .filter((accountId: number) => Number.isInteger(accountId) && accountId > 0)
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
          LEFT JOIN (SELECT invoiceId,
              SUM(CAST(amountUSD AS DECIMAL(15,2))) AS paid_usd,
              SUM(CAST(amountIQD AS DECIMAL(15,0))) AS paid_iqd
            FROM payment_matching GROUP BY invoiceId
          ) pm_agg ON pm_agg.invoiceId = t.id
          WHERE t.direction IN ('IN', 'in', 'DR', 'dr')
            AND t.account_id IN (${sql.join(
              accountIds.map((accountId: number) => sql`${accountId}`),
              sql`, `
            )})
          HAVING (amount_usd - COALESCE(paid_usd, 0) > 0) OR (amount_iqd - COALESCE(paid_iqd, 0) > 0)
          ORDER BY t.account_id ASC, t.trans_date ASC, t.id ASC
        `)) as unknown as [AutoMatchInvoiceRow[], unknown])[0]
        : [];

    const allocations = buildAutoMatchAllocations(
      payments as AutoMatchPaymentRow[],
      invoices
    );

    // Group by account for summary
    const accountSummary: Record<number, { name: string; count: number; totalUsd: number; totalIqd: number }> = {};
    for (const alloc of allocations) {
      const payment = payments.find((p: any) => p.payment_id === alloc.paymentId);
      const accountId = payment ? Number(payment.account_id) : 0;
      const accountName = payment?.AccountName || "غير معروف";
      if (!accountSummary[accountId]) {
        accountSummary[accountId] = { name: accountName, count: 0, totalUsd: 0, totalIqd: 0 };
      }
      accountSummary[accountId].count += 1;
      accountSummary[accountId].totalUsd += Number(alloc.amountUSD) || 0;
      accountSummary[accountId].totalIqd += Number(alloc.amountIQD) || 0;
    }

    return {
      totalAllocations: allocations.length,
      accountsAffected: Object.keys(accountSummary).length,
      accounts: Object.entries(accountSummary).map(([id, data]) => ({
        account_id: Number(id),
        AccountName: data.name,
        matchCount: data.count,
        totalUsd: data.totalUsd,
        totalIqd: data.totalIqd,
      })),
    };
  }),

  deleteAllocation: protectedProcedure
    .input(z.object({ allocationId: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      await db
        .delete(paymentMatching)
        .where(eq(paymentMatching.id, input.allocationId));

      return { success: true };
    }),
});

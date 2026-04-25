import { inArray, sql } from "drizzle-orm";
import { paymentMatching } from "../../drizzle/schema";
import type { AppDb } from "../db/schema/dbTypes";

const AUTO_MATCH_NOTE = "ربط تلقائي";

type DecimalLike = string | number | null | undefined;

export type AutoMatchPaymentRow = {
  payment_id: number;
  account_id: number | null;
  total_usd: DecimalLike;
  total_iqd: DecimalLike;
  used_usd: DecimalLike;
  used_iqd: DecimalLike;
};

export type AutoMatchInvoiceRow = {
  invoice_id: number;
  account_id: number | null;
  amount_usd: DecimalLike;
  amount_iqd: DecimalLike;
  paid_usd: DecimalLike;
  paid_iqd: DecimalLike;
};

type PendingInvoice = {
  invoiceId: number;
  remainingUsd: number;
  remainingIqd: number;
};

export type AutoMatchAllocation = {
  invoiceId: number;
  paymentId: number;
  amountUSD: string;
  amountIQD: string;
  notes: string;
};

function parseAmount(value: DecimalLike) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundAmount(value: number, scale: number) {
  const factor = 10 ** scale;
  return Math.round(value * factor) / factor;
}

function formatAmount(value: number, scale: number) {
  const normalized = roundAmount(value, scale).toFixed(scale);
  return scale > 0 ? normalized.replace(/\.?0+$/, "") : normalized;
}

export function buildAutoMatchAllocations(
  payments: AutoMatchPaymentRow[],
  invoices: AutoMatchInvoiceRow[]
): AutoMatchAllocation[] {
  const allocations: AutoMatchAllocation[] = [];
  const invoiceStateByAccount = new Map<
    number,
    { invoices: PendingInvoice[]; startIndex: number }
  >();

  for (const invoice of invoices) {
    const accountId = Number(invoice.account_id);
    if (!Number.isInteger(accountId) || accountId <= 0) {
      continue;
    }

    const remainingUsd = Math.max(
      0,
      roundAmount(
        parseAmount(invoice.amount_usd) - parseAmount(invoice.paid_usd),
        2
      )
    );
    const remainingIqd = Math.max(
      0,
      roundAmount(
        parseAmount(invoice.amount_iqd) - parseAmount(invoice.paid_iqd),
        0
      )
    );

    if (remainingUsd <= 0 && remainingIqd <= 0) {
      continue;
    }

    const state = invoiceStateByAccount.get(accountId) || {
      invoices: [],
      startIndex: 0,
    };
    state.invoices.push({
      invoiceId: invoice.invoice_id,
      remainingUsd,
      remainingIqd,
    });
    invoiceStateByAccount.set(accountId, state);
  }

  for (const payment of payments) {
    const accountId = Number(payment.account_id);
    if (!Number.isInteger(accountId) || accountId <= 0) {
      continue;
    }

    const state = invoiceStateByAccount.get(accountId);
    if (!state) {
      continue;
    }

    let availableUsd = Math.max(
      0,
      roundAmount(
        parseAmount(payment.total_usd) - parseAmount(payment.used_usd),
        2
      )
    );
    let availableIqd = Math.max(
      0,
      roundAmount(
        parseAmount(payment.total_iqd) - parseAmount(payment.used_iqd),
        0
      )
    );

    if (availableUsd <= 0 && availableIqd <= 0) {
      continue;
    }

    for (
      let invoiceIndex = state.startIndex;
      invoiceIndex < state.invoices.length;
      invoiceIndex += 1
    ) {
      const invoice = state.invoices[invoiceIndex];

      if (invoice.remainingUsd <= 0 && invoice.remainingIqd <= 0) {
        continue;
      }
      if (availableUsd <= 0 && availableIqd <= 0) {
        break;
      }

      const allocatedUsd = Math.min(availableUsd, invoice.remainingUsd);
      const allocatedIqd = Math.min(availableIqd, invoice.remainingIqd);

      if (allocatedUsd > 0 || allocatedIqd > 0) {
        invoice.remainingUsd = Math.max(
          0,
          roundAmount(invoice.remainingUsd - allocatedUsd, 2)
        );
        invoice.remainingIqd = Math.max(
          0,
          roundAmount(invoice.remainingIqd - allocatedIqd, 0)
        );
        availableUsd = Math.max(0, roundAmount(availableUsd - allocatedUsd, 2));
        availableIqd = Math.max(0, roundAmount(availableIqd - allocatedIqd, 0));

        allocations.push({
          invoiceId: invoice.invoiceId,
          paymentId: payment.payment_id,
          amountUSD: formatAmount(allocatedUsd, 2),
          amountIQD: formatAmount(allocatedIqd, 0),
          notes: AUTO_MATCH_NOTE,
        });
      }

      while (state.startIndex < state.invoices.length) {
        const current = state.invoices[state.startIndex];
        if (current.remainingUsd > 0 || current.remainingIqd > 0) {
          break;
        }
        state.startIndex += 1;
      }
    }
  }

  return allocations;
}

export async function rebuildPaymentMatchesForAccounts(
  db: AppDb,
  accountIds: number[]
) {
  const normalizedAccountIds = Array.from(
    new Set(
      (accountIds || [])
        .map(accountId => Number(accountId))
        .filter(accountId => Number.isInteger(accountId) && accountId > 0)
    )
  );

  if (normalizedAccountIds.length === 0) {
    return { matched: 0 };
  }

  const accountIdTokens = sql.join(
    normalizedAccountIds.map(accountId => sql`${accountId}`),
    sql`, `
  );

  const payments = (await db.execute(sql`
    SELECT
      t.id AS payment_id,
      t.account_id,
      COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)), 0) AS total_usd,
      COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)), 0) AS total_iqd,
      0 AS used_usd,
      0 AS used_iqd
    FROM transactions t
    WHERE t.direction IN ('OUT', 'out', 'CR', 'cr')
      AND t.account_id IN (${accountIdTokens})
    ORDER BY t.account_id ASC, t.trans_date ASC, t.id ASC
  `)) as unknown as AutoMatchPaymentRow[];

  const invoices = (await db.execute(sql`
    SELECT
      t.id AS invoice_id,
      t.account_id,
      COALESCE(CAST(t.amount_usd AS DECIMAL(15,2)), 0) AS amount_usd,
      COALESCE(CAST(t.amount_iqd AS DECIMAL(15,0)), 0) AS amount_iqd,
      0 AS paid_usd,
      0 AS paid_iqd
    FROM transactions t
    WHERE t.direction IN ('IN', 'in', 'DR', 'dr')
      AND t.account_id IN (${accountIdTokens})
    ORDER BY t.account_id ASC, t.trans_date ASC, t.id ASC
  `)) as unknown as AutoMatchInvoiceRow[];

  const allocations = buildAutoMatchAllocations(payments, invoices);
  const relatedMatches = (await db.execute(sql`
    SELECT pm.id
    FROM payment_matching pm
    LEFT JOIN transactions invoice ON invoice.id = pm.invoiceId
    LEFT JOIN transactions payment ON payment.id = pm.paymentId
    WHERE invoice.account_id IN (${accountIdTokens})
       OR payment.account_id IN (${accountIdTokens})
  `)) as unknown as Array<{ id: number }>;

  const relatedMatchIds = relatedMatches
    .map(row => Number(row.id))
    .filter(id => Number.isInteger(id) && id > 0);

  if (relatedMatchIds.length > 0) {
    await db
      .delete(paymentMatching)
      .where(inArray(paymentMatching.id, relatedMatchIds));
  }

  if (allocations.length > 0) {
    await db.insert(paymentMatching).values(allocations);
  }

  return { matched: allocations.length };
}

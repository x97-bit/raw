import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createQueryResult,
  filterRowsByCondition,
  getDrizzleTableName,
} from "../../tests/support/fakeSql";
import { createRouteHarness } from "../../tests/support/httpRouteHarness";

function sumMatchingAmounts(rows: Array<Record<string, unknown>>) {
  return [
    {
      amountUsd: rows.reduce(
        (total, row) => total + Number(row.amountUSD || 0),
        0
      ),
      amountIqd: rows.reduce(
        (total, row) => total + Number(row.amountIQD || 0),
        0
      ),
    },
  ];
}

function createPaymentMatchingDb(options: {
  transactionsRows: Array<Record<string, unknown>>;
  matchingRows?: Array<Record<string, unknown>>;
}) {
  const transactionsRows = options.transactionsRows.map(row => ({ ...row }));
  const matchingRows = (options.matchingRows || []).map(row => ({ ...row }));

  return {
    transactionsRows,
    matchingRows,
    select(selection?: Record<string, unknown>) {
      return {
        from(table: unknown) {
          if (getDrizzleTableName(table) === "transactions") {
            return createQueryResult(transactionsRows);
          }

          if (getDrizzleTableName(table) === "payment_matching") {
            if (selection) {
              return {
                where: async (condition: unknown) =>
                  sumMatchingAmounts(
                    filterRowsByCondition(matchingRows, condition as never)
                  ),
              };
            }

            return createQueryResult(matchingRows);
          }

          throw new Error("Unexpected table in payment matching test db.");
        },
      };
    },
    insert(table: unknown) {
      if (getDrizzleTableName(table) !== "payment_matching") {
        throw new Error("Unexpected insert table in payment matching test db.");
      }

      return {
        values: async (data: Record<string, unknown>) => {
          const nextId =
            matchingRows.reduce(
              (max, row) => Math.max(max, Number(row.id || 0)),
              0
            ) + 1;
          matchingRows.push({
            id: nextId,
            ...data,
          });
          return [{ insertId: nextId }];
        },
      };
    },
    delete(table: unknown) {
      if (getDrizzleTableName(table) !== "payment_matching") {
        throw new Error("Unexpected delete table in payment matching test db.");
      }

      return {
        where: async (condition: unknown) => {
          const matches = new Set(
            filterRowsByCondition(matchingRows, condition as never)
          );
          for (let index = matchingRows.length - 1; index >= 0; index -= 1) {
            if (matches.has(matchingRows[index])) {
              matchingRows.splice(index, 1);
            }
          }
          return { affectedRows: matches.size };
        },
      };
    },
  };
}

async function loadPaymentMatchingHarness(
  fakeDb: ReturnType<typeof createPaymentMatchingDb>
) {
  vi.resetModules();

  vi.doMock("../../db", () => ({
    getDb: vi.fn().mockResolvedValue(fakeDb),
  }));
  vi.doMock("../../_core/appAuth", () => ({
    authMiddleware: (
      req: Record<string, unknown>,
      _res: unknown,
      next: () => void
    ) => {
      req.appUser = { id: 88, role: "admin", username: "tester" };
      next();
    },
  }));

  const { registerPaymentMatchingMutationRoutes } = await import("./mutation");
  return createRouteHarness(registerPaymentMatchingMutationRoutes);
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unmock("../../db");
  vi.unmock("../../_core/appAuth");
});

describe("payment matching routes integration", () => {
  it("creates a valid invoice-payment match and stores the allocation", async () => {
    const fakeDb = createPaymentMatchingDb({
      transactionsRows: [
        {
          id: 10,
          direction: "IN",
          accountId: 7,
          amountUsd: "100",
          amountIqd: "0",
        },
        {
          id: 11,
          direction: "OUT",
          accountId: 7,
          amountUsd: "80",
          amountIqd: "0",
        },
      ],
    });
    const harness = await loadPaymentMatchingHarness(fakeDb);

    try {
      const response = await harness.request("/payment-matching", {
        method: "POST",
        json: {
          invoiceId: 10,
          paymentId: 11,
          amountUSD: "60",
          amountIQD: "0",
          notes: "manual match",
        },
      });

      expect(response.status).toBe(200);
      expect(response.json).toMatchObject({ id: 1 });
      expect(fakeDb.matchingRows).toMatchObject([
        {
          id: 1,
          invoiceId: 10,
          paymentId: 11,
          amountUSD: "60",
          amountIQD: "0",
        },
      ]);
    } finally {
      await harness.close();
    }
  });

  it("rejects matches that exceed the remaining invoice or payment balance", async () => {
    const fakeDb = createPaymentMatchingDb({
      transactionsRows: [
        {
          id: 20,
          direction: "IN",
          accountId: 7,
          amountUsd: "100",
          amountIqd: "0",
        },
        {
          id: 21,
          direction: "OUT",
          accountId: 7,
          amountUsd: "90",
          amountIqd: "0",
        },
      ],
      matchingRows: [
        {
          id: 1,
          invoiceId: 20,
          paymentId: 999,
          amountUSD: "70",
          amountIQD: "0",
        },
        {
          id: 2,
          invoiceId: 998,
          paymentId: 21,
          amountUSD: "70",
          amountIQD: "0",
        },
      ],
    });
    const harness = await loadPaymentMatchingHarness(fakeDb);

    try {
      const response = await harness.request("/payment-matching", {
        method: "POST",
        json: {
          invoiceId: 20,
          paymentId: 21,
          amountUSD: "40",
          amountIQD: "0",
        },
      });

      expect(response.status).toBe(400);
      expect(fakeDb.matchingRows).toHaveLength(2);
    } finally {
      await harness.close();
    }
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createQueryResult,
  filterRowsByCondition,
  getDrizzleTableName,
} from "../../tests/support/fakeSql";
import { createRouteHarness } from "../../tests/support/httpRouteHarness";

function createTransactionsDb(seedRows: Array<Record<string, unknown>>) {
  const rows = seedRows.map(row => ({ ...row }));

  return {
    rows,
    select() {
      return {
        from(table: unknown) {
          if (getDrizzleTableName(table) !== "transactions") {
            throw new Error("Unexpected table in transactions test db.");
          }

          return createQueryResult(rows);
        },
      };
    },
    insert(table: unknown) {
      if (getDrizzleTableName(table) !== "transactions") {
        throw new Error("Unexpected insert table in transactions test db.");
      }

      return {
        values: async (data: Record<string, unknown>) => {
          const nextId =
            rows.reduce((max, row) => Math.max(max, Number(row.id || 0)), 0) +
            1;
          rows.push({
            id: nextId,
            ...data,
          });
          return [{ insertId: nextId }];
        },
      };
    },
    update(table: unknown) {
      if (getDrizzleTableName(table) !== "transactions") {
        throw new Error("Unexpected update table in transactions test db.");
      }

      return {
        set(updates: Record<string, unknown>) {
          return {
            where: async (condition: unknown) => {
              const [match] = filterRowsByCondition(rows, condition as never);
              if (match) {
                Object.assign(match, updates);
              }
              return { affectedRows: match ? 1 : 0 };
            },
          };
        },
      };
    },
    delete(table: unknown) {
      if (getDrizzleTableName(table) !== "transactions") {
        throw new Error("Unexpected delete table in transactions test db.");
      }

      return {
        where: async (condition: unknown) => {
          const matches = new Set(
            filterRowsByCondition(rows, condition as never)
          );
          for (let index = rows.length - 1; index >= 0; index -= 1) {
            if (matches.has(rows[index])) {
              rows.splice(index, 1);
            }
          }
          return { affectedRows: matches.size };
        },
      };
    },
  };
}

async function loadTransactionsHarness(
  fakeDb: ReturnType<typeof createTransactionsDb>
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
      req.appUser = { id: 77, role: "admin", username: "tester" };
      next();
    },
    requireAppUser: (req: Record<string, unknown>) => req.appUser,
  }));
  vi.doMock("../../_core/financialRateLimits", () => ({
    financialWriteRateLimit: (_req: unknown, _res: unknown, next: () => void) =>
      next(),
  }));
  vi.doMock("../../utils/safeAuditLog", () => ({
    safeWriteAuditLog: vi.fn().mockResolvedValue(undefined),
  }));
  vi.doMock("../../utils/paymentMatchingAutoMatch", () => ({
    rebuildPaymentMatchesForAccounts: vi.fn().mockResolvedValue({ matched: 0 }),
  }));

  const { registerTransactionRoutes } = await import("./index");
  return createRouteHarness(registerTransactionRoutes);
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unmock("../../db");
  vi.unmock("../../_core/appAuth");
  vi.unmock("../../_core/financialRateLimits");
  vi.unmock("../../utils/safeAuditLog");
  vi.unmock("../../utils/paymentMatchingAutoMatch");
});

describe("transaction routes integration", () => {
  it("creates, updates, and deletes a transaction through the route flow", async () => {
    const fakeDb = createTransactionsDb([
      {
        id: 7,
        refNo: "BAS-INV000007",
        direction: "IN",
        transDate: "2026-04-01",
        accountId: 10,
        currency: "USD",
        amountUsd: "100",
        amountIqd: "0",
        costUsd: "20",
        costIqd: "0",
        feeUsd: "0",
        syrCus: "0",
        recordType: "shipment",
        portId: "BAS",
        accountType: "merchant",
        createdBy: 77,
      },
    ]);
    const harness = await loadTransactionsHarness(fakeDb);

    try {
      const created = await harness.request("/transactions", {
        method: "POST",
        json: {
          type: 1,
          transDate: "2026-04-10",
          accountId: 12,
          currency: "USD",
          amountUsd: 250.5,
          amountIqd: 0,
          costUsd: 50,
          costIqd: 0,
          feeUsd: 10,
          portId: "bas",
          accountType: "merchant",
          notes: "initial shipment",
        },
      });

      expect(created.status).toBe(200);
      expect(created.json).toMatchObject({
        id: 8,
        refNo: "BAS-INV000008",
      });
      expect(fakeDb.rows).toHaveLength(2);
      expect(fakeDb.rows[1]).toMatchObject({
        id: 8,
        accountId: 12,
        amountUsd: "250.5",
        costUsd: "50",
        feeUsd: "10",
        notes: "initial shipment",
      });

      const updated = await harness.request("/transactions/8", {
        method: "PUT",
        json: {
          amountUsd: 300,
          notes: "updated shipment",
        },
      });

      expect(updated.status).toBe(200);
      expect(fakeDb.rows[1]).toMatchObject({
        id: 8,
        amountUsd: "300",
        notes: "updated shipment",
      });

      const deleted = await harness.request("/transactions/8", {
        method: "DELETE",
      });

      expect(deleted.status).toBe(200);
      expect(fakeDb.rows).toHaveLength(1);
      expect(fakeDb.rows[0]?.id).toBe(7);
    } finally {
      await harness.close();
    }
  });
});

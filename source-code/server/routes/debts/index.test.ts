import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createQueryResult,
  filterRowsByCondition,
  getDrizzleTableName,
} from "../../tests/support/fakeSql";
import { createRouteHarness } from "../../tests/support/httpRouteHarness";

function createDebtsDb(seedRows: Array<Record<string, unknown>>) {
  const rows = seedRows.map(row => ({ ...row }));

  return {
    rows,
    select() {
      return {
        from(table: unknown) {
          if (getDrizzleTableName(table) !== "debts") {
            throw new Error("Unexpected table in debts test db.");
          }

          return createQueryResult(rows);
        },
      };
    },
    insert(table: unknown) {
      if (getDrizzleTableName(table) !== "debts") {
        throw new Error("Unexpected insert table in debts test db.");
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
      if (getDrizzleTableName(table) !== "debts") {
        throw new Error("Unexpected update table in debts test db.");
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
      if (getDrizzleTableName(table) !== "debts") {
        throw new Error("Unexpected delete table in debts test db.");
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

async function loadDebtsHarness(fakeDb: ReturnType<typeof createDebtsDb>) {
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
      req.appUser = { id: 55, role: "admin", username: "tester" };
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

  const { registerDebtRoutes } = await import("./index");
  return createRouteHarness(registerDebtRoutes);
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unmock("../../db");
  vi.unmock("../../_core/appAuth");
  vi.unmock("../../_core/financialRateLimits");
  vi.unmock("../../utils/safeAuditLog");
});

describe("debt routes integration", () => {
  it("moves a debt from pending to partial to paid across route updates", async () => {
    const fakeDb = createDebtsDb([]);
    const harness = await loadDebtsHarness(fakeDb);

    try {
      const created = await harness.request("/debts", {
        method: "POST",
        json: {
          debtorName: "Trader A",
          amountUSD: 100,
          amountIQD: 0,
          feeUSD: 0,
          feeIQD: 0,
          paidAmountUSD: 0,
          paidAmountIQD: 0,
          description: "transport debt",
          date: "2026-04-10",
          status: "pending",
          state: "غير مسدد",
        },
      });

      expect(created.status).toBe(200);
      expect(created.json).toMatchObject({ id: 1 });

      const partial = await harness.request("/debts/1", {
        method: "PUT",
        json: {
          paidAmountUSD: 40,
          status: "partial",
          state: "تسديد جزئي",
        },
      });

      expect(partial.status).toBe(200);

      const partialList = await harness.request("/debts", { method: "GET" });
      expect(partialList.status).toBe(200);
      expect(
        (partialList.json as Array<Record<string, unknown>>)[0]
      ).toMatchObject({
        DebtID: 1,
        Status: "partial",
        State: "تسديد جزئي",
        RemainingUSD: 60,
      });

      const paid = await harness.request("/debts/1", {
        method: "PUT",
        json: {
          paidAmountUSD: 100,
          status: "paid",
          state: "مسدد",
        },
      });

      expect(paid.status).toBe(200);

      const paidList = await harness.request("/debts", { method: "GET" });
      expect(
        (paidList.json as Array<Record<string, unknown>>)[0]
      ).toMatchObject({
        DebtID: 1,
        Status: "paid",
        State: "مسدد",
        RemainingUSD: 0,
      });
    } finally {
      await harness.close();
    }
  });
});

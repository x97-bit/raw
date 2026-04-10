import { afterEach, describe, expect, it, vi } from "vitest";
import { accounts } from "../../../drizzle/schema";
import { createQueryResult, getDrizzleTableName } from "../../tests/support/fakeSql";
import { createRouteHarness } from "../../tests/support/httpRouteHarness";

function createTransportAccountsDb(seedAccounts: Array<Record<string, unknown>>) {
  const accountRows = seedAccounts.map((row) => ({ ...row }));

  return {
    select() {
      return {
        from(table: unknown) {
          if (getDrizzleTableName(table) !== "accounts") {
            throw new Error("Unexpected table in transport accounts test db.");
          }

          return createQueryResult(accountRows);
        },
      };
    },
    insert(table: unknown) {
      if (getDrizzleTableName(table) !== "accounts") {
        throw new Error("Unexpected insert table in transport accounts test db.");
      }

      return {
        values: async (data: Record<string, unknown>) => {
          const nextId = accountRows.reduce((max, row) => Math.max(max, Number(row.id || 0)), 0) + 1;
          accountRows.push({
            id: nextId,
            ...data,
          });
          return [{ insertId: nextId }];
        },
      };
    },
    update() {
      throw new Error("Unexpected update in transport accounts test db.");
    },
    delete() {
      throw new Error("Unexpected delete in transport accounts test db.");
    },
  };
}

async function loadTransportAccountsHarness(fakeDb: ReturnType<typeof createTransportAccountsDb>) {
  vi.resetModules();

  vi.doMock("../../db", () => ({
    getDb: vi.fn().mockResolvedValue(fakeDb),
  }));
  vi.doMock("../../_core/appAuth", () => ({
    authMiddleware: (_req: unknown, _res: unknown, next: () => void) => next(),
  }));

  const { registerAccountRoutes } = await import("./accounts");
  return createRouteHarness(registerAccountRoutes);
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unmock("../../db");
  vi.unmock("../../_core/appAuth");
});

describe("transport accounts scope", () => {
  it("returns only the approved three traders for transport accounts", async () => {
    const fakeDb = createTransportAccountsDb([
      { id: 4, name: "تاجر آخر", accountType: "2", portId: "transport-1" },
      { id: 2, name: "عبدالعزيز احمد", accountType: "2", portId: "transport-1" },
      { id: 3, name: "صباح اسماعيل", accountType: "2", portId: "transport-1" },
      { id: 1, name: "إبراهيم سعد رمضان", accountType: "2", portId: "transport-1" },
    ]);

    const harness = await loadTransportAccountsHarness(fakeDb);

    try {
      const response = await harness.request("/accounts?port=transport-1&accountType=2", { method: "GET" });
      expect(response.status).toBe(200);
      expect(response.json).toEqual([
        expect.objectContaining({ AccountName: "ابراهيم سعد" }),
        expect.objectContaining({ AccountName: "عبدالعزيز" }),
        expect.objectContaining({ AccountName: "صباح اسماعيل" }),
      ]);
    } finally {
      await harness.close();
    }
  });

  it("rejects adding a transport trader outside the approved list", async () => {
    const fakeDb = createTransportAccountsDb([]);
    const harness = await loadTransportAccountsHarness(fakeDb);

    try {
      const response = await harness.request("/accounts", {
        method: "POST",
        json: {
          AccountName: "تاجر جديد",
          AccountTypeID: 2,
          DefaultPortID: "transport-1",
        },
      });

      expect(response.status).toBe(400);
      expect(response.json).toEqual({
        error: "في النقل، التجار المعتمدون حاليًا هم: ابراهيم سعد، عبدالعزيز، صباح اسماعيل",
      });
    } finally {
      await harness.close();
    }
  });

  it("allows adding an approved transport trader", async () => {
    const fakeDb = createTransportAccountsDb([]);
    const harness = await loadTransportAccountsHarness(fakeDb);

    try {
      const response = await harness.request("/accounts", {
        method: "POST",
        json: {
          AccountName: "ابراهيم سعد",
          AccountTypeID: 2,
          DefaultPortID: "transport-1",
        },
      });

      expect(response.status).toBe(200);
      expect(response.json).toEqual(expect.objectContaining({ id: 1 }));
    } finally {
      await harness.close();
    }
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { companies } from "../../../drizzle/schema";
import {
  createQueryResult,
  getDrizzleTableName,
} from "../../tests/support/fakeSql";
import { createRouteHarness } from "../../tests/support/httpRouteHarness";

function createAccountLookupsDb(seedCompanies: Array<Record<string, unknown>>) {
  const companyRows = seedCompanies.map(row => ({ ...row }));
  let companySelectCount = 0;

  return {
    companyRows,
    getCompanySelectCount() {
      return companySelectCount;
    },
    select() {
      return {
        from(table: unknown) {
          if (getDrizzleTableName(table) !== "companies") {
            throw new Error("Unexpected table in account lookups test db.");
          }

          companySelectCount += 1;
          return createQueryResult(companyRows);
        },
      };
    },
    insert(table: unknown) {
      if (getDrizzleTableName(table) !== "companies") {
        throw new Error("Unexpected insert table in account lookups test db.");
      }

      return {
        values: async (data: Record<string, unknown>) => {
          const nextId =
            companyRows.reduce(
              (max, row) => Math.max(max, Number(row.id || 0)),
              0
            ) + 1;
          companyRows.push({
            id: nextId,
            active: 1,
            ...data,
          });
          return [{ insertId: nextId }];
        },
      };
    },
    update() {
      throw new Error("Unexpected update in account lookups cache test.");
    },
    delete() {
      throw new Error("Unexpected delete in account lookups cache test.");
    },
  };
}

async function loadAccountLookupsHarness(
  fakeDb: ReturnType<typeof createAccountLookupsDb>
) {
  vi.resetModules();

  vi.doMock("../../db", () => ({
    getDb: vi.fn().mockResolvedValue(fakeDb),
  }));
  vi.doMock("../../_core/appAuth", () => ({
    authMiddleware: (_req: unknown, _res: unknown, next: () => void) => next(),
  }));

  const { registerAccountLookupRoutes } = await import("./index");
  return createRouteHarness(registerAccountLookupRoutes);
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unmock("../../db");
  vi.unmock("../../_core/appAuth");
});

describe("account lookup caching", () => {
  it("caches reference reads and invalidates them after a company write", async () => {
    const fakeDb = createAccountLookupsDb([
      { id: 1, name: "Alpha Logistics", active: 1 },
      { id: 2, name: "Beta Trade", active: 1 },
    ]);
    const harness = await loadAccountLookupsHarness(fakeDb);

    try {
      const firstRead = await harness.request("/lookups/companies", {
        method: "GET",
      });
      expect(firstRead.status).toBe(200);
      expect(firstRead.headers.get("x-cache")).toBe("MISS");
      expect(fakeDb.getCompanySelectCount()).toBe(1);

      const secondRead = await harness.request("/lookups/companies", {
        method: "GET",
      });
      expect(secondRead.status).toBe(200);
      expect(secondRead.headers.get("x-cache")).toBe("HIT");
      expect(fakeDb.getCompanySelectCount()).toBe(1);

      const created = await harness.request("/lookups/companies", {
        method: "POST",
        json: { name: "Gamma Freight" },
      });
      expect(created.status).toBe(200);

      const afterWrite = await harness.request("/lookups/companies", {
        method: "GET",
      });
      expect(afterWrite.status).toBe(200);
      expect(afterWrite.headers.get("x-cache")).toBe("MISS");
      expect(fakeDb.getCompanySelectCount()).toBe(3);
      expect(afterWrite.json).toMatchObject([
        { CompanyName: "Alpha Logistics" },
        { CompanyName: "Beta Trade" },
        { CompanyName: "Gamma Freight" },
      ]);
    } finally {
      await harness.close();
    }
  });
});

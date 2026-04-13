import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryResult, getDrizzleTableName } from "../../tests/support/fakeSql";
import { createRouteHarness } from "../../tests/support/httpRouteHarness";

function createAuthDb(seedRows: Array<Record<string, unknown>>) {
  const rows = seedRows.map((row) => ({ ...row }));

  return {
    select() {
      return {
        from(table: unknown) {
          if (getDrizzleTableName(table) !== "app_users") {
            throw new Error("Unexpected table in auth test db.");
          }

          return createQueryResult(rows);
        },
      };
    },
  };
}

async function loadAuthHarness(fakeDb: ReturnType<typeof createAuthDb>) {
  vi.resetModules();

  vi.doMock("../../db", () => ({
    getDb: vi.fn().mockResolvedValue(fakeDb),
  }));
  vi.doMock("../../_core/sessionSecret", () => ({
    getAppAccessTokenSecret: () => new TextEncoder().encode("test-access-secret-that-is-long-enough"),
    getAppRefreshTokenSecret: () => new TextEncoder().encode("test-refresh-secret-that-is-long-enough"),
    getSessionSecret: () => new TextEncoder().encode("test-session-secret-that-is-long-enough"),
  }));

  const { registerAuthRoutes } = await import("./auth");
  return createRouteHarness(registerAuthRoutes);
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unmock("../../db");
  vi.unmock("../../_core/sessionSecret");
});

describe("auth routes integration", () => {
  it("issues refresh cookies on login, refreshes the access token, and clears the cookie on logout", async () => {
    const hashedPassword = await bcrypt.hash("StrongPass1", 10);
    const fakeDb = createAuthDb([
      {
        id: 9,
        username: "admin",
        password: hashedPassword,
        name: "Admin User",
        profileImage: null,
        role: "admin",
        permissions: ["reports"],
        active: 1,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
        updatedAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    ]);
    const harness = await loadAuthHarness(fakeDb);

    try {
      const login = await harness.request("/auth/login", {
        method: "POST",
        json: {
          username: "admin",
          password: "StrongPass1",
        },
      });

      expect(login.status).toBe(200);
      expect(login.json).toMatchObject({
        token: expect.any(String),
        expiresInSeconds: 3600,
      });

      const refreshCookie = login.headers.get("set-cookie");
      expect(refreshCookie).toContain("app_refresh_token=");

      const refresh = await harness.request("/auth/refresh", {
        method: "POST",
        headers: {
          cookie: refreshCookie ?? "",
        },
      });

      expect(refresh.status).toBe(200);
      expect(refresh.json).toMatchObject({
        token: expect.any(String),
        expiresInSeconds: 3600,
      });
      expect(refresh.headers.get("set-cookie")).toContain("app_refresh_token=");

      const logout = await harness.request("/auth/logout", {
        method: "POST",
        headers: {
          cookie: refreshCookie ?? "",
        },
      });

      expect(logout.status).toBe(200);
      expect(logout.json).toEqual({ success: true });
      expect(logout.headers.get("set-cookie")).toContain("app_refresh_token=");
    } finally {
      await harness.close();
    }
  });

  it("rejects refresh requests when the cookie is missing", async () => {
    const fakeDb = createAuthDb([]);
    const harness = await loadAuthHarness(fakeDb);

    try {
      const refresh = await harness.request("/auth/refresh", {
        method: "POST",
      });

      expect(refresh.status).toBe(401);
    } finally {
      await harness.close();
    }
  });
});

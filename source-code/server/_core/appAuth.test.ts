import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
}));

vi.mock("../db", () => ({
  getDb: getDbMock,
}));
vi.mock("./sessionSecret", () => ({
  getAppAccessTokenSecret: () =>
    new TextEncoder().encode("test-access-secret-that-is-long-enough"),
  getAppRefreshTokenSecret: () =>
    new TextEncoder().encode("test-refresh-secret-that-is-long-enough"),
}));

import {
  authMiddleware,
  getRefreshTokenFromRequest,
  signRefreshToken,
  signToken,
  verifyRefreshToken,
} from "./appAuth";

function createRequest(authorization?: string) {
  return {
    headers: authorization ? { authorization } : {},
  } as any;
}

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;
}

function createFakeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    username: "tester",
    password: "hashed-password",
    name: "Test User",
    profileImage: null,
    role: "admin",
    permissions: ["reports"],
    active: 1,
    createdAt: new Date("2026-04-01T00:00:00.000Z"),
    updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createFakeDb(user: Record<string, unknown> | null) {
  return {
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: vi.fn().mockResolvedValue(user ? [user] : []),
              };
            },
          };
        },
      };
    },
  };
}

beforeEach(() => {
  getDbMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("authMiddleware", () => {
  it("rejects requests without a bearer token", async () => {
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("rejects invalid or expired bearer tokens", async () => {
    const req = createRequest("Bearer not-a-real-token");
    const res = createResponse();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("rejects inactive users after token verification", async () => {
    const req = createRequest(
      `Bearer ${await signToken({ userId: 7, role: "user" })}`
    );
    const res = createResponse();
    const next = vi.fn();

    getDbMock.mockResolvedValue(createFakeDb(createFakeUser({ active: 0 })));

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches the typed app user for valid tokens", async () => {
    const user = createFakeUser();
    const req = createRequest(
      `Bearer ${await signToken({ userId: 7, role: "admin" })}`
    );
    const res = createResponse();
    const next = vi.fn();

    getDbMock.mockResolvedValue(createFakeDb(user));

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.appUser).toMatchObject({
      id: 7,
      username: "tester",
      role: "admin",
      active: 1,
    });
  });
});

describe("refresh token helpers", () => {
  it("extracts the refresh token from cookies", async () => {
    const refreshToken = await signRefreshToken({ userId: 7, role: "admin" });
    const req = {
      headers: {
        cookie: `app_refresh_token=${refreshToken}; other=value`,
      },
    } as any;

    expect(getRefreshTokenFromRequest(req)).toBe(refreshToken);
  });

  it("signs and verifies refresh tokens with the refresh secret", async () => {
    const refreshToken = await signRefreshToken({ userId: 7, role: "admin" });

    await expect(verifyRefreshToken(refreshToken)).resolves.toMatchObject({
      userId: 7,
      role: "admin",
      tokenType: "refresh",
    });
  });
});

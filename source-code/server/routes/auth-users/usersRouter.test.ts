import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../../routers";
import { TRPCError } from "@trpc/server";

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../../db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

describe("usersRouter", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const createContext = (role: "admin" | "user", id = 1) => ({
    user: { id, role, username: "test_user", active: 1, permissions: [] },
  });

  it("lists users if admin", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    const fakeRows = [
      {
        id: 1,
        username: "admin",
        name: "Admin",
        role: "admin",
        permissions: [],
        active: 1,
        createdAt: new Date(),
      },
    ];

    mockDb.select.mockReturnValue({
      from: vi.fn().mockResolvedValue(fakeRows),
    } as any);

    const result = await caller.users.list();
    expect(result).toHaveLength(1);
    expect(result[0].Username).toBe("admin");
  });

  it("rejects listing users if not admin", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.users.list()).rejects.toThrowError(TRPCError);
  });

  it("creates a user if admin", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    mockDb.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue([{ insertId: 2 }]),
    } as any);

    const result = await caller.users.create({
      username: "new_user",
      password: "StrongPassword123!",
      name: "New User",
      role: "user",
    });

    expect(result.id).toBe(2);
    expect(result.message).toBe("تم إنشاء المستخدم");
  });

  it("rejects weak passwords on create", async () => {
    const caller = appRouter.createCaller(createContext("admin"));

    await expect(
      caller.users.create({
        username: "new_user",
        password: "weak", // Invalid password
        name: "New User",
        role: "user",
      })
    ).rejects.toThrowError(); // Zod error
  });

  it("allows user to get their own permissions", async () => {
    const caller = appRouter.createCaller(createContext("user", 5));

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ permissions: ["reports"] }]),
        }),
      }),
    } as any);

    const result = await caller.users.getPermissions({ id: 5 });
    expect(result).toEqual(["reports"]);
  });

  it("rejects getting permissions for another user if not admin", async () => {
    const caller = appRouter.createCaller(createContext("user", 5));

    await expect(caller.users.getPermissions({ id: 6 })).rejects.toThrowError(
      TRPCError
    );
  });
});

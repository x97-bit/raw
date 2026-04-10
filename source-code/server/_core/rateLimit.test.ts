import { describe, expect, it } from "vitest";
import { buildRateLimitGuard, resolveRateLimitClientIp } from "./rateLimit";

describe("rate limit helpers", () => {
  it("blocks after exceeding the allowed attempts in the same window", () => {
    let currentTime = 0;
    const guard = buildRateLimitGuard({
      keyPrefix: "login",
      windowMs: 60_000,
      max: 2,
      message: "Too many attempts",
      now: () => currentTime,
    });

    expect(guard.check("client-1").allowed).toBe(true);
    expect(guard.check("client-1").allowed).toBe(true);
    const blocked = guard.check("client-1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets counts after the time window expires", () => {
    let currentTime = 0;
    const guard = buildRateLimitGuard({
      keyPrefix: "writes",
      windowMs: 1_000,
      max: 1,
      message: "Too many requests",
      now: () => currentTime,
    });

    expect(guard.check("client-2").allowed).toBe(true);
    expect(guard.check("client-2").allowed).toBe(false);

    currentTime = 1_500;
    expect(guard.check("client-2").allowed).toBe(true);
  });

  it("prefers trusted proxy addresses exposed on req.ips when resolving client ip", () => {
    const ip = resolveRateLimitClientIp({
      ips: ["10.0.0.5", "127.0.0.1"],
      ip: "::1",
    } as any);

    expect(ip).toBe("10.0.0.5");
  });
});

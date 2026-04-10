import { afterEach, describe, expect, it } from "vitest";
import { ENV } from "./env";
import { getSessionSecret } from "./sessionSecret";

const originalSecret = ENV.cookieSecret;

afterEach(() => {
  ENV.cookieSecret = originalSecret;
});

describe("getSessionSecret", () => {
  it("returns an encoded secret when JWT_SECRET is strong enough", () => {
    ENV.cookieSecret = "a".repeat(64);

    const secret = getSessionSecret();

    expect(secret).toBeInstanceOf(Uint8Array);
    expect(secret.length).toBeGreaterThanOrEqual(32);
  });

  it("throws when JWT_SECRET is missing", () => {
    ENV.cookieSecret = "";

    expect(() => getSessionSecret()).toThrow("JWT_SECRET is required");
  });

  it("throws when JWT_SECRET is too short", () => {
    ENV.cookieSecret = "short-secret";

    expect(() => getSessionSecret()).toThrow("JWT_SECRET must be at least 32 characters long.");
  });
});


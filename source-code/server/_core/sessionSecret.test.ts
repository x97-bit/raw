import { afterEach, describe, expect, it } from "vitest";
import { ENV } from "./env";
import { getAppAccessTokenSecret, getAppRefreshTokenSecret, getSessionSecret } from "./sessionSecret";

const originalSessionCookieSecret = ENV.sessionCookieSecret;
const originalAppAccessTokenSecret = ENV.appAccessTokenSecret;
const originalAppRefreshTokenSecret = ENV.appRefreshTokenSecret;

afterEach(() => {
  ENV.sessionCookieSecret = originalSessionCookieSecret;
  ENV.appAccessTokenSecret = originalAppAccessTokenSecret;
  ENV.appRefreshTokenSecret = originalAppRefreshTokenSecret;
});

describe("session secret helpers", () => {
  it("returns an encoded secret when the configured secret is strong enough", () => {
    ENV.sessionCookieSecret = "a".repeat(64);
    ENV.appAccessTokenSecret = "b".repeat(64);
    ENV.appRefreshTokenSecret = "c".repeat(64);

    expect(getSessionSecret()).toBeInstanceOf(Uint8Array);
    expect(getAppAccessTokenSecret()).toBeInstanceOf(Uint8Array);
    expect(getAppRefreshTokenSecret()).toBeInstanceOf(Uint8Array);
  });

  it("throws when required secrets are missing", () => {
    ENV.sessionCookieSecret = "";
    ENV.appAccessTokenSecret = "";
    ENV.appRefreshTokenSecret = "";

    expect(() => getSessionSecret()).toThrow("SESSION_COOKIE_SECRET");
    expect(() => getAppAccessTokenSecret()).toThrow("APP_ACCESS_TOKEN_SECRET");
    expect(() => getAppRefreshTokenSecret()).toThrow("APP_REFRESH_TOKEN_SECRET");
  });

  it("throws when a configured secret is too short", () => {
    ENV.sessionCookieSecret = "short-secret";
    ENV.appAccessTokenSecret = "short-secret";
    ENV.appRefreshTokenSecret = "short-secret";

    expect(() => getSessionSecret()).toThrow("at least 32 characters");
    expect(() => getAppAccessTokenSecret()).toThrow("at least 32 characters");
    expect(() => getAppRefreshTokenSecret()).toThrow("at least 32 characters");
  });
});

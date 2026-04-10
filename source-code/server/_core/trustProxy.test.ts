import { describe, expect, it } from "vitest";
import { parseTrustProxySetting } from "./trustProxy";

describe("parseTrustProxySetting", () => {
  it("defaults to loopback when the value is missing", () => {
    expect(parseTrustProxySetting()).toBe("loopback");
    expect(parseTrustProxySetting("")).toBe("loopback");
  });

  it("parses numeric hop counts as numbers", () => {
    expect(parseTrustProxySetting("1")).toBe(1);
    expect(parseTrustProxySetting("2")).toBe(2);
  });

  it("parses booleans", () => {
    expect(parseTrustProxySetting("true")).toBe(true);
    expect(parseTrustProxySetting("false")).toBe(false);
  });

  it("preserves named proxy ranges", () => {
    expect(parseTrustProxySetting("loopback")).toBe("loopback");
    expect(parseTrustProxySetting("127.0.0.1")).toBe("127.0.0.1");
  });
});

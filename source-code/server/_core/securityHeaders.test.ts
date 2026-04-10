import { afterEach, describe, expect, it, vi } from "vitest";
import { buildContentSecurityPolicy, buildSecurityHeaders, SECURITY_HEADERS, securityHeadersMiddleware } from "./securityHeaders";

describe("securityHeadersMiddleware", () => {
  afterEach(() => {
    delete process.env.VITE_ANALYTICS_ENDPOINT;
    process.env.NODE_ENV = "test";
  });

  it("applies the baseline security headers plus a content security policy", () => {
    const setHeader = vi.fn();
    const next = vi.fn();
    const res = { setHeader } as any;

    securityHeadersMiddleware(
      {
        protocol: "http",
        secure: false,
      } as any,
      res,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(setHeader).toHaveBeenCalledTimes(Object.keys(SECURITY_HEADERS).length + 1);
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      expect(setHeader).toHaveBeenCalledWith(header, value);
    }
    expect(setHeader).toHaveBeenCalledWith("Content-Security-Policy", expect.stringContaining("default-src 'self'"));
  });

  it("includes runtime script origins in the content security policy", () => {
    process.env.VITE_ANALYTICS_ENDPOINT = "https://analytics.example.com/collect";

    const policy = buildContentSecurityPolicy();

    expect(policy).toContain("https://analytics.example.com");
    expect(policy).toContain("script-src");
  });

  it("adds HSTS only for secure production requests", () => {
    process.env.NODE_ENV = "production";

    const secureHeaders = buildSecurityHeaders({
      protocol: "https",
      secure: true,
    } as any);
    const insecureHeaders = buildSecurityHeaders({
      protocol: "http",
      secure: false,
    } as any);

    expect(secureHeaders["Strict-Transport-Security"]).toBe("max-age=31536000; includeSubDomains");
    expect(insecureHeaders["Strict-Transport-Security"]).toBeUndefined();
  });
});

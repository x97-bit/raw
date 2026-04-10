import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { getSessionCookieOptions } from "./cookies";

describe("getSessionCookieOptions", () => {
  it("uses lax cookies for local insecure requests", () => {
    const options = getSessionCookieOptions({
      protocol: "http",
      headers: {},
    } as Request);

    expect(options).toMatchObject({
      httpOnly: true,
      path: "/",
      secure: false,
      sameSite: "lax",
    });
  });

  it("uses none cookies for secure requests", () => {
    const options = getSessionCookieOptions({
      protocol: "https",
      headers: {},
    } as Request);

    expect(options).toMatchObject({
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "none",
    });
  });
});


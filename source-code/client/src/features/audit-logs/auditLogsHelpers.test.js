import { describe, expect, it } from "vitest";
import {
  buildAuditLogsQuery,
  buildAuditStats,
  createAuditFilters,
  formatAuditDateTime,
  parseAuditField,
} from "./auditLogsHelpers";

describe("auditLogsHelpers", () => {
  it("creates default audit filters with optional overrides", () => {
    expect(createAuditFilters()).toEqual({
      entityType: "",
      action: "",
      username: "",
      from: "",
      to: "",
      limit: 100,
    });

    expect(createAuditFilters({ action: "delete", limit: 50 })).toEqual({
      entityType: "",
      action: "delete",
      username: "",
      from: "",
      to: "",
      limit: 50,
    });
  });

  it("builds audit query strings from active filters", () => {
    expect(
      buildAuditLogsQuery({
        entityType: "debt",
        action: "update",
        username: "admin",
        from: "2026-04-01",
        to: "2026-04-09",
        limit: 40,
      })
    ).toBe(
      "entityType=debt&action=update&username=admin&from=2026-04-01&to=2026-04-09&limit=40"
    );
  });

  it("parses audit fields safely", () => {
    expect(parseAuditField('{"a":1}')).toEqual({ a: 1 });
    expect(parseAuditField("plain text")).toBe("plain text");
    expect(parseAuditField(null)).toBeNull();
  });

  it("formats invalid or empty audit datetimes defensively", () => {
    expect(formatAuditDateTime("")).toBe("-");
    expect(formatAuditDateTime("invalid-date")).toBe("invalid-date");
    expect(typeof formatAuditDateTime("2026-04-09T10:00:00Z")).toBe("string");
  });

  it("builds audit stats from rows", () => {
    expect(
      buildAuditStats([
        { action: "create" },
        { action: "update" },
        { action: "update" },
        { action: "delete" },
      ])
    ).toEqual({
      total: 4,
      creates: 1,
      updates: 2,
      deletes: 1,
    });
  });
});

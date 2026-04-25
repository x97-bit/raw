import { describe, expect, it } from "vitest";
import { RequestValidationError } from "../../_core/requestValidation";
import {
  BACKUP_FORMAT,
  assertImportableBackupPayload,
  normalizeBackupPayload,
  validateBackupImportPayload,
} from "./shared";

describe("normalizeBackupPayload", () => {
  it("normalizes structured backup payloads with meta", () => {
    const result = normalizeBackupPayload({
      meta: {
        format: BACKUP_FORMAT,
        templateOnly: false,
      },
      schema: {
        transactions: { columns: 1 },
      },
      counts: {
        transactions: 1,
      },
      data: {
        transactions: [{ id: 1 }],
      },
    });

    expect(result.meta).toMatchObject({
      format: BACKUP_FORMAT,
      templateOnly: false,
    });
    expect(result.schema).toMatchObject({
      transactions: { columns: 1 },
    });
    expect(result.counts).toMatchObject({
      transactions: 1,
    });
    expect(result.data.transactions).toEqual([{ id: 1 }]);
  });

  it("normalizes legacy flat backup payloads", () => {
    const result = normalizeBackupPayload({
      transactions: [{ id: 2 }],
    });

    expect(result.meta).toEqual({});
    expect(result.schema).toEqual({});
    expect(result.counts).toEqual({});
    expect(result.data.transactions).toEqual([{ id: 2 }]);
  });
});

describe("assertImportableBackupPayload", () => {
  it("rejects template-only backup payloads", () => {
    const backup = normalizeBackupPayload({
      meta: {
        format: BACKUP_FORMAT,
        templateOnly: true,
      },
      data: {
        transactions: [{ id: 1 }],
      },
    });

    expect(() => assertImportableBackupPayload(backup)).toThrow(
      RequestValidationError
    );
  });

  it("rejects backup payloads with an unsupported format", () => {
    const backup = normalizeBackupPayload({
      meta: {
        format: "unknown-backup-format",
      },
      data: {
        transactions: [{ id: 1 }],
      },
    });

    expect(() => assertImportableBackupPayload(backup)).toThrow(
      RequestValidationError
    );
  });
});

describe("validateBackupImportPayload", () => {
  it("rejects backup imports with too many tables", () => {
    const backup = Object.fromEntries(
      Array.from({ length: 81 }, (_, index) => [`table_${index + 1}`, []])
    );

    expect(() => validateBackupImportPayload(backup)).toThrow(
      RequestValidationError
    );
  });

  it("rejects backup imports with invalid table names", () => {
    expect(() =>
      validateBackupImportPayload({
        "transactions;drop": [],
      })
    ).toThrow(RequestValidationError);
  });

  it("rejects backup imports when a row is not an object", () => {
    expect(() =>
      validateBackupImportPayload({
        transactions: [null],
      })
    ).toThrow(RequestValidationError);
  });
});

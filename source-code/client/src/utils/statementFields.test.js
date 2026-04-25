import { describe, expect, it } from "vitest";
import {
  getStatementFields,
  isStatementFieldSection,
  STATEMENT_COLUMNS,
  STATEMENT_FIELDS,
} from "./statementFields";

describe("statementFields", () => {
  it("keeps field management aligned with statement columns", () => {
    expect(STATEMENT_FIELDS.map(field => field.key)).toEqual(
      STATEMENT_COLUMNS.map(column => column.key)
    );
  });

  it("provides statement fields for every statement section", () => {
    const expectedKeys = STATEMENT_COLUMNS.map(column => column.key);

    ["port-1", "port-2", "port-3", "transport-1", "partnership-1"].forEach(
      sectionKey => {
        expect(isStatementFieldSection(sectionKey)).toBe(true);
        expect(getStatementFields(sectionKey).map(field => field.key)).toEqual(
          expectedKeys
        );
      }
    );
  });

  it("does not expose statement fields for non-statement sections", () => {
    expect(isStatementFieldSection("debts")).toBe(false);
    expect(getStatementFields("debts")).toEqual([]);
  });
});

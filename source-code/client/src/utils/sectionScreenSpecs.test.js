import { describe, expect, it } from "vitest";
import {
  getSectionColumns,
  getSectionTargetFields,
} from "./sectionScreenSpecs";

const TRANSACTION_SECTIONS = [
  "transport-1",
  "port-1",
  "port-2",
  "port-3",
  "partnership-1",
];
const STATEMENT_PREFIX_KEYS = ["ref_no", "direction", "trans_date", "currency"];
const STATEMENT_FINANCIAL_KEYS = [
  "cost_usd",
  "amount_usd",
  "cost_iqd",
  "amount_iqd",
];

describe("sectionScreenSpecs", () => {
  it("keeps shared statement prefix columns at the front for every transaction section", () => {
    TRANSACTION_SECTIONS.filter(sectionKey => sectionKey !== "port-3").forEach(
      sectionKey => {
        const statementColumns = getSectionColumns(sectionKey, "statement");
        expect(
          statementColumns
            .slice(0, STATEMENT_PREFIX_KEYS.length)
            .map(column => column.key)
        ).toEqual(STATEMENT_PREFIX_KEYS);
      }
    );
  });

  it("orders financial statement fields as cost then amount in usd and iqd", () => {
    TRANSACTION_SECTIONS.forEach(sectionKey => {
      const statementKeys = getSectionColumns(sectionKey, "statement").map(
        column => column.key
      );
      const presentFinancialKeys = STATEMENT_FINANCIAL_KEYS.filter(key =>
        statementKeys.includes(key)
      );

      expect(
        statementKeys.filter(key => presentFinancialKeys.includes(key))
      ).toEqual(presentFinancialKeys);
    });
  });

  it("uses the requested current statement order for Qaim", () => {
    const qaimStatementKeys = getSectionColumns("port-3", "statement").map(
      column => column.key
    );

    expect(qaimStatementKeys.slice(0, 14)).toEqual([
      "ref_no",
      "direction",
      "trans_date",
      "account_name",
      "currency",
      "driver_name",
      "vehicle_plate",
      "good_type",
      "weight",
      "qty",
      "cost_usd",
      "amount_usd",
      "cost_iqd",
      "amount_iqd",
    ]);
    expect(qaimStatementKeys).toContain("company_name");
    expect(qaimStatementKeys).toContain("trader_note");
    expect(qaimStatementKeys).toContain("notes");
  });

  it("preserves section-specific invoice fields per port", () => {
    const saudiInvoiceKeys = getSectionTargetFields("port-1", "invoice").map(
      field => field.key
    );
    const mondhiriyaInvoiceKeys = getSectionTargetFields(
      "port-2",
      "invoice"
    ).map(field => field.key);
    const mondhiriyaStatementKeys = getSectionTargetFields(
      "port-2",
      "statement"
    ).map(field => field.key);
    const qaimInvoiceKeys = getSectionTargetFields("port-3", "invoice").map(
      field => field.key
    );
    const qaimStatementKeys = getSectionTargetFields("port-3", "statement").map(
      field => field.key
    );

    expect(saudiInvoiceKeys).toContain("fee_usd");
    expect(saudiInvoiceKeys).toContain("trans_price");
    expect(saudiInvoiceKeys).not.toContain("syr_cus");
    expect(mondhiriyaInvoiceKeys).toContain("qty");
    expect(mondhiriyaInvoiceKeys).toContain("syr_cus");
    expect(mondhiriyaStatementKeys).toContain("qty");
    expect(qaimInvoiceKeys).toContain("company_name");
    expect(qaimStatementKeys).toContain("company_name");
    expect(qaimStatementKeys).toContain("trader_note");
    expect(qaimStatementKeys).toContain("notes");
  });

  it("uses the Iraqi transport label for Saudi transaction price fields", () => {
    const saudiListColumns = getSectionColumns("port-1", "list");
    const saudiStatementColumns = getSectionColumns("port-1", "statement");
    const saudiInvoiceFields = getSectionTargetFields("port-1", "invoice");
    const expectedLabel = "نقل عراقي (دينار)";

    expect(
      saudiStatementColumns.find(column => column.key === "cost_usd")?.label
    ).toBe("الكلفة دولار");
    expect(
      saudiListColumns.find(column => column.key === "trans_price")?.label
    ).toBe(expectedLabel);
    expect(
      saudiStatementColumns.find(column => column.key === "trans_price")
    ).toBeUndefined();
    expect(
      saudiInvoiceFields.find(field => field.key === "trans_price")?.label
    ).toBe(expectedLabel);
  });

  it("exposes Mondhiriya invoice-derived statement fields without forcing them visible by default", () => {
    const mondhiriyaStatementFields = getSectionTargetFields(
      "port-2",
      "statement"
    );

    expect(
      mondhiriyaStatementFields.find(field => field.key === "account_name")
        ?.defaultVisible
    ).toBe(false);
    expect(
      mondhiriyaStatementFields.find(field => field.key === "syr_cus")
        ?.defaultVisible
    ).toBe(false);
    expect(
      mondhiriyaStatementFields.find(field => field.key === "trader_note")
        ?.defaultVisible
    ).toBe(false);
    expect(
      mondhiriyaStatementFields.find(field => field.key === "notes")
        ?.defaultVisible
    ).toBe(false);
    expect(
      mondhiriyaStatementFields.find(field => field.key === "cost_usd")
        ?.defaultVisible
    ).toBeUndefined();
  });

  it("normalizes shared labels while preserving payment reference wording", () => {
    const qaimStatementColumns = getSectionColumns("port-3", "statement");
    const qaimPaymentFields = getSectionTargetFields("port-3", "payment");

    expect(
      qaimStatementColumns.find(column => column.key === "amount_usd")?.label
    ).toBe("المبلغ دولار");
    expect(
      qaimStatementColumns.find(column => column.key === "cost_usd")?.label
    ).toBe("الكلفة دولار");
    expect(qaimPaymentFields.find(field => field.key === "ref_no")?.label).toBe(
      "رقم سند القبض"
    );
  });
});

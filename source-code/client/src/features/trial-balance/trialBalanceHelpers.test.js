import { describe, expect, it } from "vitest";
import {
  buildTrialBalanceColumns,
  buildTrialBalanceExportSummary,
  buildTrialBalanceQuery,
  buildTrialBalanceSummaryCards,
  createTrialBalanceFieldConfigState,
  groupTrialBalanceRows,
  hasTrialBalancePeriodFilter,
} from "./trialBalanceHelpers";

describe("trialBalanceHelpers", () => {
  it("builds the report query from filters", () => {
    expect(
      buildTrialBalanceQuery({
        from: "2026-01-01",
        to: "2026-01-31",
        port: "1",
        accountType: "2",
      })
    ).toBe("startDate=2026-01-01&endDate=2026-01-31&portId=1&accountType=2");
  });

  it("creates field config state from saved config", () => {
    const state = createTrialBalanceFieldConfigState([
      { fieldKey: "balance_usd", visible: true, sortOrder: 2 },
      { fieldKey: "account_name", visible: true, sortOrder: 1 },
      { fieldKey: "profit_usd", visible: false, sortOrder: 3 },
    ]);

    expect(state.visibleColumns).toEqual(["account_name", "balance_usd"]);
    expect(state.fieldConfigMap.balance_usd.sortOrder).toBe(2);
  });

  it("groups rows by account type name", () => {
    expect(
      groupTrialBalanceRows([
        { AccountTypeName: "تجار", AccountID: 1 },
        { AccountTypeName: "تجار", AccountID: 2 },
        { AccountTypeName: null, AccountID: 3 },
      ])
    ).toEqual({
      تجار: [
        { AccountTypeName: "تجار", AccountID: 1 },
        { AccountTypeName: "تجار", AccountID: 2 },
      ],
      أخرى: [{ AccountTypeName: null, AccountID: 3 }],
    });
  });

  it("builds columns and summary helpers safely", () => {
    const columns = buildTrialBalanceColumns(["account_name", "balance_usd"], {
      balance_usd: { displayLabel: "الرصيد النهائي" },
    });

    expect(columns.map(column => column.key)).toEqual([
      "account_name",
      "balance_usd",
    ]);
    expect(columns[1].label).toBe("الرصيد النهائي");
    expect(hasTrialBalancePeriodFilter({ from: "", to: "" })).toBe(false);

    const summaryCards = buildTrialBalanceSummaryCards({
      account_count: 4,
      balance_usd: -1,
    });
    expect(summaryCards).toHaveLength(7);
    expect(summaryCards[0].valueClassName).toBe("text-[#eef3f7]");
    expect(summaryCards[4].valueClassName).toBe("text-[#c697a1]");

    expect(buildTrialBalanceExportSummary({ debit_usd: 20 })).toHaveLength(6);
  });
});

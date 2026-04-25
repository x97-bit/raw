import { describe, expect, it } from "vitest";
import {
  appendDebtNameOption,
  buildDebtAccountOptions,
  buildDebtExportColumns,
  buildDebtPreviewItems,
  buildDebtTotalsCards,
  formatDebtNumber,
} from "./debtsPageHelpers";

describe("debtsPageHelpers", () => {
  it("formats debt numbers consistently", () => {
    expect(formatDebtNumber(15000)).toBe("15,000");
    expect(formatDebtNumber(0)).toBe("0");
  });

  it("builds merged account options from accounts and debts", () => {
    expect(
      buildDebtAccountOptions(
        [
          { AccountID: 1, AccountName: "باسم" },
          { AccountID: 2, AccountName: "نعمان" },
        ],
        [{ AccountName: "باسم" }, { AccountName: "لؤي" }]
      )
    ).toEqual([
      { id: "باسم", name: "باسم" },
      { id: "نعمان", name: "نعمان" },
      { id: "لؤي", name: "لؤي" },
    ]);
  });

  it("appends new account names without duplicating normalized entries", () => {
    expect(
      appendDebtNameOption([{ AccountID: 1, AccountName: "باسم" }], "نعمان")
    ).toEqual([
      { id: 1, name: "باسم" },
      { id: "نعمان", name: "نعمان" },
    ]);
  });

  it("builds export columns and preview items from configured columns", () => {
    const previewColumns = [
      {
        key: "trans_date",
        dataKey: "TransDate",
        label: "التاريخ",
        render: value => value || "-",
      },
      {
        key: "notes",
        dataKey: "Notes",
        label: "ملاحظات",
        render: value => value || "",
      },
    ];

    expect(buildDebtExportColumns(previewColumns)).toEqual([
      { key: "TransDate", label: "التاريخ" },
      { key: "Notes", label: "ملاحظات" },
    ]);

    expect(
      buildDebtPreviewItems(
        {
          AccountName: "باسم",
          RemainingUSD: 40,
          RemainingIQD: 1000,
          PaidAmountUSD: 10,
          PaidAmountIQD: 0,
          State: "partial",
          TransDate: "2026-04-09",
          Notes: "ملاحظة",
        },
        previewColumns
      )
    ).toEqual([
      { key: "account_name", label: "اسم الحساب", value: "باسم" },
      { key: "remaining_usd", label: "المتبقي ($)", value: "$40" },
      { key: "remaining_iqd", label: "المتبقي (د.ع)", value: "1,000" },
      { key: "paid_usd", label: "المسدد ($)", value: "$10" },
      { key: "paid_iqd", label: "المسدد (د.ع)", value: "0" },
      { key: "status", label: "الحالة", value: "partial" },
      { key: "trans_date", label: "التاريخ", value: "2026-04-09" },
      { key: "notes", label: "ملاحظات", value: "ملاحظة" },
    ]);
  });

  it("builds totals cards with stable labels and tones", () => {
    expect(
      buildDebtTotalsCards({
        totalUSD: 100,
        totalIQD: 2000,
        paidUSD: 40,
        remainingUSD: 60,
        remainingIQD: 2000,
        count: 3,
      })
    ).toMatchObject([
      {
        key: "total_usd",
        label: "إجمالي الدولار",
        value: "$100",
        tone: "text-[#9ab6ca]",
      },
      {
        key: "total_iqd",
        label: "إجمالي الدينار",
        value: "2,000",
        tone: "text-[#eef3f7]",
      },
      {
        key: "paid_usd",
        label: "المسدد دولار",
        value: "$40",
        tone: "text-[#8eb8ad]",
      },
      {
        key: "remaining_usd",
        label: "المتبقي دولار",
        value: "$60",
        tone: "text-[#c697a1]",
      },
      {
        key: "remaining_iqd",
        label: "المتبقي دينار",
        value: "2,000",
        tone: "text-[#d1b58b]",
      },
      {
        key: "count",
        label: "عدد الحركات",
        value: "3",
        tone: "text-[#9aa8b7]",
      },
    ]);
  });
});

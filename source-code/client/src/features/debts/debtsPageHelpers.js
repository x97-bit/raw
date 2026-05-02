import { fmtNum, fmtUSD, fmtIQD } from "../../utils/formatNumber";
import { mergeUniqueDebtNames } from "../../utils/debtsConfig";

const DEBT_CARD_TONES = {
  usd: "text-[#9ab6ca]",
  iqd: "text-[#eef3f7]",
  paid: "text-[#8eb8ad]",
  remainingUsd: "text-[#c697a1]",
  remainingIqd: "text-[#d1b58b]",
  muted: "text-[#9aa8b7]",
};

export function formatDebtNumber(value) {
  return value ? Number(value).toLocaleString("en-US") : "0";
}

export function buildDebtAccountOptions(accounts = [], debts = []) {
  let combined = [];

  for (const account of accounts || []) {
    const label = account.name || account.AccountName || "";
    combined = mergeUniqueDebtNames(combined, label);
  }

  for (const debt of debts || []) {
    combined = mergeUniqueDebtNames(combined, debt.AccountName);
  }

  return combined;
}

export function appendDebtNameOption(accounts = [], label) {
  const normalizedAccounts = (accounts || []).map(item => ({
    id: item.id || item.AccountID || item.name || item.AccountName,
    name: item.name || item.AccountName || "",
  }));

  return mergeUniqueDebtNames(normalizedAccounts, label);
}

export function buildDebtExportColumns(columns = []) {
  return columns.map(column => ({ key: column.dataKey, label: column.label }));
}

export function buildDebtPreviewItems(selectedDebt, previewColumns = []) {
  if (!selectedDebt) {
    return [];
  }

  const items = [
    {
      key: "account_name",
      label: "اسم الحساب",
      value: selectedDebt.AccountName || "-",
    },
    {
      key: "remaining_usd",
      label: "المتبقي ($)",
      value: selectedDebt.RemainingUSD
        ? `$${formatDebtNumber(selectedDebt.RemainingUSD)}`
        : "$0",
    },
    {
      key: "remaining_iqd",
      label: "المتبقي (د.ع)",
      value: selectedDebt.RemainingIQD
        ? formatDebtNumber(selectedDebt.RemainingIQD)
        : "0",
    },
    {
      key: "paid_usd",
      label: "المسدد ($)",
      value: selectedDebt.PaidAmountUSD
        ? `$${formatDebtNumber(selectedDebt.PaidAmountUSD)}`
        : "$0",
    },
    {
      key: "paid_iqd",
      label: "المسدد (د.ع)",
      value: selectedDebt.PaidAmountIQD
        ? formatDebtNumber(selectedDebt.PaidAmountIQD)
        : "0",
    },
    { key: "status", label: "الحالة", value: selectedDebt.State || "-" },
  ];

  for (const column of previewColumns) {
    items.push({
      key: column.key,
      label: column.label,
      value: column.render(selectedDebt[column.dataKey]),
    });
  }

  return items.filter(
    (item, index, array) =>
      array.findIndex(candidate => candidate.key === item.key) === index
  );
}

export function buildDebtTotalsCards(totals = {}) {
  return [
    {
      key: "total_usd",
      label: "إجمالي الدولار",
      value: `$${formatDebtNumber(totals.totalUSD)}`,
      tone: DEBT_CARD_TONES.usd,
    },
    {
      key: "total_iqd",
      label: "إجمالي الدينار",
      value: formatDebtNumber(totals.totalIQD),
      tone: DEBT_CARD_TONES.iqd,
    },
    {
      key: "paid_usd",
      label: "المسدد دولار",
      value: `$${formatDebtNumber(totals.paidUSD)}`,
      tone: DEBT_CARD_TONES.paid,
    },
    {
      key: "remaining_usd",
      label: "المتبقي دولار",
      value: `$${formatDebtNumber(totals.remainingUSD)}`,
      tone: DEBT_CARD_TONES.remainingUsd,
    },
    {
      key: "remaining_iqd",
      label: "المتبقي دينار",
      value: formatDebtNumber(totals.remainingIQD),
      tone: DEBT_CARD_TONES.remainingIqd,
    },
    {
      key: "count",
      label: "عدد الحركات",
      value: formatDebtNumber(totals.count),
      tone: DEBT_CARD_TONES.muted,
    },
  ];
}

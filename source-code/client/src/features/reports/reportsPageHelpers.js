import { fmtNum, fmtUSD, fmtIQD } from "../../utils/formatNumber";
import {
  REPORT_PORTS,
  REPORT_SPECIAL_ACCOUNTS,
} from "../../utils/reportsConfig";

export function createEmptyTraderForm(overrides = {}) {
  return {
    AccountName: "",
    AccountTypeID: 1,
    DefaultCurrencyID: 1,
    ...overrides,
  };
}

export function buildTraderFormForPort(portId) {
  return createEmptyTraderForm({ DefaultPortID: portId });
}

export function getReportPortById(portId) {
  return REPORT_PORTS.find(entry => entry.id === portId) || null;
}

export function getReportSpecialAccountById(accountId) {
  return REPORT_SPECIAL_ACCOUNTS.find(entry => entry.id === accountId) || null;
}

export function buildReportRequestPath(action, portId, filters = {}) {
  const from = filters.from || "";
  const to = filters.to || "";

  if (action === "expenses") {
    return `/reports/expenses/${portId}?${new URLSearchParams({ from, to }).toString()}`;
  }

  if (action === "profits") {
    return `/reports/profits?${new URLSearchParams({ port: portId, from, to }).toString()}`;
  }

  return null;
}

export function buildSpecialAccountReportRequestPath(accountId, filters = {}) {
  const from = filters.from || "";
  const to = filters.to || "";

  if (accountId === "haider") {
    return `/special/haider?${new URLSearchParams({ from, to }).toString()}`;
  }

  return null;
}

export function formatReportNumber(value) {
  return value ? Number(value).toLocaleString("en-US") : "0";
}

export function formatReportDate(value) {
  return value?.split(" ")[0] || "-";
}

export function getProfitTone(value) {
  return (Number(value) || 0) >= 0
    ? "text-utility-success-text"
    : "text-utility-danger-text";
}

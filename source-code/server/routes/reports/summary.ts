import { Router } from "express";
import { registerReportDebtSummaryRoutes } from "./debtsSummary";
import { registerReportExpenseSummaryRoutes } from "./expensesSummary";

export function registerReportSummaryRoutes(router: Router) {
  registerReportDebtSummaryRoutes(router);
  registerReportExpenseSummaryRoutes(router);
}

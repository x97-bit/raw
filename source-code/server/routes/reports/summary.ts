import { Router } from "express";
import { registerReportDebtSummaryRoutes } from "./debtsSummary";
import { registerReportExpenseSummaryRoutes } from "./expensesSummary";
import { registerReportTrialBalanceRoutes } from "./trialBalance";

export function registerReportSummaryRoutes(router: Router) {
  registerReportDebtSummaryRoutes(router);
  registerReportTrialBalanceRoutes(router);
  registerReportExpenseSummaryRoutes(router);
}

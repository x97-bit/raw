import { Router } from "express";
import { registerReportAccountStatementRoutes } from "./accountStatement";
import { registerReportDashboardRoutes } from "./dashboard";
import { registerReportExpenseRoutes } from "./expenses";
import { registerReportProfitRoutes } from "./profits";

export function registerReportOverviewRoutes(router: Router) {
  registerReportDashboardRoutes(router);
  registerReportAccountStatementRoutes(router);
  registerReportExpenseRoutes(router);
  registerReportProfitRoutes(router);
}

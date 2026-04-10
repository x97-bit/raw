import { Router } from "express";
import { registerReportOverviewRoutes } from "./overview";
import { registerReportSummaryRoutes } from "./summary";

export function registerReportRoutes(router: Router) {
  registerReportOverviewRoutes(router);
  registerReportSummaryRoutes(router);
}

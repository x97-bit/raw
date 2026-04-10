import { Router } from "express";
import { registerPaymentMatchingDashboardRoutes } from "./dashboard";
import { registerPaymentMatchingListRoutes } from "./list";
import { registerPaymentMatchingShipmentRoutes } from "./shipments";
import { registerPaymentMatchingSummaryRoutes } from "./summary";

export function registerPaymentMatchingQueryRoutes(router: Router) {
  registerPaymentMatchingListRoutes(router);
  registerPaymentMatchingDashboardRoutes(router);
  registerPaymentMatchingShipmentRoutes(router);
  registerPaymentMatchingSummaryRoutes(router);
}

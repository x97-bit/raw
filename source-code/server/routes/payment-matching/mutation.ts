import { Router } from "express";
import { registerPaymentMatchingAllocationRoutes } from "./allocationRoutes";
import { registerPaymentMatchingAutoMatchRoutes } from "./autoMatch";

export function registerPaymentMatchingMutationRoutes(router: Router) {
  registerPaymentMatchingAutoMatchRoutes(router);
  registerPaymentMatchingAllocationRoutes(router);
}

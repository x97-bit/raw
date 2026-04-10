import { Router } from "express";
import { registerPaymentMatchingMutationRoutes } from "./mutation";
import { registerPaymentMatchingQueryRoutes } from "./query";

export function registerPaymentMatchingRoutes(router: Router) {
  registerPaymentMatchingQueryRoutes(router);
  registerPaymentMatchingMutationRoutes(router);
}

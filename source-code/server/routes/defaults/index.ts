import { Router } from "express";
import { registerAccountDefaultRoutes } from "./account";
import { registerRouteDefaultRoutes } from "./route";
import { registerTransactionFormDefaultRoutes } from "./transactionForm";

export function registerDefaultRoutes(router: Router) {
  registerTransactionFormDefaultRoutes(router);
  registerAccountDefaultRoutes(router);
  registerRouteDefaultRoutes(router);
}

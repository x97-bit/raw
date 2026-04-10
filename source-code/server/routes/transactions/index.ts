import { Router } from "express";
import { registerTransactionMutationRoutes } from "./mutation";
import { registerTransactionQueryRoutes } from "./query";

export function registerTransactionRoutes(router: Router) {
  registerTransactionQueryRoutes(router);
  registerTransactionMutationRoutes(router);
}

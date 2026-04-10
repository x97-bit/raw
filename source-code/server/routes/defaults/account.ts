import { Router } from "express";
import { registerAccountDefaultMutationRoutes } from "./accountMutation";
import { registerAccountDefaultReadRoutes } from "./accountRead";

export function registerAccountDefaultRoutes(router: Router) {
  registerAccountDefaultReadRoutes(router);
  registerAccountDefaultMutationRoutes(router);
}

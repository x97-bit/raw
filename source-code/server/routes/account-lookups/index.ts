import { Router } from "express";
import { registerAccountRoutes } from "./accounts";
import { registerReferenceLookupRoutes } from "./lookups";

export function registerAccountLookupRoutes(router: Router) {
  registerAccountRoutes(router);
  registerReferenceLookupRoutes(router);
}

import { Router } from "express";
import { registerRouteDefaultMutationRoutes } from "./routeMutation";
import { registerRouteDefaultReadRoutes } from "./routeRead";

export function registerRouteDefaultRoutes(router: Router) {
  registerRouteDefaultReadRoutes(router);
  registerRouteDefaultMutationRoutes(router);
}

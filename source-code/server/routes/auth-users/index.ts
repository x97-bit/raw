import { Router } from "express";
import { registerAuditLogRoutes } from "./auditLogs";
import { registerAuthRoutes } from "./auth";

export function registerAuthUserRoutes(router: Router) {
  registerAuthRoutes(router);
  registerAuditLogRoutes(router);
}

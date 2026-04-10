import { Router } from "express";
import { registerAuditLogRoutes } from "./auditLogs";
import { registerAuthRoutes } from "./auth";
import { registerUserManagementRoutes } from "./users";

export function registerAuthUserRoutes(router: Router) {
  registerAuthRoutes(router);
  registerAuditLogRoutes(router);
  registerUserManagementRoutes(router);
}

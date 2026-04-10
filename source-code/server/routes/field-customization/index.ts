import { Router } from "express";
import { registerCustomFieldRoutes } from "./customFields";
import { registerCustomFieldValueRoutes } from "./customFieldValues";
import { registerFieldConfigRoutes } from "./fieldConfig";

export function registerFieldCustomizationRoutes(router: Router) {
  registerFieldConfigRoutes(router);
  registerCustomFieldRoutes(router);
  registerCustomFieldValueRoutes(router);
}

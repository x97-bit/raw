import { Router } from "express";
import { registerReferenceLookupReadRoutes } from "./referenceRead";
import { registerReferenceLookupWriteRoutes } from "./referenceWrite";

export function registerReferenceLookupRoutes(router: Router) {
  registerReferenceLookupReadRoutes(router);
  registerReferenceLookupWriteRoutes(router);
}

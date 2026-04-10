import { Response } from "express";
import { RequestValidationError } from "./requestValidation";

const UNEXPECTED_ROUTE_ERROR_MESSAGE = "حدث خطأ غير متوقع";

export function respondRouteError(res: Response, error: unknown) {
  if (error instanceof RequestValidationError) {
    return res.status(400).json({ error: error.message, details: error.details });
  }

  return res.status(500).json({ error: UNEXPECTED_ROUTE_ERROR_MESSAGE });
}

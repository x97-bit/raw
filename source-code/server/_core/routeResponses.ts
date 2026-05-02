import { Response } from "express";
import { ZodError } from "zod";

const UNEXPECTED_ROUTE_ERROR_MESSAGE = "حدث خطأ غير متوقع";

export function respondRouteError(res: Response, error: unknown) {
  console.error("ROUTE ERROR:", error);
  if (error instanceof ZodError) {
    return res.status(400).json({ error: error.message });
  }

  if (error instanceof Error) {
    if ((error as any).status) {
      return res.status((error as any).status).json({ error: error.message });
    }
  }

  return res.status(500).json({ error: UNEXPECTED_ROUTE_ERROR_MESSAGE });
}

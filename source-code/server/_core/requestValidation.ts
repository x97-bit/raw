import { z, ZodType } from "zod";

export class RequestValidationError extends Error {
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "RequestValidationError";
    this.details = details;
  }
}

export function validateInput<T>(
  schema: ZodType<T>,
  payload: unknown,
  message: string
): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new RequestValidationError(message, z.treeifyError(result.error));
  }
  return result.data;
}

export function assertPositiveIntegerParam(
  value: unknown,
  label: string
): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new RequestValidationError(`${label} غير صالح`);
  }
  return parsed;
}

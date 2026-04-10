import { Response } from "express";
import { AuthRequest, isAdminUser } from "../../_core/appAuth";

export const FORBIDDEN_ERROR = "غير مصرح";
export const ACCOUNT_DEFAULTS_SAVED_MESSAGE = "تم حفظ افتراضيات التاجر";
export const ACCOUNT_DEFAULTS_DELETED_MESSAGE = "تم حذف افتراضيات التاجر";
export const ROUTE_DEFAULTS_SAVED_MESSAGE = "تم حفظ افتراضيات المسار";
export const ROUTE_DEFAULTS_DELETED_MESSAGE = "تم حذف افتراضيات المسار";

export function requireDefaultAdmin(req: AuthRequest, res: Response) {
  if (isAdminUser(req)) {
    return true;
  }

  res.status(403).json({ error: FORBIDDEN_ERROR });
  return false;
}

import { Response } from "express";
import { AuthRequest } from "../../_core/appAuth";
import { buildRequestCacheKey, createExpiringReadCache } from "../../_core/readCache";

export const ACCOUNT_EXISTS_MESSAGE = "الحساب موجود مسبقًا";
export const ACCOUNT_CREATED_MESSAGE = "تم إضافة الحساب";
export const ACCOUNT_UPDATED_MESSAGE = "تم تحديث الحساب";
export const ACCOUNT_DELETED_MESSAGE = "تم حذف الحساب";
export const COMPANY_NAME_REQUIRED = "اسم الشركة مطلوب";

const lookupReadCache = createExpiringReadCache({
  ttlMs: 30 * 1000,
  maxEntries: 250,
});

export function invalidateLookupReadCache() {
  lookupReadCache.clear();
}

export async function respondWithCachedLookup(
  req: AuthRequest,
  res: Response,
  cachePath: string,
  loader: () => Promise<unknown>,
) {
  const { hit, value } = await lookupReadCache.getOrLoad(
    buildRequestCacheKey(cachePath, req.query as Record<string, unknown>),
    loader,
  );

  res.setHeader("X-Cache", hit ? "HIT" : "MISS");
  return res.json(value);
}

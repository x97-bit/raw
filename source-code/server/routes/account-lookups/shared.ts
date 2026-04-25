import { Response } from "express";
import { AuthRequest } from "../../_core/appAuth";
import {
  buildRequestCacheKey,
  createExpiringReadCache,
} from "../../_core/readCache";

export const ACCOUNT_EXISTS_MESSAGE = "الحساب موجود مسبقًا";
export const ACCOUNT_CREATED_MESSAGE = "تم إضافة الحساب";
export const ACCOUNT_UPDATED_MESSAGE = "تم تحديث الحساب";
export const ACCOUNT_DELETED_MESSAGE = "تم حذف الحساب";
export const COMPANY_NAME_REQUIRED = "اسم الشركة مطلوب";

// Lookups are quasi-static — 5 minutes server-side cache is safe and dramatically
// reduces DB load when multiple clients open the port pages concurrently.
const LOOKUP_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const lookupReadCache = createExpiringReadCache({
  ttlMs: LOOKUP_CACHE_TTL_MS,
  maxEntries: 500,
});

export function invalidateLookupReadCache() {
  lookupReadCache.clear();
}

export async function respondWithCachedLookup(
  req: AuthRequest,
  res: Response,
  cachePath: string,
  loader: () => Promise<unknown>
) {
  const { hit, value } = await lookupReadCache.getOrLoad(
    buildRequestCacheKey(cachePath, req.query as Record<string, unknown>),
    loader
  );

  // Allow the browser (private) to cache lookup responses for 5 minutes.
  // This avoids re-fetching the same static data on every port page visit.
  res.setHeader(
    "Cache-Control",
    `private, max-age=${Math.floor(LOOKUP_CACHE_TTL_MS / 1000)}`
  );
  res.setHeader("X-Cache", hit ? "HIT" : "MISS");
  return res.json(value);
}

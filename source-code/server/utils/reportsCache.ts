import { createExpiringReadCache, buildRequestCacheKey } from "../_core/readCache";

// Cache for financial reports. Default TTL is 30 minutes, 
// but it is actively invalidated on any successful mutation in index.ts
export const financialReportsCache = createExpiringReadCache({
  ttlMs: 30 * 60 * 1000, 
  maxEntries: 100,
});

export { buildRequestCacheKey };

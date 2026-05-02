import { financialReportsCache, buildRequestCacheKey } from "../_core/redisCache";

// ============================================================================
// Financial Reports Cache (Updated)
// ============================================================================
// Now uses the distributed Redis-based cache from redisCache.ts
// Falls back to in-memory cache when Redis is unavailable.
// The cache is actively invalidated on any successful mutation.
// ============================================================================

export { financialReportsCache, buildRequestCacheKey };

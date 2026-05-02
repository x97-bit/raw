import { initRedisCache, closeRedisCache, isRedisAvailable } from "./redisCache";

// ============================================================================
// Cache Initialization Module
// ============================================================================
// Initializes Redis cache at server startup and provides graceful shutdown.
// If Redis is not available, the system falls back to in-memory caching.
// ============================================================================

let _initialized = false;

/**
 * Initialize the caching layer.
 * Call this once during server startup.
 */
export async function initCacheLayer(): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  const redisConnected = await initRedisCache();

  if (redisConnected) {
    console.info("[Cache] Redis cache layer initialized successfully.");
  } else {
    console.info("[Cache] Running with in-memory cache fallback.");
  }
}

/**
 * Get cache status for health checks.
 */
export function getCacheStatus(): { type: "redis" | "memory"; connected: boolean } {
  return {
    type: isRedisAvailable() ? "redis" : "memory",
    connected: isRedisAvailable(),
  };
}

/**
 * Gracefully shut down the cache layer.
 * Call this during server shutdown.
 */
export async function shutdownCacheLayer(): Promise<void> {
  await closeRedisCache();
  _initialized = false;
}

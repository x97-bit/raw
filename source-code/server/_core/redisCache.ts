import { createClient, type RedisClientType } from "redis";

// ============================================================================
// Redis-based Distributed Cache
// ============================================================================
// Replaces the in-memory readCache for production environments.
// Falls back to in-memory cache when Redis is unavailable.
// ============================================================================

type RedisCacheOptions = {
  ttlMs: number;
  prefix?: string;
  maxEntries?: number;
};

type CacheResult<T> = {
  hit: boolean;
  value: T;
};

let _redisClient: RedisClientType | null = null;
let _redisConnected = false;

/**
 * Initialize Redis connection. Call once at server startup.
 * If REDIS_URL is not set, the cache will fall back to in-memory mode.
 */
export async function initRedisCache(): Promise<boolean> {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.info("[Cache] REDIS_URL not set — using in-memory fallback.");
    return false;
  }

  try {
    _redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.warn("[Cache] Redis reconnect limit reached, giving up.");
            return new Error("Redis reconnect limit exceeded");
          }
          return Math.min(retries * 200, 3000);
        },
      },
    });

    _redisClient.on("error", (err) => {
      console.warn("[Cache] Redis error:", err.message);
      _redisConnected = false;
    });

    _redisClient.on("connect", () => {
      console.info("[Cache] Redis connected.");
      _redisConnected = true;
    });

    _redisClient.on("disconnect", () => {
      console.warn("[Cache] Redis disconnected.");
      _redisConnected = false;
    });

    await _redisClient.connect();
    _redisConnected = true;
    return true;
  } catch (error) {
    console.warn("[Cache] Failed to connect to Redis:", (error as Error).message);
    _redisClient = null;
    _redisConnected = false;
    return false;
  }
}

/**
 * Gracefully close Redis connection.
 */
export async function closeRedisCache(): Promise<void> {
  if (_redisClient) {
    try {
      await _redisClient.quit();
    } catch {
      // Ignore shutdown errors
    }
    _redisClient = null;
    _redisConnected = false;
  }
}

/**
 * Check if Redis is available and connected.
 */
export function isRedisAvailable(): boolean {
  return _redisConnected && _redisClient !== null;
}

// ============================================================================
// In-memory fallback (used when Redis is unavailable)
// ============================================================================

type MemoryEntry<T> = {
  value: T;
  expiresAt: number;
};

function createInMemoryFallback(options: RedisCacheOptions) {
  const store = new Map<string, MemoryEntry<unknown>>();
  const maxEntries = options.maxEntries ?? 200;

  function cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.expiresAt <= now) {
        store.delete(key);
      }
    }
  }

  function enforceSizeLimit() {
    while (store.size > maxEntries) {
      const oldestKey = store.keys().next().value;
      if (!oldestKey) break;
      store.delete(oldestKey);
    }
  }

  return {
    async getOrLoad<T>(key: string, loader: () => Promise<T>): Promise<CacheResult<T>> {
      cleanupExpired();
      const cached = store.get(key) as MemoryEntry<T> | undefined;
      if (cached && cached.expiresAt > Date.now()) {
        return { hit: true, value: cached.value };
      }
      const value = await loader();
      store.set(key, { value, expiresAt: Date.now() + options.ttlMs });
      enforceSizeLimit();
      return { hit: false, value };
    },
    async clear(): Promise<void> {
      store.clear();
    },
    async clearPattern(_pattern: string): Promise<void> {
      // In-memory fallback clears everything (no pattern support)
      store.clear();
    },
    async size(): Promise<number> {
      cleanupExpired();
      return store.size;
    },
  };
}

// ============================================================================
// Distributed Cache Factory
// ============================================================================

export function createDistributedCache(options: RedisCacheOptions) {
  const prefix = options.prefix ?? "alrawi:cache";
  const ttlSeconds = Math.ceil(options.ttlMs / 1000);
  const fallback = createInMemoryFallback(options);

  return {
    /**
     * Get cached value or load it using the provided loader function.
     * Automatically uses Redis when available, falls back to in-memory.
     */
    async getOrLoad<T>(key: string, loader: () => Promise<T>): Promise<CacheResult<T>> {
      const fullKey = `${prefix}:${key}`;

      // Use Redis if available
      if (isRedisAvailable() && _redisClient) {
        try {
          const cached = await _redisClient.get(fullKey);
          if (cached !== null) {
            return { hit: true, value: JSON.parse(cached) as T };
          }

          const value = await loader();
          // Store in Redis with TTL (non-blocking)
          _redisClient
            .setEx(fullKey, ttlSeconds, JSON.stringify(value))
            .catch(() => {/* ignore write errors */});
          return { hit: false, value };
        } catch {
          // Redis error — fall through to in-memory
        }
      }

      // Fallback to in-memory cache
      return fallback.getOrLoad(key, loader);
    },

    /**
     * Clear all cached entries (invalidate on mutation).
     */
    async clear(): Promise<void> {
      // Clear in-memory fallback
      await fallback.clear();

      // Clear Redis keys with this prefix
      if (isRedisAvailable() && _redisClient) {
        try {
          const keys = await _redisClient.keys(`${prefix}:*`);
          if (keys.length > 0) {
            await _redisClient.del(keys);
          }
        } catch {
          // Ignore Redis errors during clear
        }
      }
    },

    /**
     * Clear cached entries matching a specific pattern.
     * Useful for selective invalidation (e.g., clear only a specific account's cache).
     */
    async clearPattern(pattern: string): Promise<void> {
      await fallback.clearPattern(pattern);

      if (isRedisAvailable() && _redisClient) {
        try {
          const keys = await _redisClient.keys(`${prefix}:${pattern}`);
          if (keys.length > 0) {
            await _redisClient.del(keys);
          }
        } catch {
          // Ignore Redis errors
        }
      }
    },

    /**
     * Get current cache size (approximate for Redis).
     */
    async size(): Promise<number> {
      if (isRedisAvailable() && _redisClient) {
        try {
          const keys = await _redisClient.keys(`${prefix}:*`);
          return keys.length;
        } catch {
          return fallback.size();
        }
      }
      return fallback.size();
    },
  };
}

// ============================================================================
// Pre-configured cache instances for the application
// ============================================================================

/**
 * Financial reports cache — 30 minute TTL.
 * Used for account statements, transaction summaries, and balance calculations.
 */
export const financialReportsCache = createDistributedCache({
  ttlMs: 30 * 60 * 1000,
  prefix: "alrawi:reports",
  maxEntries: 500,
});

/**
 * Lookup data cache — 60 minute TTL.
 * Used for relatively static data like accounts, drivers, vehicles, companies.
 */
export const lookupDataCache = createDistributedCache({
  ttlMs: 60 * 60 * 1000,
  prefix: "alrawi:lookups",
  maxEntries: 200,
});

// ============================================================================
// Cache key builder (same interface as the old readCache)
// ============================================================================

export function buildRequestCacheKey(
  pathname: string,
  query: Record<string, unknown> = {}
) {
  const params = new URLSearchParams();

  for (const key of Object.keys(query).sort()) {
    const rawValue = query[key];
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      continue;
    }

    if (Array.isArray(rawValue)) {
      for (const entry of rawValue) {
        params.append(key, String(entry));
      }
      continue;
    }

    params.append(key, String(rawValue));
  }

  const suffix = params.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}

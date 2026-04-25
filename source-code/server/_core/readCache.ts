type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type ReadCacheOptions = {
  ttlMs: number;
  maxEntries?: number;
  now?: () => number;
};

function normalizeCacheValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(entry => normalizeCacheValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        normalizeCacheValue(entry),
      ])
    );
  }

  return value;
}

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

export function createExpiringReadCache(options: ReadCacheOptions) {
  const store = new Map<string, CacheEntry<unknown>>();
  const now = options.now ?? (() => Date.now());
  const maxEntries = options.maxEntries ?? 200;

  function cleanupExpired(currentTime: number) {
    for (const [key, entry] of store.entries()) {
      if (entry.expiresAt <= currentTime) {
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
    async getOrLoad<T>(key: string, loader: () => Promise<T>) {
      const currentTime = now();
      cleanupExpired(currentTime);

      const cached = store.get(key) as CacheEntry<T> | undefined;
      if (cached && cached.expiresAt > currentTime) {
        return {
          hit: true,
          value: normalizeCacheValue(cached.value) as T,
        };
      }

      const value = await loader();
      store.set(key, {
        value: normalizeCacheValue(value),
        expiresAt: currentTime + options.ttlMs,
      });
      enforceSizeLimit();

      return {
        hit: false,
        value: normalizeCacheValue(value) as T,
      };
    },
    clear() {
      store.clear();
    },
    size() {
      cleanupExpired(now());
      return store.size;
    },
  };
}

import type { Request, Response, NextFunction, RequestHandler } from "express";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  keyPrefix: string;
  windowMs: number;
  max: number;
  message: string;
  keyFn?: (req: Request) => string;
  now?: () => number;
};

type RateLimitCheckResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function resolveRateLimitClientIp(req: Request) {
  if (Array.isArray(req.ips) && req.ips.length > 0) {
    const trustedProxyIp = req.ips.find((entry) => typeof entry === "string" && entry.trim());
    if (trustedProxyIp) {
      return trustedProxyIp.trim();
    }
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function buildRateLimitGuard(options: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();
  const now = options.now ?? (() => Date.now());

  const cleanupExpired = (currentTime: number) => {
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= currentTime) {
        store.delete(key);
      }
    }
  };

  const check = (key: string): RateLimitCheckResult => {
    const currentTime = now();
    cleanupExpired(currentTime);

    const fullKey = `${options.keyPrefix}:${key}`;
    const existing = store.get(fullKey);

    if (!existing || existing.resetAt <= currentTime) {
      store.set(fullKey, {
        count: 1,
        resetAt: currentTime + options.windowMs,
      });

      return {
        allowed: true,
        remaining: Math.max(0, options.max - 1),
        retryAfterSeconds: Math.ceil(options.windowMs / 1000),
      };
    }

    existing.count += 1;
    store.set(fullKey, existing);

    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - currentTime) / 1000));
    return {
      allowed: existing.count <= options.max,
      remaining: Math.max(0, options.max - existing.count),
      retryAfterSeconds,
    };
  };

  const middleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const resolvedKey = options.keyFn?.(req) || resolveRateLimitClientIp(req);
    const result = check(resolvedKey);

    res.setHeader("X-RateLimit-Limit", String(options.max));
    res.setHeader("X-RateLimit-Remaining", String(result.remaining));
    res.setHeader("X-RateLimit-Reset", String(result.retryAfterSeconds));

    if (!result.allowed) {
      res.setHeader("Retry-After", String(result.retryAfterSeconds));
      return res.status(429).json({ error: options.message });
    }

    next();
  };

  return {
    middleware,
    check,
    reset: () => store.clear(),
  };
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
  return buildRateLimitGuard(options).middleware;
}

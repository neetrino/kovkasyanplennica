import { cacheService } from "@/lib/services/cache.service";

const pendingCacheFills = new Map<string, Promise<unknown>>();

/**
 * Cache async data in Redis with TTL. Falls through to fetcher when Redis is unavailable.
 */
export async function withRedisCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await cacheService.getJson<T>(key);
  if (cached !== null) {
    return cached;
  }

  const pending = pendingCacheFills.get(key) as Promise<T> | undefined;
  if (pending) {
    return pending;
  }

  const fill = (async () => {
    const fresh = await fetcher();
    await cacheService.setJson(key, fresh, ttlSeconds);
    return fresh;
  })();

  pendingCacheFills.set(key, fill);
  try {
    return await fill;
  } finally {
    pendingCacheFills.delete(key);
  }
}

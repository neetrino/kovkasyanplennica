import { cacheService } from "@/lib/services/cache.service";

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

  const fresh = await fetcher();
  await cacheService.setJson(key, fresh, ttlSeconds);
  return fresh;
}

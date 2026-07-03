import { cacheService } from "@/lib/services/cache.service";
import { REDIS_CACHE_PATTERNS } from "./redis-keys";

/**
 * Invalidate Redis caches after catalog changes.
 */
export async function invalidateCatalogRedisCache(): Promise<void> {
  if (!cacheService.isAvailable()) {
    await cacheService.get("__ping__");
  }
  if (!cacheService.isAvailable()) {
    return;
  }

  await Promise.all([
    cacheService.deletePattern(REDIS_CACHE_PATTERNS.products),
    cacheService.deletePattern(REDIS_CACHE_PATTERNS.productSlugs),
    cacheService.deletePattern(REDIS_CACHE_PATTERNS.categories),
    cacheService.deletePattern(REDIS_CACHE_PATTERNS.search),
    cacheService.deletePattern(REDIS_CACHE_PATTERNS.settings),
  ]);
}

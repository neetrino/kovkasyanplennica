import { cacheService } from "@/lib/services/cache.service";

const pendingCacheFills = new Map<string, Promise<unknown>>();

type MemoryCacheEntry = { value: unknown; expiresAt: number };

/** Process-local fallback when Redis is unavailable (common in local dev). */
const memoryCache = new Map<string, MemoryCacheEntry>();

function readMemoryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function writeMemoryCache<T>(key: string, value: T, ttlSeconds: number): void {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function invalidateMemoryCache(key: string): void {
  memoryCache.delete(key);
}

/**
 * Cache async data in Redis with TTL. Falls through to fetcher when Redis is unavailable.
 * Also keeps a short-lived in-process cache so dev without Redis avoids repeated Neon reads.
 */
export async function withRedisCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const memoryHit = readMemoryCache<T>(key);
  if (memoryHit !== null) {
    return memoryHit;
  }

  const cached = await cacheService.getJson<T>(key);
  if (cached !== null) {
    writeMemoryCache(key, cached, ttlSeconds);
    return cached;
  }

  const pending = pendingCacheFills.get(key) as Promise<T> | undefined;
  if (pending) {
    return pending;
  }

  const fill = (async () => {
    const fresh = await fetcher();
    writeMemoryCache(key, fresh, ttlSeconds);
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

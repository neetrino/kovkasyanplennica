/**
 * Resolves Redis connection URL from environment.
 * Supports REDIS_URL and Upstash's UPSTASH_REDIS_URL.
 */
export function resolveRedisUrl(): string | undefined {
  const url =
    process.env.REDIS_URL?.trim() ||
    process.env.UPSTASH_REDIS_URL?.trim() ||
    undefined;
  return url && url.length > 0 ? url : undefined;
}

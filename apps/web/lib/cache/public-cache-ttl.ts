/** Shared cache TTLs — aligned to reduce Neon wake-ups between idle traffic (e.g. 10-min monitors). */

/** Next.js ISR / unstable_cache revalidate (seconds). */
export const PUBLIC_PAGE_REVALIDATE_SECONDS = 3600;

/** Redis catalog cache TTL (seconds). */
export const CATALOG_REDIS_TTL_SECONDS = 3600;

/** Short-lived Redis TTL for frequently toggled settings (seconds). */
export const SETTINGS_REDIS_TTL_SECONDS = 600;

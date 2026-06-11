'use client';

/**
 * Previously prefetched `/`, `/products`, `/about` on every visit — each prefetch
 * could SSR and hit Neon even when the user never navigated there.
 */
export function CoreRoutePrefetch() {
  return null;
}

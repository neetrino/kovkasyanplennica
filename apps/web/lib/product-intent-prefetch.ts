import { getStoredLanguage } from './language';

type RouterWithPrefetch = {
  prefetch: (href: string) => void;
};

const warmedProductSlugs = new Set<string>();
const warmingProductSlugs = new Set<string>();

/**
 * Warms product route and API response on user intent (hover/touch/focus).
 */
export function prefetchProductByIntent(router: RouterWithPrefetch, slug: string): void {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return;
  }

  const encodedSlug = encodeURIComponent(normalizedSlug);
  router.prefetch(`/products/${encodedSlug}`);

  if (warmedProductSlugs.has(normalizedSlug) || warmingProductSlugs.has(normalizedSlug)) {
    return;
  }

  warmingProductSlugs.add(normalizedSlug);
  const lang = getStoredLanguage();
  const params = new URLSearchParams({ lang });

  void fetch(`/api/v1/products/${encodedSlug}?${params.toString()}`, {
    method: 'GET',
    credentials: 'same-origin',
    headers: { 'x-prefetch-intent': '1' },
  })
    .then(() => {
      warmedProductSlugs.add(normalizedSlug);
    })
    .catch(() => {
      // Network warmup is best-effort and should never block UI.
    })
    .finally(() => {
      warmingProductSlugs.delete(normalizedSlug);
    });
}

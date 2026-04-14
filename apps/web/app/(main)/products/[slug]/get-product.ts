import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { productsService } from '@/lib/services/products.service';

/**
 * Deduplicates product fetch between `generateMetadata` and the page in one request.
 */
const getCachedProductBySlug = unstable_cache(
  async (slug: string, lang: string) => {
    try {
      return await productsService.findBySlug(slug, lang);
    } catch {
      return null;
    }
  },
  ['pdp-product-by-slug'],
  { revalidate: 300, tags: ['products'] },
);

export const getProductForPage = cache(async (slug: string, lang = 'ru') => {
  try {
    return await getCachedProductBySlug(slug, lang);
  } catch {
    return null;
  }
});

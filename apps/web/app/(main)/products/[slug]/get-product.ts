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

async function getProductWithLanguageFallback(slug: string, lang: string) {
  const languagePriority = [lang, 'en', 'ru'];
  const seen = new Set<string>();

  for (const language of languagePriority) {
    if (seen.has(language)) continue;
    seen.add(language);

    try {
      const product = await getCachedProductBySlug(slug, language);
      if (product) {
        return product;
      }
    } catch {
      // Try the next language.
    }
  }

  return null;
}

export const getProductForPage = cache(async (slug: string, lang = 'ru') => {
  try {
    return await getProductWithLanguageFallback(slug, lang);
  } catch {
    return null;
  }
});

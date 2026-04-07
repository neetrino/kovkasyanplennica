import { cache } from 'react';
import { productsService } from '@/lib/services/products.service';

/**
 * Deduplicates product fetch between `generateMetadata` and the page in one request.
 */
export const getProductForPage = cache(async (slug: string, lang = 'ru') => {
  try {
    return await productsService.findBySlug(slug, lang);
  } catch {
    return null;
  }
});

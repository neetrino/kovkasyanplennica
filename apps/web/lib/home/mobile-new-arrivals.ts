import { unstable_cache } from 'next/cache';
import type { LanguageCode } from '@/lib/language';
import { productsService } from '@/lib/services/products.service';

export const NEW_ARRIVALS_LIMIT = 12;

const MOBILE_NEW_ARRIVALS_REVALIDATE_SECONDS = 120;

export type MobileNewArrivalProduct = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
  defaultVariantId: string | null;
  inStock: boolean;
  stock: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
};

async function loadNewArrivals(limit: number, lang: LanguageCode): Promise<MobileNewArrivalProduct[]> {
  try {
    const primary = await productsService.findAll({
      page: 1,
      limit,
      lang,
      filter: 'new',
    });
    let rows = primary.data && Array.isArray(primary.data) ? primary.data : [];
    if (rows.length === 0) {
      const latest = await productsService.findAll({ page: 1, limit, lang });
      rows = latest.data && Array.isArray(latest.data) ? latest.data : [];
    }
    return rows.map(
      (p: {
        id: unknown;
        slug?: unknown;
        title?: unknown;
        image?: string | null;
        price?: unknown;
        defaultVariantId?: string | null;
        stock?: unknown;
        inStock?: unknown;
        originalPrice?: number | null;
        compareAtPrice?: number | null;
      }) => ({
        id: String(p.id),
        slug: String(p.slug ?? ''),
        title: String(p.title ?? ''),
        image: p.image ?? null,
        price: typeof p.price === 'number' && !Number.isNaN(p.price) ? p.price : 0,
        defaultVariantId: p.defaultVariantId ?? null,
        stock: typeof p.stock === 'number' && !Number.isNaN(p.stock) ? p.stock : 0,
        inStock: Boolean(p.inStock),
        originalPrice: p.originalPrice ?? null,
        compareAtPrice: p.compareAtPrice ?? null,
      }),
    );
  } catch {
    return [];
  }
}

/**
 * Cached new-arrivals list for mobile home — aligns with home ISR window.
 */
export const getCachedNewArrivalsProducts = unstable_cache(
  async (lang: LanguageCode) => loadNewArrivals(NEW_ARRIVALS_LIMIT, lang),
  ['mobile-new-arrivals'],
  {
    revalidate: MOBILE_NEW_ARRIVALS_REVALIDATE_SECONDS,
    tags: ['mobile-new-arrivals'],
  },
);

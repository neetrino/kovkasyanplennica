import { cache } from 'react';
import type { RelatedProduct } from '@/components/hooks/useRelatedProducts';
import type { Review } from '@/components/ProductReviews/utils';
import { reviewsService } from '@/lib/services/reviews.service';
import { productsService } from '@/lib/services/products.service';
import { getProductForPage } from './get-product';

function mapRowToRelated(
  p: Record<string, unknown> & { id: string; slug?: string; title?: string; price?: number }
): RelatedProduct {
  return {
    id: String(p.id),
    slug: String(p.slug ?? ''),
    title: String(p.title ?? ''),
    price: typeof p.price === 'number' && !Number.isNaN(p.price) ? p.price : 0,
    originalPrice: (p.originalPrice as number | null | undefined) ?? null,
    compareAtPrice: (p.compareAtPrice as number | null | undefined) ?? null,
    discountPercent: (p.discountPercent as number | null | undefined) ?? null,
    image: (p.image as string | null | undefined) ?? null,
    inStock: Boolean(p.inStock),
    defaultVariantId: (p.defaultVariantId as string | null | undefined) ?? null,
    stock: typeof p.stock === 'number' ? p.stock : undefined,
    brand: (p.brand as RelatedProduct['brand']) ?? null,
    categories: (p.categories as RelatedProduct['categories']) ?? undefined,
    variants: (p.variants as RelatedProduct['variants']) ?? undefined,
  };
}

/**
 * Reviews + related for PDP — shares one `findBySlug` with `getProductForPage` via React `cache`.
 */
export const getPdpReviewsAndRelated = cache(
  async (slug: string, lang = 'ru'): Promise<{ reviews: Review[]; related: RelatedProduct[] }> => {
    const product = await getProductForPage(slug, lang);
    if (!product?.id) {
      return { reviews: [], related: [] };
    }

    const categorySlug = product.categories?.[0]?.slug;
    const [reviewsRaw, listResult] = await Promise.all([
      reviewsService.getProductReviews(product.id, { publishedOnly: true }),
      productsService.findAll({
        page: 1,
        limit: 30,
        lang,
        ...(categorySlug ? { category: categorySlug } : {}),
      }),
    ]);

    const rows = listResult.data && Array.isArray(listResult.data) ? listResult.data : [];
    const filtered = rows
      .filter((row: { id: string }) => row.id !== product.id)
      .slice(0, 10);

    const reviews: Review[] = reviewsRaw.map(
      (r: {
        id: string;
        userId: string;
        userName: string;
        rating: number;
        comment: string;
        createdAt: string;
      }) => ({
        id: r.id,
        userId: r.userId,
        userName: r.userName,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      }),
    );

    const related = filtered.map((row) => mapRowToRelated(row as Record<string, unknown> & { id: string }));

    return { reviews, related };
  },
);

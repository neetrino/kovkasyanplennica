import { Prisma } from "@prisma/client";
import { db } from "@white-shop/db";

const LISTING_FETCH_BUFFER = 20;
const MAX_LISTING_FETCH = 500;

/** Default shop listing: fetch limit + buffer, not limit × 10. */
export function listingRawFetchTake(limit: number): number {
  return Math.min(Math.max(limit, 1) + LISTING_FETCH_BUFFER, MAX_LISTING_FETCH);
}

const listingSelectShape = (lang: string) =>
  ({
    id: true,
    primaryCategoryId: true,
    categoryIds: true,
    brandId: true,
    discountPercent: true,
    media: true,
    createdAt: true,
    translations: {
      where: { locale: lang },
      take: 1,
      select: {
        slug: true,
        title: true,
        descriptionHtml: true,
      },
    },
    brand: {
      select: {
        id: true,
        translations: {
          where: { locale: lang },
          take: 1,
          select: { name: true },
        },
      },
    },
    categories: {
      select: {
        id: true,
        translations: {
          where: { locale: lang },
          take: 1,
          select: { slug: true, title: true },
        },
      },
    },
    labels: true,
    variants: {
      where: { published: true },
      orderBy: { price: "asc" as const },
      select: {
        id: true,
        price: true,
        stock: true,
        compareAtPrice: true,
      },
    },
  }) satisfies Prisma.ProductSelect;

export type ProductListingRow = Prisma.ProductGetPayload<{
  select: ReturnType<typeof listingSelectShape>;
}>;

/**
 * Lightweight product query for catalog cards (no variant options / productAttributes).
 */
export async function executeProductListingQuery(
  where: Prisma.ProductWhereInput,
  limit: number,
  lang: string
): Promise<ProductListingRow[]> {
  return db.product.findMany({
    where,
    select: listingSelectShape(lang),
    orderBy: { createdAt: "desc" },
    take: listingRawFetchTake(limit),
  });
}

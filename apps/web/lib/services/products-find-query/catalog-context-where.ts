import { Prisma } from "@prisma/client";
import { buildWhereClause } from "./query-builder";

export type CatalogContextParams = {
  lang?: string;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
};

/**
 * Listing-aligned product scope for filters / price-range APIs.
 * Excludes colors, sizes, brand, sort, pagination, and featured/bestseller filters.
 */
export async function buildCatalogContextWhere(
  params: CatalogContextParams
): Promise<Prisma.ProductWhereInput> {
  const { where } = await buildWhereClause({
    lang: params.lang ?? "en",
    category: params.category,
    search: params.search,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
  });

  if (where === null) {
    return {
      published: true,
      deletedAt: null,
      id: { in: [] },
    };
  }

  return where;
}

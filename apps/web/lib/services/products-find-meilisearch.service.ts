import type { Prisma } from "@prisma/client";
import { executeProductQuery } from "./products-find-query/query-executor";
import type { ProductFilters, ProductWithRelations } from "./products-find-query/types";
import { isMeilisearchConfigured } from "./search-index.service";
import { searchProducts } from "./search.service";

const MEILI_SEARCH_FETCH_CAP = 200;

/**
 * Try Meilisearch for text search; returns null to fall back to DB `contains` search.
 */
export async function tryFetchProductsViaMeilisearch(
  filters: ProductFilters
): Promise<ProductWithRelations[] | null> {
  const query = filters.search?.trim();
  if (!query || !isMeilisearchConfigured()) {
    return null;
  }

  try {
    const limit = Math.min(
      Math.max((filters.limit ?? 24) * 5, 50),
      MEILI_SEARCH_FETCH_CAP
    );
    const results = await searchProducts(query, {
      limit,
      filter: "published = true",
    });

    const ids = results.hits
      .map((hit) => (typeof hit.id === "string" ? hit.id : String(hit.id ?? "")))
      .filter((id) => id.length > 0);

    if (ids.length === 0) {
      return [];
    }

    const where: Prisma.ProductWhereInput = {
      id: { in: ids },
      published: true,
      deletedAt: null,
    };

    const products = await executeProductQuery(where, limit);
    const order = new Map(ids.map((id, index) => [id, index]));
    return [...products].sort(
      (a, b) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999)
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("⚠️ [PRODUCTS] Meilisearch unavailable, using DB search:", message);
    return null;
  }
}

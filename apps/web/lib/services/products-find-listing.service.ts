import { Prisma } from "@prisma/client";
import { hashCacheInput, productListKey } from "@/lib/cache/redis-keys";
import { CATALOG_REDIS_TTL_SECONDS } from "@/lib/cache/public-cache-ttl";
import { withRedisCache } from "@/lib/cache/with-redis-cache";
import { isMeilisearchConfigured } from "./search-index.service";
import { searchProducts } from "./search.service";
import { productsFindService } from "./products-find.service";
import { buildWhereClause } from "./products-find-query/query-builder";
import {
  executeProductListingQuery,
  type ProductListingRow,
} from "./products-find-query/listing-query-executor";
import { productsFindListingTransformService } from "./products-find-listing-transform.service";
import type { ProductFilters } from "./products-find-query/types";

const PRODUCTS_LIST_TTL_SECONDS = CATALOG_REDIS_TTL_SECONDS;
const MEILI_SEARCH_FETCH_CAP = 200;

function normalizeFilterList(value?: string): string[] {
  if (!value || typeof value !== "string") return [];
  const invalidTokens = new Set(["undefined", "null", ""]);
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => !invalidTokens.has(v.toLowerCase()));
}

/**
 * Filters that require full variant options / in-memory filtering.
 * Falls back to productsFindService.findAll when any are active.
 */
export function needsFullCatalogQuery(filters: ProductFilters): boolean {
  return (
    normalizeFilterList(filters.colors).length > 0 ||
    normalizeFilterList(filters.sizes).length > 0 ||
    normalizeFilterList(filters.brand).length > 0 ||
    filters.minPrice != null ||
    filters.maxPrice != null ||
    Boolean(filters.filter)
  );
}

function applyListingSort(
  products: ProductListingRow[],
  filters: ProductFilters
): ProductListingRow[] {
  const { sort = "createdAt" } = filters;
  const sorted = [...products];

  if (sort === "price" || sort === "price-desc") {
    sorted.sort((a, b) => {
      const aPrice = a.variants[0]?.price ?? 0;
      const bPrice = b.variants[0]?.price ?? 0;
      return bPrice - aPrice;
    });
    return sorted;
  }

  if (sort === "price-asc") {
    sorted.sort((a, b) => {
      const aPrice = a.variants[0]?.price ?? 0;
      const bPrice = b.variants[0]?.price ?? 0;
      return aPrice - bPrice;
    });
    return sorted;
  }

  if (sort === "name-asc") {
    sorted.sort((a, b) =>
      (a.translations[0]?.title || "").localeCompare(
        b.translations[0]?.title || ""
      )
    );
    return sorted;
  }

  if (sort === "name-desc") {
    sorted.sort((a, b) =>
      (b.translations[0]?.title || "").localeCompare(
        a.translations[0]?.title || ""
      )
    );
    return sorted;
  }

  sorted.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  return sorted;
}

async function tryFetchListingViaMeilisearch(
  filters: ProductFilters,
  lang: string
): Promise<ProductListingRow[] | null> {
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

    const products = await executeProductListingQuery(
      where,
      filters.limit ?? 24,
      lang
    );
    const order = new Map(ids.map((id, index) => [id, index]));
    return [...products].sort(
      (a, b) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999)
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      "⚠️ [PRODUCTS LISTING] Meilisearch unavailable, using DB search:",
      message
    );
    return null;
  }
}

class ProductsFindListingService {
  async findAllForListing(filters: ProductFilters) {
    if (needsFullCatalogQuery(filters)) {
      return productsFindService.findAll(filters);
    }

    const cacheKey = productListKey(`listing:${hashCacheInput(filters)}`);
    return withRedisCache(cacheKey, PRODUCTS_LIST_TTL_SECONDS, () =>
      this.findAllListingUncached(filters)
    );
  }

  private async findAllListingUncached(filters: ProductFilters) {
    const { page = 1, limit = 24, lang = "ru" } = filters;

    const meiliProducts = await tryFetchListingViaMeilisearch(filters, lang);

    let products: ProductListingRow[];

    if (meiliProducts !== null) {
      products = meiliProducts;
    } else {
      const { where } = await buildWhereClause(filters);
      if (where === null) {
        return {
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
        };
      }
      products = await executeProductListingQuery(where, limit, lang);
    }

    products = applyListingSort(products, filters);

    const total = products.length;
    const offset = (page - 1) * limit;
    const paginatedProducts = products.slice(offset, offset + limit);

    const data = await productsFindListingTransformService.transformListingProducts(
      paginatedProducts,
      lang
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const productsFindListingService = new ProductsFindListingService();

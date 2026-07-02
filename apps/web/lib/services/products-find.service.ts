import { hashCacheInput, productListKey } from "@/lib/cache/redis-keys";
import { CATALOG_REDIS_TTL_SECONDS } from "@/lib/cache/public-cache-ttl";
import { withRedisCache } from "@/lib/cache/with-redis-cache";
import { tryFetchProductsViaMeilisearch } from "./products-find-meilisearch.service";
import { ProductFilters } from "./products-find-query.service";
import { productsFindQueryService } from "./products-find-query.service";
import { productsFindFilterService } from "./products-find-filter.service";
import { productsFindTransformService } from "./products-find-transform.service";
import { canUseDbPagination } from "./products-find-query/query-builder";

const PRODUCTS_LIST_TTL_SECONDS = CATALOG_REDIS_TTL_SECONDS;

class ProductsFindService {
  /**
   * Get all products with filters
   */
  async findAll(filters: ProductFilters) {
    const cacheKey = productListKey(hashCacheInput(filters));
    return withRedisCache(cacheKey, PRODUCTS_LIST_TTL_SECONDS, () =>
      this.findAllUncached(filters)
    );
  }

  private async findAllUncached(filters: ProductFilters) {
    const {
      page = 1,
      limit = 24,
      lang = "en",
    } = filters;

    if (canUseDbPagination(filters)) {
      return this.findAllWithDbPagination(filters);
    }

    // Legacy Phase 5B path: limit×10 over-fetch + in-memory filter/sort/paginate
    const meiliProducts = await tryFetchProductsViaMeilisearch(filters);

    const { products, bestsellerProductIds } =
      meiliProducts !== null
        ? { products: meiliProducts, bestsellerProductIds: [] as string[] }
        : await productsFindQueryService.buildQueryAndFetch(filters);

    const filteredProducts = productsFindFilterService.filterProducts(
      products,
      filters,
      bestsellerProductIds
    );

    const total = filteredProducts.length;
    const offset = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    const data = await productsFindTransformService.transformProducts(
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

  /** Phase 5A: real DB skip/take + count for safe catalog requests. */
  private async findAllWithDbPagination(filters: ProductFilters) {
    const {
      page = 1,
      limit = 24,
      lang = "en",
    } = filters;

    const { products, total } =
      await productsFindQueryService.buildQueryAndFetchPaginated(filters);

    const data = await productsFindTransformService.transformProducts(
      products,
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

export const productsFindService = new ProductsFindService();











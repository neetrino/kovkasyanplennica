import {
  buildDbOrderBy,
  buildWhereClause,
} from "./products-find-query/query-builder";
import {
  countProducts,
  executePaginatedProductQuery,
  executeProductQuery,
} from "./products-find-query/query-executor";
import type { ProductFilters, ProductWithRelations } from "./products-find-query/types";

/**
 * Service for building and executing product find queries
 */
class ProductsFindQueryService {
  /**
   * Phase 5A: DB-level pagination for safe catalog requests.
   */
  async buildQueryAndFetchPaginated(filters: ProductFilters): Promise<{
    products: ProductWithRelations[];
    total: number;
  }> {
    const { page = 1, limit = 24 } = filters;
    const { where } = await buildWhereClause(filters);

    if (where === null) {
      return {
        products: [],
        total: 0,
      };
    }

    const skip = (page - 1) * limit;
    const orderBy = buildDbOrderBy(filters.sort);

    const [products, total] = await Promise.all([
      executePaginatedProductQuery(where, { skip, take: limit, orderBy }),
      countProducts(where),
    ]);

    return {
      products,
      total,
    };
  }

  /**
   * Build where clause and fetch products from database
   */
  async buildQueryAndFetch(filters: ProductFilters): Promise<{
    products: ProductWithRelations[];
    bestsellerProductIds: string[];
  }> {
    const { limit = 24 } = filters;

    // Build where clause
    const { where, bestsellerProductIds } = await buildWhereClause(filters);

    // If where is null (category not found), return empty result
    if (where === null) {
      return {
        products: [],
        bestsellerProductIds: [],
      };
    }

    // Legacy Phase 5B path: over-fetch for in-memory filter/sort/paginate
    const products = await executeProductQuery(where, limit);

    return {
      products,
      bestsellerProductIds,
    };
  }
}

export const productsFindQueryService = new ProductsFindQueryService();
export type { ProductFilters, ProductWithRelations };

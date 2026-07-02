import { Prisma } from "@prisma/client";
import { db } from "@white-shop/db";
import { logger } from "../../utils/logger";
import { isMeilisearchConfigured } from "../search-index.service";
import type { ProductFilters } from "./types";
import { getAllChildCategoryIds, findCategoryBySlug } from "./category-utils";

/** Sort values expressible safely in Prisma for Phase 5A DB pagination. */
const DB_PAGINATION_SORTS = new Set([
  undefined,
  "",
  "createdAt",
  "createdAt-desc",
  "createdAt-asc",
]);

/**
 * Phase 5A/5B: true only for requests that skip in-memory filter/sort/paginate.
 * Colors, sizes, bestseller ranking, price sort, and Meilisearch text search
 * stay on the legacy over-fetch path.
 */
export function canUseDbPagination(filters: ProductFilters): boolean {
  const { colors, sizes, filter, sort, search } = filters;

  if (colors?.trim()) return false;
  if (sizes?.trim()) return false;
  if (filter === "bestseller") return false;
  if (search?.trim() && isMeilisearchConfigured()) return false;
  if (!DB_PAGINATION_SORTS.has(sort)) return false;

  return true;
}

const INVALID_FILTER_TOKENS = new Set(["undefined", "null", ""]);

/** Comma-separated brand IDs (matches in-memory filter semantics). */
function parseBrandIds(brand?: string): string[] {
  if (!brand || typeof brand !== "string") return [];

  return brand
    .split(",")
    .map((value) => value.trim())
    .filter((value) => !INVALID_FILTER_TOKENS.has(value.toLowerCase()));
}

function buildBrandFilter(brand?: string): Prisma.ProductWhereInput | null {
  const brandIds = parseBrandIds(brand);
  if (brandIds.length === 0) return null;

  if (brandIds.length === 1) {
    return { brandId: brandIds[0] };
  }

  return { brandId: { in: brandIds } };
}

/**
 * Matches in-memory price filter: product passes when the minimum published
 * variant price is within [minPrice, maxPrice] (raw variant.price, no discounts).
 */
function buildPriceFilter(
  minPrice?: number,
  maxPrice?: number
): Prisma.ProductWhereInput | null {
  const hasMin = typeof minPrice === "number" && !Number.isNaN(minPrice);
  const hasMax = typeof maxPrice === "number" && !Number.isNaN(maxPrice);
  if (!hasMin && !hasMax) return null;

  const conditions: Prisma.ProductWhereInput[] = [
    { variants: { some: { published: true } } },
  ];

  if (hasMin) {
    conditions.push({
      variants: {
        none: {
          published: true,
          price: { lt: minPrice },
        },
      },
    });
  }

  if (hasMax) {
    conditions.push({
      variants: {
        some: {
          published: true,
          price: { lte: maxPrice },
        },
      },
    });
  }

  return conditions.length === 1 ? conditions[0] : { AND: conditions };
}

/** Maps safe API sort params to Prisma orderBy (default matches legacy createdAt desc). */
export function buildDbOrderBy(
  sort?: string
): Prisma.ProductOrderByWithRelationInput {
  if (sort === "createdAt-asc") {
    return { createdAt: "asc" };
  }
  return { createdAt: "desc" };
}

/**
 * Build search filter for where clause
 */
function buildSearchFilter(search: string): Prisma.ProductWhereInput {
  return {
    OR: [
      {
        translations: {
          some: {
            title: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        },
      },
      {
        translations: {
          some: {
            subtitle: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        },
      },
      {
        variants: {
          some: {
            sku: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        },
      },
    ],
  };
}

/**
 * Build category filter for where clause
 */
async function buildCategoryFilter(
  category: string,
  lang: string,
  existingWhere: Prisma.ProductWhereInput
): Promise<Prisma.ProductWhereInput | null> {
  const categoryDoc = await findCategoryBySlug(category, lang);

  if (!categoryDoc) {
    return null; // Category not found - return null to indicate empty result
  }

  // Get all child categories (subcategories) recursively
  const childCategoryIds = await getAllChildCategoryIds(categoryDoc.id);
  const allCategoryIds = [categoryDoc.id, ...childCategoryIds];
  
  logger.debug('Category IDs to include', {
    parent: categoryDoc.id,
    children: childCategoryIds,
    total: allCategoryIds.length
  });
  
  // Build OR conditions for all categories (parent + children)
  const categoryConditions = allCategoryIds.flatMap((catId: string) => [
    { primaryCategoryId: catId },
    { categoryIds: { has: catId } },
  ]);
  
  if (existingWhere.OR) {
    return {
      AND: [
        { OR: existingWhere.OR },
        {
          OR: categoryConditions,
        },
      ],
    };
  }
  
  return {
    OR: categoryConditions,
  };
}

/**
 * Build filter for new, featured, bestseller
 */
async function buildFilterFilter(
  filter: string,
  existingWhere: Prisma.ProductWhereInput
): Promise<{
  where: Prisma.ProductWhereInput;
  bestsellerProductIds: string[];
}> {
  const bestsellerProductIds: string[] = [];

  if (filter === "new") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return {
      where: {
        ...existingWhere,
        createdAt: { gte: thirtyDaysAgo },
      },
      bestsellerProductIds,
    };
  }

  if (filter === "featured") {
    return {
      where: {
        ...existingWhere,
        featured: true,
      },
      bestsellerProductIds,
    };
  }

  if (filter === "bestseller") {
    const bestsellerVariants = await db.orderItem.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
      where: {
        variantId: {
          not: null,
        },
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 200,
    });

    const variantIds = bestsellerVariants
      .map((item) => item.variantId)
      .filter((id): id is string => Boolean(id));

    if (variantIds.length > 0) {
      const variantProductMap = await db.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, productId: true },
      });

      const variantToProduct = new Map<string, string>();
      variantProductMap.forEach(({ id, productId }: { id: string; productId: string }) => {
        variantToProduct.set(id, productId);
      });

      const productSales = new Map<string, number>();
      bestsellerVariants.forEach((item) => {
        const variantId = item.variantId;
        if (!variantId) return;
        const productId = variantToProduct.get(variantId);
        if (!productId) return;
        const qty = item._sum?.quantity || 0;
        productSales.set(productId, (productSales.get(productId) || 0) + qty);
      });

      bestsellerProductIds.push(
        ...Array.from(productSales.entries())
          .sort((a, b) => (b[1] || 0) - (a[1] || 0))
          .map(([productId]) => productId)
      );

      if (bestsellerProductIds.length > 0) {
        return {
          where: {
            ...existingWhere,
            id: {
              in: bestsellerProductIds,
            },
          },
          bestsellerProductIds,
        };
      }
    }
  }

  return {
    where: existingWhere,
    bestsellerProductIds,
  };
}

/**
 * Build where clause for product query
 */
export async function buildWhereClause(
  filters: ProductFilters
): Promise<{
  where: Prisma.ProductWhereInput | null;
  bestsellerProductIds: string[];
}> {
  const {
    category,
    search,
    filter,
    minPrice,
    maxPrice,
    brand,
    lang = "en",
  } = filters;

  const bestsellerProductIds: string[] = [];

  // Build base where clause
  let where: Prisma.ProductWhereInput = {
    published: true,
    deletedAt: null,
  };

  // Add search filter
  if (search && search.trim()) {
    const searchFilter = buildSearchFilter(search);
    where = { ...where, ...searchFilter };
  }

  // Add category filter
  if (category) {
    const categoryWhere = await buildCategoryFilter(category, lang, where);
    if (categoryWhere === null) {
      // Category not found - return empty result
      return {
        where: null,
        bestsellerProductIds: [],
      };
    }
    where = { ...where, ...categoryWhere };
  }

  // Add filter for new, featured, bestseller
  const filterResult = await buildFilterFilter(filter || "", where);
  where = filterResult.where;
  bestsellerProductIds.push(...filterResult.bestsellerProductIds);

  const extraConditions: Prisma.ProductWhereInput[] = [];
  const brandFilter = buildBrandFilter(brand);
  if (brandFilter) extraConditions.push(brandFilter);

  const priceFilter = buildPriceFilter(minPrice, maxPrice);
  if (priceFilter) extraConditions.push(priceFilter);

  if (extraConditions.length > 0) {
    where = { AND: [where, ...extraConditions] };
  }

  logger.debug('Fetching products with where clause', { where: JSON.stringify(where, null, 2) });

  return {
    where,
    bestsellerProductIds,
  };
}


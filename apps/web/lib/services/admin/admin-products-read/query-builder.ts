import { Prisma } from "@prisma/client";
import type { ProductFilters } from "./types";

/**
 * Build where clause for product queries
 */
export function buildProductWhereClause(filters: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
  };

  const orConditions: Prisma.ProductWhereInput[] = [];

  // Search filter
  if (filters.search) {
    orConditions.push(
      {
        translations: {
          some: {
            title: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        variants: {
          some: {
            sku: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
      }
    );
  }

  // Category filter - support both single category and multiple categories
  const categoryIds = filters.categories && filters.categories.length > 0 
    ? filters.categories 
    : filters.category 
      ? [filters.category] 
      : [];
  
  if (categoryIds.length > 0) {
    const categoryConditions: Prisma.ProductWhereInput[] = [];
    categoryIds.forEach((categoryId) => {
      categoryConditions.push(
        {
          primaryCategoryId: categoryId,
        },
        {
          categoryIds: {
            has: categoryId,
          },
        }
      );
    });
    orConditions.push(...categoryConditions);
  }

  if (orConditions.length > 0) {
    where.OR = orConditions;
  }

  const andConditions: Prisma.ProductWhereInput[] = [];

  if (filters.sku) {
    andConditions.push({
      variants: {
        some: {
          sku: {
            contains: filters.sku,
            mode: "insensitive",
          },
        },
      },
    });
  }

  if (filters.stock === 'in_stock') {
    andConditions.push({
      variants: {
        some: {
          published: true,
          stock: { gt: 0 },
        },
      },
    });
  } else if (filters.stock === 'out_of_stock') {
    andConditions.push({
      variants: {
        none: {
          published: true,
          stock: { gt: 0 },
        },
      },
    });
  }

  if (andConditions.length > 0) {
    where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), ...andConditions];
  }

  return where;
}

/**
 * Build orderBy clause for product queries
 */
export function buildProductOrderByClause(filters: ProductFilters): Prisma.ProductOrderByWithRelationInput {
  if (filters.sort) {
    const [field, direction] = filters.sort.split("-");
    return { [field]: direction || "desc" };
  }
  return { createdAt: "desc" };
}









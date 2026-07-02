import { Prisma } from "@prisma/client";
import { db } from "@white-shop/db";
import { ensureProductVariantAttributesColumn } from "../../utils/db-ensure";
import { logger } from "../../utils/logger";
import { asProductWithRelations, type ProductWithRelations } from "./types";

/** Hard cap so a misconfigured `limit` cannot trigger massive `findMany` (e.g. shop page ×10 multiplier). */
const MAX_PRODUCTS_RAW_FETCH = 4000;

function rawFetchTake(limit: number): number {
  return Math.min(Math.max(limit, 1) * 10, MAX_PRODUCTS_RAW_FETCH);
}

export interface PaginatedProductQueryOptions {
  skip: number;
  take: number;
  orderBy: Prisma.ProductOrderByWithRelationInput;
}

/** Phase 5A: accurate total for DB-paginated catalog requests. */
export async function countProducts(
  where: Prisma.ProductWhereInput
): Promise<number> {
  return db.product.count({ where });
}

/**
 * Base include configuration for product queries
 */
const getBaseInclude = () => ({
  translations: true,
  brand: {
    include: {
      translations: true,
    },
  },
  variants: {
    where: {
      published: true,
    },
    include: {
      options: {
        include: {
          attributeValue: {
            include: {
              attribute: true,
              translations: true,
            },
          },
        },
      },
    },
  },
  labels: true,
  categories: {
    include: {
      translations: true,
    },
  },
});

/**
 * Base include without attributeValue relation (fallback)
 */
const getBaseIncludeWithoutAttributeValue = () => ({
  ...getBaseInclude(),
  variants: {
    where: {
      published: true,
    },
    include: {
      options: true, // Include options without attributeValue relation
    },
  },
});

/**
 * ProductAttributes include configuration
 */
const getProductAttributesInclude = () => ({
  productAttributes: {
    include: {
      attribute: {
        include: {
          translations: true,
          values: {
            include: {
              translations: true,
            },
          },
        },
      },
    },
  },
});

/**
 * Check if error is related to product_attributes table
 */
function isProductAttributesError(error: unknown): boolean {
  const errorObj = error as { code?: string; message?: string };
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (errorObj && typeof errorObj === 'object' && 'code' in errorObj && errorObj.code === 'P2021') || 
         errorMessage.includes('product_attributes') || 
         errorMessage.includes('does not exist');
}

/**
 * Check if error is related to product_variants.attributes column
 */
function isVariantAttributesError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return errorMessage.includes('product_variants.attributes') || 
         (errorMessage.includes('attributes') && errorMessage.includes('does not exist'));
}

/**
 * Check if error is related to attribute_values.colors column
 */
function isAttributeValuesColorsError(error: unknown): boolean {
  const errorObj = error as { code?: string; message?: string };
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (errorObj && typeof errorObj === 'object' && 'code' in errorObj && errorObj.code === 'P2022') || 
         errorMessage.includes('attribute_values.colors') || 
         errorMessage.includes('does not exist');
}

type ProductFindManyArgs = {
  where: Prisma.ProductWhereInput;
  include: ReturnType<typeof getBaseInclude> &
    Partial<ReturnType<typeof getProductAttributesInclude>>;
  skip: number;
  take: number;
  orderBy?: Prisma.ProductOrderByWithRelationInput;
};

function buildFindManyQuery({
  where,
  include,
  skip,
  take,
  orderBy,
}: ProductFindManyArgs) {
  return {
    where,
    include,
    skip,
    take,
    ...(orderBy ? { orderBy } : {}),
  };
}

/**
 * Phase 5A: DB-level skip/take for safe catalog requests (no limit×10 over-fetch).
 */
export async function executePaginatedProductQuery(
  where: Prisma.ProductWhereInput,
  options: PaginatedProductQueryOptions
): Promise<ProductWithRelations[]> {
  const baseInclude = getBaseInclude();
  const queryArgs = buildFindManyQuery({
    where,
    include: {
      ...baseInclude,
      ...getProductAttributesInclude(),
    },
    skip: options.skip,
    take: options.take,
    orderBy: options.orderBy,
  });

  try {
    const products = await db.product.findMany(queryArgs);
    logger.info(
      `Found ${products.length} paginated products from database (with productAttributes)`
    );
    return products as ProductWithRelations[];
  } catch (error: unknown) {
    if (isProductAttributesError(error)) {
      logger.warn(
        "product_attributes table not found, fetching paginated without it",
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );
      return executePaginatedWithoutProductAttributes(where, options);
    }

    if (isVariantAttributesError(error)) {
      logger.warn(
        "product_variants.attributes column not found, attempting to create it"
      );
      try {
        await ensureProductVariantAttributesColumn();
        const products = await db.product.findMany(
          buildFindManyQuery({
            where,
            include: baseInclude,
            skip: options.skip,
            take: options.take,
            orderBy: options.orderBy,
          })
        );
        logger.info(
          `Found ${products.length} paginated products from database (after creating attributes column)`
        );
        return products as ProductWithRelations[];
      } catch (attributesError: unknown) {
        return handlePaginatedAttributesError(
          attributesError,
          where,
          options
        );
      }
    }

    if (isAttributeValuesColorsError(error)) {
      logger.warn(
        "attribute_values.colors column not found, fetching paginated without attributeValue",
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );
      return executePaginatedWithoutAttributeValue(where, options);
    }

    throw error;
  }
}

async function executePaginatedWithoutProductAttributes(
  where: Prisma.ProductWhereInput,
  options: PaginatedProductQueryOptions
): Promise<ProductWithRelations[]> {
  const baseInclude = getBaseInclude();
  const queryArgs = buildFindManyQuery({
    where,
    include: baseInclude,
    skip: options.skip,
    take: options.take,
    orderBy: options.orderBy,
  });

  try {
    const products = await db.product.findMany(queryArgs);
    logger.info(
      `Found ${products.length} paginated products from database (without productAttributes)`
    );
    return products as ProductWithRelations[];
  } catch (retryError: unknown) {
    if (isVariantAttributesError(retryError)) {
      logger.warn(
        "product_variants.attributes column not found, attempting to create it"
      );
      try {
        await ensureProductVariantAttributesColumn();
        const products = await db.product.findMany(queryArgs);
        logger.info(
          `Found ${products.length} paginated products from database (after creating attributes column)`
        );
        return products as ProductWithRelations[];
      } catch (attributesError: unknown) {
        return handlePaginatedAttributesError(
          attributesError,
          where,
          options
        );
      }
    }

    if (isAttributeValuesColorsError(retryError)) {
      logger.warn(
        "attribute_values.colors column not found, fetching paginated without attributeValue",
        {
          error: retryError instanceof Error
            ? retryError.message
            : String(retryError),
        }
      );
      return executePaginatedWithoutAttributeValue(where, options);
    }

    throw retryError;
  }
}

async function handlePaginatedAttributesError(
  error: unknown,
  where: Prisma.ProductWhereInput,
  options: PaginatedProductQueryOptions
): Promise<ProductWithRelations[]> {
  if (isAttributeValuesColorsError(error)) {
    logger.warn(
      "attribute_values.colors column not found, fetching paginated without attributeValue",
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
    return executePaginatedWithoutAttributeValue(where, options);
  }
  throw error;
}

async function executePaginatedWithoutAttributeValue(
  where: Prisma.ProductWhereInput,
  options: PaginatedProductQueryOptions
): Promise<ProductWithRelations[]> {
  const baseIncludeWithoutAttributeValue = getBaseIncludeWithoutAttributeValue();
  const queryArgsWithAttrs = buildFindManyQuery({
    where,
    include: {
      ...baseIncludeWithoutAttributeValue,
      ...getProductAttributesInclude(),
    },
    skip: options.skip,
    take: options.take,
    orderBy: options.orderBy,
  });

  try {
    const products = await db.product.findMany(queryArgsWithAttrs);
    logger.info(
      `Found ${products.length} paginated products from database (without attributeValue, with productAttributes)`
    );
    return asProductWithRelations(products);
  } catch (productAttrError: unknown) {
    if (isProductAttributesError(productAttrError)) {
      const products = await db.product.findMany(
        buildFindManyQuery({
          where,
          include: baseIncludeWithoutAttributeValue,
          skip: options.skip,
          take: options.take,
          orderBy: options.orderBy,
        })
      );
      logger.info(
        `Found ${products.length} paginated products from database (without attributeValue and productAttributes)`
      );
      return asProductWithRelations(products);
    }
    throw productAttrError;
  }
}

/**
 * Execute product query with comprehensive error handling.
 * Legacy Phase 5B path: over-fetches limit×10 rows for in-memory filter/sort/paginate.
 */
export async function executeProductQuery(
  where: Prisma.ProductWhereInput,
  limit: number
): Promise<ProductWithRelations[]> {
  const baseInclude = getBaseInclude();
  const take = rawFetchTake(limit);

  try {
    const products = await db.product.findMany(
      buildFindManyQuery({
        where,
        include: {
          ...baseInclude,
          ...getProductAttributesInclude(),
        },
        skip: 0,
        take,
      })
    );
    logger.info(`Found ${products.length} products from database (with productAttributes)`);
    return products as ProductWithRelations[];
  } catch (error: unknown) {
    // If productAttributes table doesn't exist, retry without it
    if (isProductAttributesError(error)) {
      logger.warn('product_attributes table not found, fetching without it', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return executeWithoutProductAttributes(where, limit);
    }

    if (isVariantAttributesError(error)) {
      logger.warn('product_variants.attributes column not found, attempting to create it');
      try {
        await ensureProductVariantAttributesColumn();
        const products = await db.product.findMany({
          where,
          include: baseInclude,
          skip: 0,
          take,
        });
        logger.info(`Found ${products.length} products from database (after creating attributes column)`);
        return products as ProductWithRelations[];
      } catch (attributesError: unknown) {
        return handleAttributesError(attributesError, where, limit);
      }
    }

    if (isAttributeValuesColorsError(error)) {
      logger.warn('attribute_values.colors column not found, fetching without attributeValue', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return executeWithoutAttributeValue(where, limit);
    }

    throw error;
  }
}

/**
 * Execute query without productAttributes (fallback)
 */
async function executeWithoutProductAttributes(
  where: Prisma.ProductWhereInput,
  limit: number
): Promise<ProductWithRelations[]> {
  const baseInclude = getBaseInclude();
  const take = rawFetchTake(limit);

  try {
    const products = await db.product.findMany({
      where,
      include: baseInclude,
      skip: 0,
      take,
    });
    logger.info(`Found ${products.length} products from database (without productAttributes)`);
    return products as ProductWithRelations[];
  } catch (retryError: unknown) {
    if (isVariantAttributesError(retryError)) {
      logger.warn('product_variants.attributes column not found, attempting to create it');
      try {
        await ensureProductVariantAttributesColumn();
        const products = await db.product.findMany({
          where,
          include: baseInclude,
          skip: 0,
          take,
        });
        logger.info(`Found ${products.length} products from database (after creating attributes column)`);
        return products as ProductWithRelations[];
      } catch (attributesError: unknown) {
        return handleAttributesError(attributesError, where, limit);
      }
    }

    if (isAttributeValuesColorsError(retryError)) {
      logger.warn('attribute_values.colors column not found, fetching without attributeValue', { 
        error: retryError instanceof Error ? retryError.message : String(retryError) 
      });
      return executeWithoutAttributeValue(where, limit);
    }

    throw retryError;
  }
}

/**
 * Handle attributes-related errors
 */
async function handleAttributesError(
  error: unknown,
  where: Prisma.ProductWhereInput,
  limit: number
): Promise<ProductWithRelations[]> {
  if (isAttributeValuesColorsError(error)) {
    logger.warn('attribute_values.colors column not found, fetching without attributeValue', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return executeWithoutAttributeValue(where, limit);
  }
  throw error;
}

/**
 * Execute query without attributeValue relation (fallback)
 */
async function executeWithoutAttributeValue(
  where: Prisma.ProductWhereInput,
  limit: number
): Promise<ProductWithRelations[]> {
  const baseIncludeWithoutAttributeValue = getBaseIncludeWithoutAttributeValue();
  const take = rawFetchTake(limit);

  // Try to include productAttributes even in fallback
  try {
    const products = await db.product.findMany({
      where,
      include: {
        ...baseIncludeWithoutAttributeValue,
        ...getProductAttributesInclude(),
      },
      skip: 0,
      take,
    });
    logger.info(`Found ${products.length} products from database (without attributeValue, with productAttributes)`);
    return asProductWithRelations(products);
  } catch (productAttrError: unknown) {
    // If productAttributes also fails, try without it
    if (isProductAttributesError(productAttrError)) {
      const products = await db.product.findMany({
        where,
        include: baseIncludeWithoutAttributeValue,
        skip: 0,
        take,
      });
      logger.info(`Found ${products.length} products from database (without attributeValue and productAttributes)`);
      return asProductWithRelations(products);
    }
    throw productAttrError;
  }
}


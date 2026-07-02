import { Prisma } from "@prisma/client";
import { db } from "@white-shop/db";
import { ensureProductVariantAttributesColumn } from "../../utils/db-ensure";
import { logger } from "../../utils/logger";
import type { PaginatedProductQueryOptions } from "./query-executor";
import {
  asProductListingRows,
  getListingSelect,
  getListingSelectMinimal,
  getListingSelectWithoutAttributeValue,
  getListingSelectWithoutAttributesColumn,
  type ProductListingRow,
} from "./listing-select";

function isVariantAttributesError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorMessage.includes("product_variants.attributes") ||
    (errorMessage.includes("attributes") &&
      errorMessage.includes("does not exist"))
  );
}

function isAttributeValuesColorsError(error: unknown): boolean {
  const errorObj = error as { code?: string; message?: string };
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    (errorObj &&
      typeof errorObj === "object" &&
      "code" in errorObj &&
      errorObj.code === "P2022") ||
    errorMessage.includes("attribute_values.colors") ||
    errorMessage.includes("does not exist")
  );
}

type ListingFindManyArgs = {
  where: Prisma.ProductWhereInput;
  select: Prisma.ProductSelect;
  skip: number;
  take: number;
  orderBy?: Prisma.ProductOrderByWithRelationInput;
};

function buildListingFindManyQuery({
  where,
  select,
  skip,
  take,
  orderBy,
}: ListingFindManyArgs) {
  return {
    where,
    select,
    skip,
    take,
    ...(orderBy ? { orderBy } : {}),
  };
}

/** Phase 5C: DB-paginated catalog query with lightweight select. */
export async function executePaginatedListingQuery(
  where: Prisma.ProductWhereInput,
  options: PaginatedProductQueryOptions
): Promise<ProductListingRow[]> {
  const select = getListingSelect();

  try {
    const products = await db.product.findMany(
      buildListingFindManyQuery({
        where,
        select,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy,
      })
    );
    logger.info(
      `Found ${products.length} paginated listing products (lightweight select)`
    );
    return asProductListingRows(products);
  } catch (error: unknown) {
    if (isVariantAttributesError(error)) {
      logger.warn(
        "product_variants.attributes column not found on listing path, attempting to create it"
      );
      try {
        await ensureProductVariantAttributesColumn();
        const products = await db.product.findMany(
          buildListingFindManyQuery({
            where,
            select,
            skip: options.skip,
            take: options.take,
            orderBy: options.orderBy,
          })
        );
        logger.info(
          `Found ${products.length} paginated listing products (after creating attributes column)`
        );
        return asProductListingRows(products);
      } catch (attributesError: unknown) {
        return handleListingAttributesError(attributesError, where, options);
      }
    }

    if (isAttributeValuesColorsError(error)) {
      logger.warn(
        "attribute_values.colors column not found on listing path, using fallback select",
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );
      return executePaginatedListingWithoutAttributeValue(where, options);
    }

    throw error;
  }
}

async function handleListingAttributesError(
  error: unknown,
  where: Prisma.ProductWhereInput,
  options: PaginatedProductQueryOptions
): Promise<ProductListingRow[]> {
  if (isAttributeValuesColorsError(error)) {
    return executePaginatedListingWithoutAttributeValue(where, options);
  }

  if (isVariantAttributesError(error)) {
    return executePaginatedListingWithoutAttributesColumn(where, options);
  }

  throw error;
}

async function executePaginatedListingWithoutAttributesColumn(
  where: Prisma.ProductWhereInput,
  options: PaginatedProductQueryOptions
): Promise<ProductListingRow[]> {
  const select = getListingSelectWithoutAttributesColumn();

  try {
    const products = await db.product.findMany(
      buildListingFindManyQuery({
        where,
        select,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy,
      })
    );
    logger.info(
      `Found ${products.length} paginated listing products (without variant attributes column)`
    );
    return asProductListingRows(products);
  } catch (error: unknown) {
    if (isAttributeValuesColorsError(error)) {
      return executePaginatedListingMinimal(where, options);
    }
    throw error;
  }
}

async function executePaginatedListingWithoutAttributeValue(
  where: Prisma.ProductWhereInput,
  options: PaginatedProductQueryOptions
): Promise<ProductListingRow[]> {
  const select = getListingSelectWithoutAttributeValue();

  try {
    const products = await db.product.findMany(
      buildListingFindManyQuery({
        where,
        select,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy,
      })
    );
    logger.info(
      `Found ${products.length} paginated listing products (without attributeValue)`
    );
    return asProductListingRows(products);
  } catch (error: unknown) {
    if (isVariantAttributesError(error)) {
      return executePaginatedListingMinimal(where, options);
    }
    throw error;
  }
}

async function executePaginatedListingMinimal(
  where: Prisma.ProductWhereInput,
  options: PaginatedProductQueryOptions
): Promise<ProductListingRow[]> {
  const select = getListingSelectMinimal();
  const products = await db.product.findMany(
    buildListingFindManyQuery({
      where,
      select,
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
    })
  );
  logger.info(
    `Found ${products.length} paginated listing products (minimal select fallback)`
  );
  return asProductListingRows(products);
}

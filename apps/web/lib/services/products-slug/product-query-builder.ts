import { db } from "@white-shop/db";
import { ensureProductVariantAttributesColumn } from "../../utils/db-ensure";
import { logger } from "../../utils/logger";
import { buildProductSlugCandidates } from "../../utils/slug";
import type { ProductWithFullRelations } from "./types";

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
  categories: {
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
 * Base where clause for product queries
 */
const getBaseWhere = (slugCandidates: string[], lang: string) => ({
  translations: {
    some: {
      slug: {
        in: slugCandidates,
      },
      locale: lang,
    },
  },
  published: true,
  deletedAt: null,
});

/**
 * Check if error is related to product_attributes table
 */
function isProductAttributesError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  return errorCode === 'P2021' || errorMessage.includes('product_attributes') || errorMessage.includes('does not exist');
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
  return errorObj?.code === 'P2022' || 
         errorMessage.includes('attribute_values.colors') || 
         errorMessage.includes('does not exist');
}

/**
 * Fetch product by slug regardless of translation locale.
 * Used as a fallback when exact language match is missing.
 */
async function fetchBySlugAnyLocale(slugCandidates: string[]): Promise<ProductWithFullRelations | null> {
  const baseInclude = getBaseInclude();
  const baseWhere = {
    translations: {
      some: {
        slug: {
          in: slugCandidates,
        },
      },
    },
    published: true,
    deletedAt: null,
  };

  try {
    return await db.product.findFirst({
      where: baseWhere,
      include: {
        ...baseInclude,
        ...getProductAttributesInclude(),
      },
    });
  } catch (error: unknown) {
    if (isProductAttributesError(error)) {
      return db.product.findFirst({
        where: baseWhere,
        include: baseInclude,
      });
    }

    if (isAttributeValuesColorsError(error)) {
      return db.product.findFirst({
        where: baseWhere,
        include: getBaseIncludeWithoutAttributeValue(),
      });
    }

    throw error;
  }
}

/**
 * Fetch product with productAttributes (with fallback handling)
 */
async function fetchWithProductAttributes(
  slugCandidates: string[],
  lang: string
): Promise<ProductWithFullRelations | null> {
  const baseInclude = getBaseInclude();
  const baseWhere = getBaseWhere(slugCandidates, lang);

  try {
    const product = await db.product.findFirst({
      where: baseWhere,
      include: {
        ...baseInclude,
        ...getProductAttributesInclude(),
      },
    });
    logger.info('Successfully fetched product with productAttributes');
    const productAttrs = product && 'productAttributes' in product && Array.isArray(product.productAttributes) ? product.productAttributes : [];
    logger.debug('Product attributes count', { count: productAttrs.length });
    return product;
  } catch (error: unknown) {
    if (isProductAttributesError(error)) {
      logger.warn('product_attributes table not found, fetching without it', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return fetchWithoutProductAttributes(slugCandidates, lang);
    }

    if (isVariantAttributesError(error)) {
      logger.warn('product_variants.attributes column not found, attempting to create it');
      try {
        await ensureProductVariantAttributesColumn();
        const product = await db.product.findFirst({
          where: baseWhere,
          include: baseInclude,
        });
        return product;
      } catch (attributesError: unknown) {
        return handleAttributesError(attributesError, slugCandidates, lang);
      }
    }

    if (isAttributeValuesColorsError(error)) {
      logger.warn('attribute_values.colors column not found, fetching without attributeValue', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return fetchWithoutAttributeValue(slugCandidates, lang);
    }

    throw error;
  }
}

/**
 * Fetch product without productAttributes (fallback)
 */
async function fetchWithoutProductAttributes(
  slugCandidates: string[],
  lang: string
): Promise<ProductWithFullRelations | null> {
  const baseInclude = getBaseInclude();
  const baseWhere = getBaseWhere(slugCandidates, lang);

  try {
    const product = await db.product.findFirst({
      where: baseWhere,
      include: baseInclude,
    });
    const productAttrsFallback = product && 'productAttributes' in product && Array.isArray(product.productAttributes) ? product.productAttributes : [];
    logger.debug('Fallback query (without productAttributes)', { count: productAttrsFallback.length });
    return product;
  } catch (retryError: unknown) {
    if (isVariantAttributesError(retryError)) {
      logger.warn('product_variants.attributes column not found, attempting to create it');
      try {
        await ensureProductVariantAttributesColumn();
        const product = await db.product.findFirst({
          where: baseWhere,
          include: baseInclude,
        });
        return product;
      } catch (attributesError: unknown) {
        return handleAttributesError(attributesError, slugCandidates, lang);
      }
    }

    if (isAttributeValuesColorsError(retryError)) {
      logger.warn('attribute_values.colors column not found, fetching without attributeValue', { 
        error: retryError instanceof Error ? retryError.message : String(retryError) 
      });
      return fetchWithoutAttributeValue(slugCandidates, lang);
    }

    throw retryError;
  }
}

/**
 * Handle attributes-related errors
 */
async function handleAttributesError(
  error: unknown,
  slugCandidates: string[],
  lang: string
): Promise<ProductWithFullRelations | null> {
  if (isAttributeValuesColorsError(error)) {
    logger.warn('attribute_values.colors column not found, fetching without attributeValue', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return fetchWithoutAttributeValue(slugCandidates, lang);
  }
  throw error;
}

/**
 * Fetch product without attributeValue relation (fallback)
 */
async function fetchWithoutAttributeValue(
  slugCandidates: string[],
  lang: string
): Promise<ProductWithFullRelations | null> {
  const baseIncludeWithoutAttributeValue = getBaseIncludeWithoutAttributeValue();
  const baseWhere = getBaseWhere(slugCandidates, lang);

  // Try to include productAttributes even in fallback
  try {
    const product = await db.product.findFirst({
      where: baseWhere,
      include: {
        ...baseIncludeWithoutAttributeValue,
        ...getProductAttributesInclude(),
      },
    });
    return product;
  } catch (productAttrError: unknown) {
    // If productAttributes also fails, retry without it
    if (isProductAttributesError(productAttrError)) {
      const product = await db.product.findFirst({
        where: baseWhere,
        include: baseIncludeWithoutAttributeValue,
      });
      return product;
    }
    throw productAttrError;
  }
}

/**
 * Build and execute product query by slug with comprehensive error handling
 */
export async function buildProductQuery(
  slug: string,
  lang: string = "en"
): Promise<ProductWithFullRelations | null> {
  const slugCandidates = buildProductSlugCandidates(slug);
  if (slugCandidates.length === 0) {
    return null;
  }

  const product = await fetchWithProductAttributes(slugCandidates, lang);
  if (product) {
    return product;
  }

  const fallbackProduct = await fetchBySlugAnyLocale(slugCandidates);
  if (fallbackProduct) {
    return fallbackProduct;
  }
  
  // If product not found, log diagnostic information
  await logProductNotFoundDiagnostics(slug, slugCandidates, lang);
  
  return null;
}

/**
 * Log diagnostic information when product is not found
 */
async function logProductNotFoundDiagnostics(
  originalSlug: string,
  slugCandidates: string[],
  lang: string
): Promise<void> {
  try {
    // Check if product exists with this slug in any language
    const productAnyLang = await db.product.findFirst({
      where: {
        translations: {
          some: { slug: { in: slugCandidates } },
        },
      },
      include: {
        translations: {
          select: {
            locale: true,
            slug: true,
          },
        },
      },
    });

    if (productAnyLang) {
      const availableLangs = productAnyLang.translations.map((t: { locale: string; slug: string }) => t.locale).join(', ');
      logger.warn('Product found with slug but not in requested language', {
        slug: originalSlug,
        slugCandidates,
        requestedLang: lang,
        availableLangs,
        published: productAnyLang.published,
        deletedAt: productAnyLang.deletedAt,
      });
    } else {
      // Check if product exists but is unpublished or deleted
      const productUnpublished = await db.product.findFirst({
        where: {
          translations: {
            some: {
              slug: { in: slugCandidates },
              locale: lang,
            },
          },
        },
        select: {
          id: true,
          published: true,
          deletedAt: true,
        },
      });

      if (productUnpublished) {
        logger.warn('Product found but not available', {
          slug: originalSlug,
          slugCandidates,
          lang,
          published: productUnpublished.published,
          deletedAt: productUnpublished.deletedAt,
        });
      } else {
        logger.debug('Product not found in database', {
          slug: originalSlug,
          slugCandidates,
          lang,
        });
      }
    }
  } catch (error) {
    logger.error('Error during product diagnostics', {
      error: error instanceof Error ? error.message : String(error),
      slug: originalSlug,
      slugCandidates,
      lang,
    });
  }
}


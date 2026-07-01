import { db } from "@white-shop/db";
import { logger } from "../../utils/logger";

/**
 * Get all child category IDs recursively
 */
export async function getAllChildCategoryIds(parentId: string): Promise<string[]> {
  const children = await db.category.findMany({
    where: {
      parentId: parentId,
      published: true,
      deletedAt: null,
    },
    select: { id: true },
  });
  
  let allChildIds = children.map((c: { id: string }) => c.id);
  
  // Recursively get children of children
  for (const child of children) {
    const grandChildren = await getAllChildCategoryIds(child.id);
    allChildIds = [...allChildIds, ...grandChildren];
  }
  
  return allChildIds;
}

const LOCALE_SLUG_SUFFIX = /-(en|ru|hy)$/;

function stripLocaleSlugSuffix(slug: string): string | null {
  const match = slug.match(LOCALE_SLUG_SUFFIX);
  return match ? slug.slice(0, -match[0].length) : null;
}

async function queryCategoryBySlug(
  categorySlug: string,
  lang?: string
): Promise<{ id: string; translations?: Array<{ slug: string; locale: string }> } | null> {
  return db.category.findFirst({
    where: {
      translations: {
        some: lang
          ? { slug: categorySlug, locale: lang }
          : { slug: categorySlug },
      },
      published: true,
      deletedAt: null,
    },
    include: {
      translations: {
        select: { slug: true, locale: true },
      },
    },
  });
}

/**
 * Find category by slug with fallback to other languages
 */
export async function findCategoryBySlug(
  categorySlug: string,
  lang: string
): Promise<{ id: string } | null> {
  logger.debug('Looking for category', { category: categorySlug, lang });

  let categoryDoc = await queryCategoryBySlug(categorySlug, lang);

  if (!categoryDoc) {
    logger.warn('Category not found in language, trying other languages', { category: categorySlug, lang });
    categoryDoc = await queryCategoryBySlug(categorySlug);

    if (categoryDoc) {
      const foundIn =
        categoryDoc.translations?.find((t) => t.slug === categorySlug)?.locale ?? 'unknown';
      logger.info('Category found in different language', {
        id: categoryDoc.id,
        slug: categorySlug,
        foundIn,
      });
    }
  }

  if (!categoryDoc) {
    const normalizedSlug = stripLocaleSlugSuffix(categorySlug);
    if (normalizedSlug && normalizedSlug !== categorySlug) {
      logger.warn('Category slug looks locale-suffixed, retrying base slug', {
        category: categorySlug,
        normalizedSlug,
        lang,
      });
      categoryDoc = await queryCategoryBySlug(normalizedSlug, lang);
      if (!categoryDoc) {
        categoryDoc = await queryCategoryBySlug(normalizedSlug);
      }
    }
  }

  if (categoryDoc) {
    logger.info('Category found', { id: categoryDoc.id, slug: categorySlug });
  } else {
    logger.warn('Category not found in any language', { category: categorySlug, lang });
  }

  return categoryDoc;
}









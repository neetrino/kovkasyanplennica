import { Prisma } from "@prisma/client";
import { db } from "@white-shop/db";
import { processImageUrl } from "../utils/image-utils";
import {
  findCategoryBySlug,
  getAllChildCategoryIds,
} from "./products-find-query/category-utils";

export interface NavPreviewProduct {
  id: string;
  slug: string;
  title: string;
  image: string | null;
}

function extractPreviewImage(product: {
  media: Prisma.JsonValue;
  variants: Array<{ imageUrl: string | null }>;
}): string | null {
  const media = product.media;
  if (Array.isArray(media) && media.length > 0) {
    const u = processImageUrl(
      media[0] as Parameters<typeof processImageUrl>[0]
    );
    if (u) return u;
  }
  for (const v of product.variants) {
    if (v.imageUrl) {
      const u = processImageUrl(v.imageUrl);
      if (u) return u;
    }
  }
  return null;
}

const basePreviewSelect = (lang: string) =>
  ({
    id: true,
    media: true,
    translations: {
      where: { locale: lang },
      take: 1,
      select: { slug: true, title: true },
    },
    variants: {
      where: { published: true },
      orderBy: { price: "asc" },
      take: 8,
      select: { imageUrl: true },
    },
  }) satisfies Prisma.ProductSelect;

async function findPreviewForAll(lang: string): Promise<NavPreviewProduct | null> {
  const products = await db.product.findMany({
    where: { published: true, deletedAt: null },
    select: basePreviewSelect(lang),
    take: 15,
    orderBy: { createdAt: "desc" },
  });

  for (const p of products) {
    const t = p.translations[0];
    if (!t) continue;
    const image = extractPreviewImage(p);
    if (image) {
      return { id: p.id, slug: t.slug, title: t.title, image };
    }
  }

  const first = products[0];
  const t = first?.translations[0];
  if (!first || !t) return null;
  return {
    id: first.id,
    slug: t.slug,
    title: t.title,
    image: extractPreviewImage(first),
  };
}

async function findPreviewForCategorySlug(
  slug: string,
  lang: string
): Promise<NavPreviewProduct | null> {
  const categoryDoc = await findCategoryBySlug(slug, lang);
  if (!categoryDoc) return null;

  const childIds = await getAllChildCategoryIds(categoryDoc.id);
  const allIds = [categoryDoc.id, ...childIds];

  const where: Prisma.ProductWhereInput = {
    published: true,
    deletedAt: null,
    OR: [
      { primaryCategoryId: { in: allIds } },
      { categoryIds: { hasSome: allIds } },
    ],
  };

  const products = await db.product.findMany({
    where,
    select: basePreviewSelect(lang),
    take: 15,
    orderBy: { createdAt: "desc" },
  });

  for (const p of products) {
    const t = p.translations[0];
    if (!t) continue;
    const image = extractPreviewImage(p);
    if (image) {
      return { id: p.id, slug: t.slug, title: t.title, image };
    }
  }

  const first = products[0];
  const t = first?.translations[0];
  if (!first || !t) return null;
  return {
    id: first.id,
    slug: t.slug,
    title: t.title,
    image: extractPreviewImage(first),
  };
}

/**
 * One preview product per category slug for the horizontal nav (minimal DB work vs. N× full `findAll`).
 */
export async function getCategoryNavPreviews(
  lang: string,
  slugs: string[]
): Promise<Record<string, NavPreviewProduct | null>> {
  const unique = [...new Set(slugs.filter(Boolean))];
  const out: Record<string, NavPreviewProduct | null> = {};

  await Promise.all(
    unique.map(async (slug) => {
      try {
        out[slug] =
          slug === "all"
            ? await findPreviewForAll(lang)
            : await findPreviewForCategorySlug(slug, lang);
      } catch {
        out[slug] = null;
      }
    })
  );

  return out;
}

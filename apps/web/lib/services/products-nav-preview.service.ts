import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache/public-cache-ttl";
import { db } from "@white-shop/db";
import { toOptimizedProductCardUrl } from "@/lib/image-optimization";
import { processImageUrl } from "../utils/image-utils";
import {
  findCategoryBySlug,
  getAllChildCategoryIds,
} from "./products-find-query/category-utils";

export interface CategoryNavPreviewTarget {
  slug: string;
  id?: string;
}

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
  let raw: string | null = null;
  const media = product.media;
  if (Array.isArray(media) && media.length > 0) {
    raw = processImageUrl(
      media[0] as Parameters<typeof processImageUrl>[0]
    );
  }
  if (!raw) {
    for (const v of product.variants) {
      if (v.imageUrl) {
        raw = processImageUrl(v.imageUrl);
        if (raw) break;
      }
    }
  }
  if (!raw) return null;
  return toOptimizedProductCardUrl(raw) ?? raw;
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

async function findPreviewForCategory(
  target: CategoryNavPreviewTarget,
  lang: string
): Promise<NavPreviewProduct | null> {
  let categoryId = target.id;
  if (!categoryId) {
    const categoryDoc = await findCategoryBySlug(target.slug, lang);
    if (!categoryDoc) return null;
    categoryId = categoryDoc.id;
  }

  const childIds = await getAllChildCategoryIds(categoryId);
  const allIds = [categoryId, ...childIds];

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

const NAV_PREVIEW_REVALIDATE_SECONDS = PUBLIC_PAGE_REVALIDATE_SECONDS;
/** Avoid opening dozens of concurrent DB queries (pool / CPU spikes on `/products`). */
const NAV_PREVIEW_CONCURRENCY = 6;

function normalizeNavPreviewTargets(
  targets: Array<string | CategoryNavPreviewTarget>
): CategoryNavPreviewTarget[] {
  const bySlug = new Map<string, CategoryNavPreviewTarget>();
  for (const target of targets) {
    if (!target) continue;
    const entry = typeof target === "string" ? { slug: target } : target;
    if (!entry.slug) continue;
    const existing = bySlug.get(entry.slug);
    bySlug.set(entry.slug, {
      slug: entry.slug,
      id: entry.id ?? existing?.id,
    });
  }
  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

async function resolveNavPreviewTargets(
  lang: string,
  targets: CategoryNavPreviewTarget[]
): Promise<Record<string, NavPreviewProduct | null>> {
  const out: Record<string, NavPreviewProduct | null> = {};

  for (let i = 0; i < targets.length; i += NAV_PREVIEW_CONCURRENCY) {
    const batch = targets.slice(i, i + NAV_PREVIEW_CONCURRENCY);
    await Promise.all(
      batch.map(async (target) => {
        try {
          out[target.slug] =
            target.slug === "all"
              ? await findPreviewForAll(lang)
              : await findPreviewForCategory(target, lang);
        } catch {
          out[target.slug] = null;
        }
      })
    );
  }

  return out;
}

const getCategoryNavPreviewsCached = unstable_cache(
  async (lang: string, targetKey: string) => {
    const targets =
      targetKey.length > 0
        ? (JSON.parse(targetKey) as CategoryNavPreviewTarget[])
        : [];
    return resolveNavPreviewTargets(lang, targets);
  },
  ["category-nav-previews-v3"],
  {
    revalidate: NAV_PREVIEW_REVALIDATE_SECONDS,
    tags: ["category-nav-previews"],
  }
);

/**
 * One preview product per category slug for the horizontal nav (minimal DB work vs. N× full `findAll`).
 */
export async function getCategoryNavPreviews(
  lang: string,
  targets: Array<string | CategoryNavPreviewTarget>
): Promise<Record<string, NavPreviewProduct | null>> {
  const normalized = normalizeNavPreviewTargets(targets);
  if (normalized.length === 0) {
    return {};
  }
  const targetKey = JSON.stringify(normalized);
  return getCategoryNavPreviewsCached(lang, targetKey);
}

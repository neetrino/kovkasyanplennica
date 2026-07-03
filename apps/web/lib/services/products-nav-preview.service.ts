import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache/public-cache-ttl";
import { db } from "@white-shop/db";
import { toOptimizedProductCardUrl } from "@/lib/image-optimization";
import { processImageUrl } from "../utils/image-utils";
import { findCategoryBySlug } from "./products-find-query/category-utils";
import {
  buildCategoryDescendantIdMap,
  productMatchesCategoryIds,
} from "./category-descendant-map";
import { categoriesService } from "./categories.service";
import type { Category } from "@/components/CategoryNavigation/utils";

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
    primaryCategoryId: true,
    categoryIds: true,
    media: true,
    translations: {
      where: { locale: lang },
      take: 1,
      select: { slug: true, title: true },
    },
    variants: {
      where: { published: true },
      orderBy: { price: "asc" },
      take: 3,
      select: { imageUrl: true },
    },
  }) satisfies Prisma.ProductSelect;

type PreviewProductRow = Prisma.ProductGetPayload<{
  select: ReturnType<typeof basePreviewSelect>;
}>;

function toNavPreviewProduct(
  product: PreviewProductRow
): NavPreviewProduct | null {
  const t = product.translations[0];
  if (!t) return null;
  return {
    id: product.id,
    slug: t.slug,
    title: t.title,
    image: extractPreviewImage(product),
  };
}

function pickPreviewWithImage(
  products: PreviewProductRow[]
): NavPreviewProduct | null {
  for (const product of products) {
    const preview = toNavPreviewProduct(product);
    if (preview?.image) return preview;
  }
  const first = products[0];
  return first ? toNavPreviewProduct(first) : null;
}

async function findPreviewForAll(lang: string): Promise<NavPreviewProduct | null> {
  const products = await db.product.findMany({
    where: { published: true, deletedAt: null },
    select: basePreviewSelect(lang),
    take: 15,
    orderBy: { createdAt: "desc" },
  });
  return pickPreviewWithImage(products);
}

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

async function resolveNavPreviewTargetsBulk(
  lang: string,
  targets: CategoryNavPreviewTarget[],
  categoryTreeRoots: Category[]
): Promise<Record<string, NavPreviewProduct | null>> {
  const out: Record<string, NavPreviewProduct | null> = {};
  const categoryTargets = targets.filter((t) => t.slug !== "all");

  if (targets.some((t) => t.slug === "all")) {
    out.all = await findPreviewForAll(lang);
  }

  if (categoryTargets.length === 0) {
    return out;
  }

  let roots = categoryTreeRoots;
  if (roots.length === 0) {
    const tree = await categoriesService.getTree(lang);
    roots = (tree.data ?? []) as Category[];
  }

  const descendantMap = buildCategoryDescendantIdMap(roots);
  const slugToCategoryId = new Map<string, string>();

  for (const target of categoryTargets) {
    if (target.id) {
      slugToCategoryId.set(target.slug, target.id);
      continue;
    }
    const doc = await findCategoryBySlug(target.slug, lang);
    if (doc) {
      slugToCategoryId.set(target.slug, doc.id);
    }
  }

  const allRelevantIds = new Set<string>();
  for (const target of categoryTargets) {
    const categoryId = slugToCategoryId.get(target.slug);
    if (!categoryId) continue;
    allRelevantIds.add(categoryId);
    for (const childId of descendantMap.get(categoryId) ?? []) {
      allRelevantIds.add(childId);
    }
  }

  if (allRelevantIds.size === 0) {
    for (const target of categoryTargets) {
      out[target.slug] = null;
    }
    return out;
  }

  const poolTake = Math.min(Math.max(categoryTargets.length * 20, 80), 400);
  const productPool = await db.product.findMany({
    where: {
      published: true,
      deletedAt: null,
      OR: [
        { primaryCategoryId: { in: [...allRelevantIds] } },
        { categoryIds: { hasSome: [...allRelevantIds] } },
      ],
    },
    select: basePreviewSelect(lang),
    orderBy: { createdAt: "desc" },
    take: poolTake,
  });

  for (const target of categoryTargets) {
    const categoryId = slugToCategoryId.get(target.slug);
    if (!categoryId) {
      out[target.slug] = null;
      continue;
    }

    const ids = new Set<string>([
      categoryId,
      ...(descendantMap.get(categoryId) ?? []),
    ]);
    const matches = productPool.filter((product) =>
      productMatchesCategoryIds(product, ids)
    );
    out[target.slug] = pickPreviewWithImage(matches);
  }

  return out;
}

const NAV_PREVIEW_REVALIDATE_SECONDS = PUBLIC_PAGE_REVALIDATE_SECONDS;

const getCategoryNavPreviewsCached = unstable_cache(
  async (lang: string, targetKey: string, treeKey: string) => {
    const targets =
      targetKey.length > 0
        ? (JSON.parse(targetKey) as CategoryNavPreviewTarget[])
        : [];
    const categoryTreeRoots =
      treeKey.length > 0 ? (JSON.parse(treeKey) as Category[]) : [];
    return resolveNavPreviewTargetsBulk(lang, targets, categoryTreeRoots);
  },
  ["category-nav-previews-v4"],
  {
    revalidate: NAV_PREVIEW_REVALIDATE_SECONDS,
    tags: ["category-nav-previews"],
  }
);

/**
 * One preview product per category slug for the shop sidebar (bulk DB fetch).
 */
export async function getCategoryNavPreviews(
  lang: string,
  targets: Array<string | CategoryNavPreviewTarget>,
  categoryTreeRoots: Category[] = []
): Promise<Record<string, NavPreviewProduct | null>> {
  const normalized = normalizeNavPreviewTargets(targets);
  if (normalized.length === 0) {
    return {};
  }
  const targetKey = JSON.stringify(normalized);
  const treeKey = JSON.stringify(
    categoryTreeRoots.map((c) => ({ id: c.id, children: c.children }))
  );
  return getCategoryNavPreviewsCached(lang, targetKey, treeKey);
}

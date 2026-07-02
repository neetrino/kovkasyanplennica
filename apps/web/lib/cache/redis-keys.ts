import { createHash } from "crypto";

const PREFIX = "shop";

export function hashCacheInput(value: unknown): string {
  const normalized = JSON.stringify(value);
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export function productListKey(filtersHash: string): string {
  return `${PREFIX}:products:v1:${filtersHash}`;
}

export function productSlugKey(slug: string, lang: string): string {
  return `${PREFIX}:product:slug:v1:${slug}:${lang}`;
}

export function categoryTreeKey(lang: string): string {
  return `${PREFIX}:categories:tree:v1:${lang}`;
}

export function categorySlugKey(slug: string, lang: string): string {
  return `${PREFIX}:categories:slug:v1:${slug}:${lang}`;
}

export function searchKey(queryHash: string): string {
  return `${PREFIX}:search:v1:${queryHash}`;
}

export function discountSettingsKey(): string {
  return `${PREFIX}:settings:discounts:v1`;
}

export function spinWheelFeatureKey(): string {
  return `${PREFIX}:settings:spin-wheel-feature:v1`;
}

export type FiltersCacheContext = {
  lang: string;
  category: string | null;
  search: string | null;
  minPrice: number | null;
  maxPrice: number | null;
};

export type PriceRangeCacheContext = {
  lang: string;
  category: string | null;
};

export function normalizeFiltersCacheContext(filters: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  lang?: string;
}): FiltersCacheContext {
  return {
    lang: filters.lang || "en",
    category: filters.category?.trim() || null,
    search: filters.search?.trim() || null,
    minPrice: filters.minPrice ?? null,
    maxPrice: filters.maxPrice ?? null,
  };
}

export function normalizePriceRangeCacheContext(filters: {
  category?: string;
  lang?: string;
}): PriceRangeCacheContext {
  return {
    lang: filters.lang || "en",
    category: filters.category?.trim() || null,
  };
}

export function filtersCacheKey(contextHash: string): string {
  return `${PREFIX}:filters:v1:${contextHash}`;
}

export function priceRangeCacheKey(contextHash: string): string {
  return `${PREFIX}:price-range:v1:${contextHash}`;
}

export const REDIS_CACHE_PATTERNS = {
  products: `${PREFIX}:products:*`,
  productSlugs: `${PREFIX}:product:slug:*`,
  categories: `${PREFIX}:categories:*`,
  search: `${PREFIX}:search:*`,
  settings: `${PREFIX}:settings:*`,
  filters: `${PREFIX}:filters:*`,
  priceRange: `${PREFIX}:price-range:*`,
} as const;

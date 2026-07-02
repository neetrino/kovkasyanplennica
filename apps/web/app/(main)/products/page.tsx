import Link from 'next/link';
import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import { getStoredLanguage, type LanguageCode } from '@/lib/language';
import { t } from '@/lib/i18n';
import type { ProductFilters } from '@/lib/services/products-find-query/types';
import { productsService } from '@/lib/services/products.service';
import { ProductsCategoryRow } from '@/components/products/ProductsCategoryRow';
import { LazyCategoryProductsSection } from '@/components/products/LazyCategoryProductsSection';
import {
  ABOVE_FOLD_ROWS,
  INITIAL_ROW_PRODUCTS,
  PRODUCTS_SHOP_FILTERED_LIST_LIMIT,
} from '@/components/products/shop-listing-limits';
import { flattenCategories } from '@/components/CategoryNavigation/utils';
import {
  ProductsCategorySidebar,
  ProductsCategorySidebarSkeleton,
} from '@/components/CategoryNavigation/ProductsCategorySidebar';
import { categoriesService } from '@/lib/services/categories.service';
import { getCategoryNavPreviews } from '@/lib/services/products-nav-preview.service';
import { ProductsMobileCategoriesDrawerLazy } from '@/components/ProductsMobileCategoriesDrawerLazy';
import { ProductsShopToolbar } from '@/components/ProductsShopToolbar';
import { toR2Url } from '@/lib/r2-assets';
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from '@/lib/cache/public-cache-ttl';

const PRODUCTS_LIST_REVALIDATE_SECONDS = PUBLIC_PAGE_REVALIDATE_SECONDS;
/** Returned product count for shop grouping; DB raw fetch is capped (see query-executor). */
const PRODUCTS_SHOP_LIST_LIMIT = 120;

/** ISR — products list (see PUBLIC_PAGE_REVALIDATE_SECONDS) */
export const revalidate = 3600;

function buildProductFilters(
  page: number,
  perPage: number,
  language: string,
  params: Record<string, string | undefined>
): ProductFilters {
  const minP = params.minPrice?.trim();
  const maxP = params.maxPrice?.trim();
  return {
    page,
    limit: perPage,
    lang: language,
    search: params.search?.trim() || undefined,
    category: params.category?.trim() || undefined,
    minPrice: minP ? parseFloat(minP) : undefined,
    maxPrice: maxP ? parseFloat(maxP) : undefined,
    colors: params.colors?.trim() || undefined,
    sizes: params.sizes?.trim() || undefined,
    brand: params.brand?.trim() || undefined,
    sort: params.sort?.trim() || 'createdAt',
  };
}

const fetchProductsCached = unstable_cache(
  async (filterKey: string) => {
    const filters = JSON.parse(filterKey) as ProductFilters;
    return productsService.findAll(filters);
  },
  ['main-products-list-v2'],
  { revalidate: PRODUCTS_LIST_REVALIDATE_SECONDS, tags: ['products-list'] }
);

const getCategoryTreeCached = unstable_cache(
  async (lang: string) => categoriesService.getTree(lang),
  ['products-shop-category-tree-v2'],
  { revalidate: PRODUCTS_LIST_REVALIDATE_SECONDS, tags: ['categories'] }
);

interface ProductCategory {
  id: string;
  slug: string;
  title: string;
}

interface Product {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  price: number;
  compareAtPrice: number | null;
  originalPrice?: number | null;
  discountPercent?: number | null;
  image: string | null;
  inStock: boolean;
  defaultVariantId?: string | null;
  stock?: number;
  brand: {
    id: string;
    name: string;
  } | null;
  categories?: ProductCategory[];
}

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  price: number;
  compareAtPrice: number | null;
  originalPrice?: number | null;
  discountPercent?: number | null;
  image: string | null;
  inStock: boolean;
  defaultVariantId?: string | null;
  stock?: number;
  brand: { id: string; name: string } | null;
  /** Server-only — used for category row grouping. */
  categories: ProductCategory[];
  category: string;
};

type CategoryRow = {
  categorySlug: string;
  categoryTitle: string;
  products: ProductRow[];
};

interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const EMPTY_PRODUCTS_RESPONSE: ProductsResponse = {
  data: [],
  meta: { total: 0, page: 1, limit: 24, totalPages: 0 },
};

const OTHER_SLUG = '__other__';

function normalizeProduct(product: Product): ProductRow {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description ?? null,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    originalPrice: product.originalPrice ?? null,
    discountPercent: product.discountPercent ?? null,
    image: product.image ?? null,
    inStock: product.inStock ?? true,
    defaultVariantId: product.defaultVariantId ?? null,
    stock: typeof product.stock === 'number' ? product.stock : undefined,
    brand: product.brand ?? null,
    categories: product.categories ?? [],
    category: product.categories?.[0]?.title ?? '',
  };
}

function buildCategoryRows(products: ProductRow[], language: LanguageCode): CategoryRow[] {
  const rows = new Map<string, CategoryRow>();

  for (const product of products) {
    const primary = product.categories?.[0];
    const categorySlug = primary?.slug ?? OTHER_SLUG;
    const existing = rows.get(categorySlug);

    if (existing) {
      existing.products.push(product);
      continue;
    }

    rows.set(categorySlug, {
      categorySlug,
      categoryTitle:
        categorySlug === OTHER_SLUG
          ? t(language, 'products.grid.otherCategory')
          : (primary?.title ?? categorySlug),
      products: [product],
    });
  }

  return Array.from(rows.values());
}

/**
 * Load products via service (no HTTP self-fetch) + Data Cache via `unstable_cache`.
 */
async function getProducts(
  page: number = 1,
  search: string | undefined,
  category: string | undefined,
  minPrice: string | undefined,
  maxPrice: string | undefined,
  colors: string | undefined,
  sizes: string | undefined,
  brand: string | undefined,
  sort: string | undefined,
  limit: number = 24
): Promise<ProductsResponse> {
  try {
    const language = getStoredLanguage();
    const params: Record<string, string | undefined> = {
      search,
      category,
      minPrice,
      maxPrice,
      colors,
      sizes,
      brand,
      sort,
    };
    const filters = buildProductFilters(page, limit, language, params);
    const result = await fetchProductsCached(JSON.stringify(filters));

    if (!result.data || !Array.isArray(result.data)) {
      return EMPTY_PRODUCTS_RESPONSE;
    }

    return result as ProductsResponse;
  } catch (e) {
    console.error("❌ PRODUCT ERROR", e);
    return EMPTY_PRODUCTS_RESPONSE;
  }
}

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  if (value === undefined) return undefined;
  const v = Array.isArray(value) ? value[0] : value;
  return v;
}

function hasActiveShopFilters(params: {
  search?: string;
  category?: string;
  colors?: string;
  sizes?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
}): boolean {
  return Boolean(
    params.search?.trim() ||
      params.category?.trim() ||
      params.colors?.trim() ||
      params.sizes?.trim() ||
      params.brand?.trim() ||
      params.minPrice?.trim() ||
      params.maxPrice?.trim()
  );
}

function resolveShopListLimit(params: {
  search?: string;
  category?: string;
  colors?: string;
  sizes?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
}): number {
  return hasActiveShopFilters(params)
    ? PRODUCTS_SHOP_FILTERED_LIST_LIMIT
    : PRODUCTS_SHOP_LIST_LIMIT;
}

function ProductsPageMainSkeleton() {
  return (
    <div className="relative z-0 min-w-0 flex-1 overflow-x-visible pt-4 sm:pt-6 lg:pt-[88px] xl:pt-[96px]">
      <div className="hidden h-10 px-3 pb-1 sm:px-6 lg:block lg:px-8 lg:pt-2" aria-hidden />
      <div
        data-products-card-column
        className="relative z-10 mx-auto max-w-7xl overflow-x-visible pl-2 pr-4 pb-4 pt-4 sm:pl-4 sm:pr-6 sm:pt-6 md:pl-6 lg:px-8 lg:pb-10 lg:pt-4"
      >
        {Array.from({ length: 2 }).map((_, rowIndex) => (
          <section key={rowIndex} className="mb-14 last:mb-0">
            <div className="mb-10 h-10 w-44 rounded-full bg-white/10 animate-pulse" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="overflow-hidden rounded-[24px] border border-white/10 bg-[#364744]"
                >
                  <div className="aspect-square bg-white/10 animate-pulse" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-2/3 rounded-full bg-white/10 animate-pulse" />
                    <div className="h-4 w-full rounded-full bg-white/10 animate-pulse" />
                    <div className="h-5 w-24 rounded-full bg-[#75bf5e]/40 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

async function ProductsPageSidebarSlot() {
  const language = getStoredLanguage();
  const { data: categoryTreeRoots } = await getCategoryTreeCached(language);
  const flatCategoriesForNav = flattenCategories(categoryTreeRoots ?? []);
  const categoryNavPreviewTargets = [
    { slug: 'all' },
    ...flatCategoriesForNav.map((c) => ({ slug: c.slug, id: c.id })),
  ];
  const categoryNavPreviews = await getCategoryNavPreviews(language, categoryNavPreviewTargets);

  return (
    <ProductsCategorySidebar
      variant="sidebar"
      initialCategories={flatCategoriesForNav}
      initialCategoryNavPreviews={categoryNavPreviews}
    />
  );
}

async function ProductsPageMainSlot({
  raw,
}: {
  raw: Record<string, string | string[] | undefined>;
}) {
  const page = parseInt(firstParam(raw.page) ?? '1', 10);
  const language = getStoredLanguage();

  const params = {
    page: firstParam(raw.page),
    search: firstParam(raw.search),
    category: firstParam(raw.category),
    minPrice: firstParam(raw.minPrice),
    maxPrice: firstParam(raw.maxPrice),
    colors: firstParam(raw.colors),
    sizes: firstParam(raw.sizes),
    brand: firstParam(raw.brand),
    sort: firstParam(raw.sort),
  };

  const listLimit = resolveShopListLimit(params);

  const productsData = await getProducts(
    1,
    params.search,
    params.category,
    params.minPrice,
    params.maxPrice,
    params.colors,
    params.sizes,
    params.brand,
    params.sort,
    listLimit
  );

  const normalizedProducts = productsData.data.map((product) =>
    normalizeProduct(product as Product),
  );

  const categoryRows = buildCategoryRows(normalizedProducts, language);

  // PAGINATION: build URL for page N, keep existing filters
  const buildPaginationUrl = (num: number) => {
    const q = new URLSearchParams();
    q.set("page", num.toString());
    Object.entries(raw).forEach(([k, v]) => {
      if (k === "page" || k === "limit") return;
      const s = Array.isArray(v) ? v[0] : v;
      if (s && typeof s === "string") q.set(k, s);
    });
    return `/products?${q.toString()}`;
  };

  const ROWS_PER_PAGE = 6;
  const totalPages = Math.ceil(categoryRows.length / ROWS_PER_PAGE);
  const currentPage = Math.min(Math.max(1, page), totalPages || 1);
  const startRowIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const pageRows = categoryRows.slice(startRowIndex, startRowIndex + ROWS_PER_PAGE);

  // Page numbers for < 1 2 ... 10 > (show page numbers in stable chunks of 12)
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const CHUNK_SIZE = 12;
    if (totalPages <= CHUNK_SIZE + 2) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | 'ellipsis')[] = [1];

    const chunkIndex = Math.floor((currentPage - 1) / CHUNK_SIZE);
    const chunkStart = Math.max(2, chunkIndex * CHUNK_SIZE + 1);
    const chunkEnd = Math.min(totalPages - 1, chunkStart + CHUNK_SIZE - 1);

    if (chunkStart > 2) pages.push('ellipsis');
    for (let i = chunkStart; i <= chunkEnd; i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    if (chunkEnd < totalPages - 1) pages.push('ellipsis');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="relative z-0 min-w-0 flex-1 overflow-x-visible pt-4 sm:pt-6 lg:pt-[88px] xl:pt-[96px]">
      <ProductsShopToolbar className="hidden px-3 pb-1 sm:px-6 lg:block lg:px-8 lg:pt-2" />

      <div
        data-products-card-column
        className="relative z-10 mx-auto max-w-7xl overflow-x-visible pl-2 pr-4 pb-4 pt-4 sm:pl-4 sm:pr-6 sm:pt-6 md:pl-6 lg:px-8 lg:pb-10 lg:pt-4"
      >
          {normalizedProducts.length > 0 ? (
            <>
              {pageRows.map((row, index) => (
                <section
                  key={row.categorySlug}
                  className="mb-12 overflow-x-visible sm:mb-16 md:mb-20 last:mb-0"
                  aria-labelledby={`category-row-${index}`}
                >
                  {index === 0 ? (
                    <div className="mb-12 flex min-h-[36px] items-start gap-3 sm:min-h-[42px] sm:gap-4 md:mb-6 md:min-h-[48px] lg:mb-10 lg:block">
                      <h2
                        id={`category-row-${index}`}
                        className="min-w-0 flex-1 text-left text-[28px] font-light leading-[34px] text-[#fff4de] sm:text-[32px] sm:leading-[38px] md:text-[38px] md:leading-[44px] lg:mb-10 lg:inline-block lg:w-full lg:flex-none lg:text-right lg:italic lg:text-[43px] lg:leading-[48px]"
                        style={{ fontFamily: "'Sansation Light', sans-serif" }}
                      >
                        {row.categoryTitle}
                      </h2>
                      <div className="shrink-0 pt-1 lg:hidden">
                        <ProductsMobileCategoriesDrawerLazy layout="inline" />
                      </div>
                    </div>
                  ) : (
                    <h2
                      id={`category-row-${index}`}
                      className="mb-12 inline-block min-h-[36px] text-left text-[28px] font-light leading-[34px] text-[#fff4de] sm:min-h-[42px] sm:text-[32px] sm:leading-[38px] md:mb-6 md:min-h-[48px] md:text-[38px] md:leading-[44px] lg:mb-10 lg:w-full lg:text-right lg:italic lg:text-[43px] lg:leading-[48px]"
                      style={{ fontFamily: "'Sansation Light', sans-serif" }}
                    >
                      {row.categoryTitle}
                    </h2>
                  )}
                  {index < ABOVE_FOLD_ROWS ? (
                    <ProductsCategoryRow
                      rowProducts={row.products}
                      totalInRow={row.products.length}
                      categorySlug={row.categorySlug}
                      sortBy={params.sort || 'default'}
                      lang={language}
                      initialProductCount={INITIAL_ROW_PRODUCTS}
                      filterParams={{
                        search: params.search,
                        colors: params.colors,
                        sizes: params.sizes,
                        brand: params.brand,
                        minPrice: params.minPrice,
                        maxPrice: params.maxPrice,
                      }}
                      minVisibleCards={2}
                    />
                  ) : (
                    <LazyCategoryProductsSection
                      categorySlug={row.categorySlug}
                      lang={language}
                      sort={params.sort}
                      search={params.search}
                      colors={params.colors}
                      sizes={params.sizes}
                      brand={params.brand}
                      minPrice={params.minPrice}
                      maxPrice={params.maxPrice}
                      totalInRow={row.products.length}
                      sortBy={params.sort || 'default'}
                      minVisibleCards={2}
                    />
                  )}
                </section>
              ))}

              {totalPages > 1 && (
                <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
                  <Link
                    href={buildPaginationUrl(currentPage - 1)}
                    className={`inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      currentPage <= 1
                        ? "pointer-events-none border-[#3d504e] text-gray-500 bg-[#2F3F3D]"
                        : "border-[#3d504e] text-white bg-[#2F3F3D] hover:bg-[#3d504e]"
                    }`}
                    aria-disabled={currentPage <= 1}
                  >
                    &lt;
                  </Link>
                  {getPageNumbers().map((p, i) =>
                    p === 'ellipsis' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-white/70">…</span>
                    ) : (
                      <Link
                        key={p}
                        href={buildPaginationUrl(p)}
                        className={`inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 rounded-lg border text-sm font-medium transition-colors ${
                          p === currentPage
                            ? "border-white bg-white text-[#2F3F3D]"
                            : "border-[#3d504e] text-white bg-[#2F3F3D] hover:bg-[#3d504e]"
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )}
                  <Link
                    href={buildPaginationUrl(currentPage + 1)}
                    className={`inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      currentPage >= totalPages
                        ? "pointer-events-none border-[#3d504e] text-gray-500 bg-[#2F3F3D]"
                        : "border-[#3d504e] text-white bg-[#2F3F3D] hover:bg-[#3d504e]"
                    }`}
                    aria-disabled={currentPage >= totalPages}
                  >
                    &gt;
                  </Link>
                </nav>
              )}
            </>
          ) : (
            <div className="py-12">
              <div className="mb-6 flex justify-end lg:hidden">
                <ProductsMobileCategoriesDrawerLazy layout="inline" />
              </div>
              <p className="text-center text-lg text-gray-500">
                {t(language, 'common.messages.noProductsFound')}
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

type ProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Shell streams immediately; sidebar and product grid load in parallel Suspense boundaries.
 */
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const raw = searchParams ? await searchParams : {};
  const showFullDecorativeBackground = !firstParam(raw.category);

  return (
    <div className="w-full max-w-full bg-[#2F3F3D] relative">
      {showFullDecorativeBackground && (
        <>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[320px] sm:top-8 sm:w-[400px] md:w-[480px] lg:top-[80px] lg:w-[560px] xl:w-[640px] aspect-square max-h-[640px] pointer-events-none z-0 opacity-90" aria-hidden>
            <img src={toR2Url('/assets/hero/union-decorative.png')} alt="" className="w-full h-full object-contain" loading="lazy" decoding="async" />
          </div>
          <div className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[400px] md:w-[480px] lg:w-[560px] xl:w-[640px] aspect-square max-h-[640px] pointer-events-none z-0 opacity-90" aria-hidden>
            <img src={toR2Url('/assets/hero/union-decorative.png')} alt="" className="w-full h-full object-contain" loading="lazy" decoding="async" />
          </div>
        </>
      )}
      <div className="absolute -bottom-28 sm:-bottom-36 md:-bottom-96 left-1/2 -translate-x-1/2 w-[320px] sm:w-[400px] md:w-[480px] lg:w-[560px] xl:w-[640px] aspect-square max-h-[640px] pointer-events-none z-0 opacity-90 z-[1]" aria-hidden>
        <img src={toR2Url('/assets/hero/union-decorative.png')} alt="" className="w-full h-full object-contain" loading="lazy" decoding="async" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-[1920px] overflow-x-visible">
        <aside className="relative z-20 hidden w-[236px] shrink-0 overflow-visible lg:block lg:pt-[88px] xl:pt-[96px]">
          <div className="sticky top-[104px] overflow-visible pb-12 pl-2 pr-2 xl:top-[104px]">
            <Suspense fallback={<ProductsCategorySidebarSkeleton variant="sidebar" />}>
              <ProductsPageSidebarSlot />
            </Suspense>
          </div>
        </aside>

        <Suspense fallback={<ProductsPageMainSkeleton />}>
          <ProductsPageMainSlot raw={raw} />
        </Suspense>
      </div>
    </div>
  );
}



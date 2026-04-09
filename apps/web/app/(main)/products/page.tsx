import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { getStoredLanguage, type LanguageCode } from '@/lib/language';
import { t } from '@/lib/i18n';
import type { ProductFilters } from '@/lib/services/products-find-query/types';
import { productsService } from '@/lib/services/products.service';
import { ProductsCategoryCarousel } from '@/components/ProductsCategoryCarousel';
import { CategoryNavigation } from '@/components/CategoryNavigation';

const PRODUCTS_LIST_REVALIDATE_SECONDS = 120;

export const revalidate = PRODUCTS_LIST_REVALIDATE_SECONDS;

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
  image: string | null;
  inStock: boolean;
  defaultVariantId?: string | null;
  stock?: number;
  brand: {
    id: string;
    name: string;
  } | null;
  categories?: ProductCategory[];
  labels?: Array<{
    id: string;
    type: 'text' | 'percentage';
    value: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    color: string | null;
  }>;
}

type ProductRow = Product & {
  category: string;
  colors: Array<{ value?: string; imageUrl?: string | null; colors?: string[] | null }>;
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

function normalizeProduct(product: Product & {
  originalPrice?: number | null;
  colors?: ProductRow['colors'];
}): ProductRow {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description ?? null,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? product.originalPrice ?? null,
    image: product.image ?? null,
    inStock: product.inStock ?? true,
    defaultVariantId: product.defaultVariantId ?? null,
    stock: typeof product.stock === 'number' ? product.stock : undefined,
    brand: product.brand ?? null,
    categories: product.categories ?? [],
    category: product.categories?.[0]?.title ?? '',
    colors: product.colors ?? [],
    labels: product.labels ?? [],
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

type ProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * PAGE
 */
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const raw = searchParams ? await searchParams : {};
  const page = parseInt(firstParam(raw.page) ?? '1', 10);
  // Fetch enough products so category rows can be paginated reliably on the page.
  const DEFAULT_PER_PAGE = 9999;
  const perPage = DEFAULT_PER_PAGE;

  // `page` query param is for category-row UI pagination, not API pagination.
  // Always fetch from the first API page with a large limit so all filtered
  // products are available for local row slicing across pages.
  const productsData = await getProducts(
    1,
    firstParam(raw.search),
    firstParam(raw.category),
    firstParam(raw.minPrice),
    firstParam(raw.maxPrice),
    firstParam(raw.colors),
    firstParam(raw.sizes),
    firstParam(raw.brand),
    firstParam(raw.sort),
    perPage
  );

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

  const normalizedProducts = productsData.data.map((product) =>
    normalizeProduct(product as Product & { originalPrice?: number | null; colors?: ProductRow['colors'] }),
  );

  const language = getStoredLanguage();
  const categoryRows = buildCategoryRows(normalizedProducts, language);

  /** ≤2 category rows (e.g. filtered): one union decorative at bottom only — avoid stacked overlays when content is short */
  const showFullDecorativeBackground = categoryRows.length > 2;

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
    <div className="w-full max-w-full bg-[#2F3F3D] relative">
      {showFullDecorativeBackground && (
        <>
          {/* Decorative: վերևի հատված – կենտրոն */}
          <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[320px] sm:w-[400px] md:w-[480px] lg:w-[560px] xl:w-[640px] aspect-square max-h-[640px] pointer-events-none z-0 opacity-90" aria-hidden>
            <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
          </div>
          {/* Decorative: մեջտեղ – նույն չափսը, ցածր */}
          <div className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[400px] md:w-[480px] lg:w-[560px] xl:w-[640px] aspect-square max-h-[640px] pointer-events-none z-0 opacity-90" aria-hidden>
            <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
          </div>
        </>
      )}
      {/* Decorative: ներքևի հատված – մի քիչ footer-ի վրա (միշտ՝ կամ միայն սա երբ ≤2 category row) */}
      <div className="absolute -bottom-28 sm:-bottom-36 md:-bottom-96 left-1/2 -translate-x-1/2 w-[320px] sm:w-[400px] md:w-[480px] lg:w-[560px] xl:w-[640px] aspect-square max-h-[640px] pointer-events-none z-0 opacity-90 z-[1]" aria-hidden>
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>
      {/* Category Navigation - Full Width */}
      <CategoryNavigation />

      <div className="max-w-7xl mx-auto pl-2 sm:pl-4 md:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 pt-[80px] sm:pt-[110px] pb-4 relative z-10">

          {normalizedProducts.length > 0 ? (
            <>
              {pageRows.map((row, index) => (
                <section key={row.categorySlug} className="mb-12 sm:mb-16 md:mb-20 last:mb-0" aria-labelledby={`category-row-${index}`}>
                  <h2
                    id={`category-row-${index}`}
                    className="mb-12 md:mb-6 lg:mb-10 inline-block text-left min-h-[48px] leading-[48px] text-[43px] font-light text-[#fff4de]"
                    style={{ fontFamily: "'Sansation Light', sans-serif" }}
                  >
                    {t(language, 'products.categoryRowTitle').replace('{number}', String(startRowIndex + index + 1))}              </h2>
                  {/* Carousel on all viewports: mobile 2 cards, tablet/desktop 2–4 by width */}
                  <ProductsCategoryCarousel products={row.products} sortBy={params.sort || "default"} minVisibleCards={2} />
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
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{t(language, 'common.messages.noProductsFound')}</p>
            </div>
          )}
      </div>
    </div>
  );
}



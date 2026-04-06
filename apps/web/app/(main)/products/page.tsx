import Link from 'next/link';
import { headers } from 'next/headers';
import { Suspense } from 'react';
import { getStoredLanguage } from '@/lib/language';
import { t } from '@/lib/i18n';
import { ProductsCategoryCarousel } from '@/components/ProductsCategoryCarousel';
import { CategoryNavigation } from '@/components/CategoryNavigation';
import { ProductsResponsiveLimit } from './ProductsResponsiveLimit';

const PRODUCTS_LIST_REVALIDATE_SECONDS = 120;

export const revalidate = PRODUCTS_LIST_REVALIDATE_SECONDS;

/**
 * Absolute origin for server-side fetch (relative `/api/...` fails in Node).
 */
async function getProductsListRequestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? 'http';
    return `${proto}://${host}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

interface ProductCategory {
  id: string;
  slug: string;
  title: string;
}

interface Product {
  id: string;
  slug: string;
  title: string;
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

interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Fetch products via internal API with Next.js Data Cache (revalidate + tag).
 */
async function getProducts(
  page: number = 1,
  search?: string,
  category?: string,
  minPrice?: string,
  maxPrice?: string,
  colors?: string,
  sizes?: string,
  brand?: string,
  limit: number = 24
): Promise<ProductsResponse> {
  try {
    const language = getStoredLanguage();
    const q = new URLSearchParams();
    q.set('page', String(page));
    q.set('limit', String(limit));
    q.set('lang', language);
    const s = search?.trim();
    if (s) q.set('search', s);
    const c = category?.trim();
    if (c) q.set('category', c);
    const minP = minPrice?.trim();
    if (minP) q.set('minPrice', minP);
    const maxP = maxPrice?.trim();
    if (maxP) q.set('maxPrice', maxP);
    const col = colors?.trim();
    if (col) q.set('colors', col);
    const sz = sizes?.trim();
    if (sz) q.set('sizes', sz);
    const br = brand?.trim();
    if (br) q.set('brand', br);

    const origin = await getProductsListRequestOrigin();
    const res = await fetch(`${origin}/api/v1/products?${q.toString()}`, {
      next: {
        revalidate: PRODUCTS_LIST_REVALIDATE_SECONDS,
        tags: ['products-list'],
      },
    });

    if (!res.ok) {
      return { data: [], meta: { total: 0, page: 1, limit: 24, totalPages: 0 } };
    }

    const result = (await res.json()) as ProductsResponse;

    if (!result.data || !Array.isArray(result.data)) {
      return { data: [], meta: { total: 0, page: 1, limit: 24, totalPages: 0 } };
    }

    return result;
  } catch (e) {
    console.error("❌ PRODUCT ERROR", e);
    return { data: [], meta: { total: 0, page: 1, limit: 24, totalPages: 0 } };
  }
}

/**
 * PAGE
 */
export default async function ProductsPage({ searchParams }: any) {
  const params = searchParams ? await searchParams : {};
  const page = parseInt(params?.page || "1", 10);
  const limitParam = params?.limit?.toString().trim();
  const parsedLimit = limitParam && !Number.isNaN(parseInt(limitParam, 10))
    ? parseInt(limitParam, 10)
    : null;
  // Per page: desktop 4x3=12, tablet 3x3=9, mobile 2x3=6 — use 12; pagination when total > 12
  const DEFAULT_PER_PAGE = 12;
  const perPage = parsedLimit 
    ? (parsedLimit >= 1000 ? 9999 : parsedLimit)
    : DEFAULT_PER_PAGE;

  const productsData = await getProducts(
    page,
    params?.search,
    params?.category,
    params?.minPrice,
    params?.maxPrice,
    params?.colors,
    params?.sizes,
    params?.brand,
    perPage
  );

  // ------------------------------------
  // 🔧 FIX: normalize products 
  // add missing inStock, missing image fields 
  // ------------------------------------
  const normalizedProducts = productsData.data.map((p: any) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? p.originalPrice ?? null,
    image: p.image ?? null,
    inStock: p.inStock ?? true,
    defaultVariantId: p.defaultVariantId ?? null,
    stock: typeof p.stock === 'number' ? p.stock : undefined,
    brand: p.brand ?? null,
    categories: p.categories ?? [],
    category: p.categories?.[0]?.title ?? '',
    colors: p.colors ?? [],
    labels: p.labels ?? []
  }));

  const language = getStoredLanguage();

  /** Group products by primary category (first category) for "one row per category" display */
  const OTHER_SLUG = '__other__';
  type CategoryRow = { categorySlug: string; categoryTitle: string; products: typeof normalizedProducts };
  const categoryOrder: string[] = [];
  const byCategory = new Map<string, typeof normalizedProducts>();
  for (const product of normalizedProducts) {
    const primary = product.categories?.[0];
    const slug = primary?.slug ?? OTHER_SLUG;
    if (!byCategory.has(slug)) {
      categoryOrder.push(slug);
      byCategory.set(slug, []);
    }
    byCategory.get(slug)!.push(product);
  }
  const categoryRows: CategoryRow[] = categoryOrder.map((slug) => {
    const rowProducts = byCategory.get(slug) ?? [];
    return {
      categorySlug: slug,
      categoryTitle: slug === OTHER_SLUG ? t(language, 'products.grid.otherCategory') : (rowProducts[0]?.categories?.[0]?.title ?? slug),
      products: rowProducts.filter((p) => (p.categories?.[0]?.slug ?? OTHER_SLUG) === slug)
    };
  });

  /** ≤2 category rows (e.g. filtered): one union decorative at bottom only — avoid stacked overlays when content is short */
  const showFullDecorativeBackground = categoryRows.length > 2;

  // PAGINATION: build URL for page N, keep limit and other filters
  const buildPaginationUrl = (num: number) => {
    const q = new URLSearchParams();
    q.set("page", num.toString());
    if (perPage !== 9999) q.set("limit", perPage.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (k !== "page" && k !== "limit" && v && typeof v === "string") q.set(k, v);
    });
    return `/products?${q.toString()}`;
  };

  // Page numbers for < 1 2 ... 10 > (show first, last, current ±1, ellipsis)
  const totalPages = productsData.meta.totalPages;
  const currentPage = Math.min(Math.max(1, page), totalPages || 1);
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (currentPage > 3) pages.push('ellipsis');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div className="w-full max-w-full bg-[#2F3F3D] relative">
      <Suspense fallback={null}>
        <ProductsResponsiveLimit />
      </Suspense>
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
              {categoryRows.map((row, index) => (
                <section key={row.categorySlug} className="mb-12 sm:mb-16 md:mb-20 last:mb-0" aria-labelledby={`category-row-${index}`}>
                  <h2
                    id={`category-row-${index}`}
                    className="mb-12 md:mb-6 lg:mb-10 inline-block text-left min-h-[48px] leading-[48px] text-[43px] font-light text-[#fff4de]"
                    style={{ fontFamily: "'Sansation Light', sans-serif" }}
                  >
                    {t(language, 'products.categoryRowTitle').replace('{number}', String(index + 1))}
                  </h2>
                  {/* Carousel on all viewports: mobile 2 cards, tablet/desktop 2–4 by width */}
                  <ProductsCategoryCarousel products={row.products} sortBy={params?.sort || "default"} minVisibleCards={2} />
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



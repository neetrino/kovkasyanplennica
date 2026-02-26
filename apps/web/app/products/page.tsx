import Link from 'next/link';
import { Suspense } from 'react';
import { getStoredLanguage } from '../../lib/language';
import { t } from '../../lib/i18n';
import { ProductsGrid } from '../../components/ProductsGrid';
import { CategoryNavigation } from '../../components/CategoryNavigation';
import { ProductsResponsiveLimit } from './ProductsResponsiveLimit';

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
 * Fetch products (PRODUCTION SAFE)
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
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
      lang: language,
    };

    if (search?.trim()) params.search = search.trim();
    if (category?.trim()) params.category = category.trim();
    if (minPrice?.trim()) params.minPrice = minPrice.trim();
    if (maxPrice?.trim()) params.maxPrice = maxPrice.trim();
    if (colors?.trim()) params.colors = colors.trim();
    if (sizes?.trim()) params.sizes = sizes.trim();
    if (brand?.trim()) params.brand = brand.trim();

    const queryString = new URLSearchParams(params).toString();

    // Fallback chain: NEXT_PUBLIC_APP_URL -> VERCEL_URL -> localhost (for local dev)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const targetUrl = `${baseUrl}/api/v1/products?${queryString}`;
    console.log("🌐 [PRODUCTS] Fetch products", { targetUrl, baseUrl });

    const res = await fetch(targetUrl, {
      cache: "no-store"
    });

    if (!res.ok) throw new Error(`API failed: ${res.status}`);

    const response = await res.json();
    if (!response.data || !Array.isArray(response.data)) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 24, totalPages: 0 }
      };
    }

    return response;

  } catch (e) {
    console.error("❌ PRODUCT ERROR", e);
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 24, totalPages: 0 }
    };
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
    brand: p.brand ?? null,
    categories: p.categories ?? [],
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
  const categoryRows: CategoryRow[] = categoryOrder.map((slug) => ({
    categorySlug: slug,
    categoryTitle: slug === OTHER_SLUG ? t(language, 'products.grid.otherCategory') : (byCategory.get(slug)?.[0]?.categories?.[0]?.title ?? slug),
    products: byCategory.get(slug) ?? []
  }));

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
      {/* Decorative: վերևի հատված – կենտրոն */}
      <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[320px] sm:w-[400px] md:w-[480px] lg:w-[560px] xl:w-[640px] aspect-square max-h-[640px] pointer-events-none z-0 opacity-90" aria-hidden>
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>
      {/* Decorative: մեջտեղ – նույն չափսը, ցածր */}
      <div className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[400px] md:w-[480px] lg:w-[560px] xl:w-[640px] aspect-square max-h-[640px] pointer-events-none z-0 opacity-90" aria-hidden>
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>
      {/* Decorative: ներքևի հատված – մի քիչ footer-ի վրա */}
      <div className="absolute -bottom-28 sm:-bottom-36 md:-bottom-96 left-1/2 -translate-x-1/2 w-[320px] sm:w-[400px] md:w-[480px] lg:w-[560px] xl:w-[640px] aspect-square max-h-[640px] pointer-events-none z-0 opacity-90 z-[1]" aria-hidden>
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>
      {/* Category Navigation - Full Width */}
      <CategoryNavigation />

      <div className="max-w-7xl mx-auto pl-2 sm:pl-4 md:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 pt-[250px] pb-4 relative z-10">

          {normalizedProducts.length > 0 ? (
            <>
              {categoryRows.map((row) => (
                <section key={row.categorySlug} className="mb-8 last:mb-0">
                  
                  <ProductsGrid products={row.products} sortBy={params?.sort || "default"} />
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



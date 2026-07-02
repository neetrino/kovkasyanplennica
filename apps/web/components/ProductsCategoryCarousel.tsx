'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProductCard } from './ProductCard';
import type { CatalogCardProduct } from './products/catalog-card-product';
import { fetchCategoryRowProducts } from './products/fetch-category-row-products';
import { useVisibleCards } from './hooks/useVisibleCards';
import { useTranslation } from '../lib/i18n-client';

export type CategoryRowFilterParams = {
  search?: string;
  colors?: string;
  sizes?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
};

interface ProductsCategoryCarouselProps {
  products: CatalogCardProduct[];
  sortBy?: string;
  categorySlug?: string;
  totalInRow?: number;
  lang?: string;
  filterParams?: CategoryRowFilterParams;
  /** Mobile: at least this many columns (matches prior carousel min width). */
  minVisibleCards?: number;
}

const MOBILE_BREAKPOINT = 768;
const OTHER_SLUG = '__other__';

function sortCatalogProducts(
  items: CatalogCardProduct[],
  sortBy: string
): CatalogCardProduct[] {
  const sorted = [...items];
  switch (sortBy) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'name-desc':
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
    default:
      break;
  }
  return sorted;
}

function toProductCardShape(product: CatalogCardProduct) {
  return {
    ...product,
    brand: product.brandName ? { id: product.brandName, name: product.brandName } : null,
    compareAtPrice: product.compareAtPrice ?? undefined,
    originalPrice: product.compareAtPrice ?? undefined,
  };
}

export function ProductsCategoryCarousel({
  products: initialProducts,
  sortBy = 'default',
  categorySlug,
  totalInRow,
  lang,
  filterParams,
  minVisibleCards,
}: ProductsCategoryCarouselProps) {
  const { t } = useTranslation();
  const visibleFromHook = useVisibleCards();
  const columnsPerRow =
    minVisibleCards != null ? Math.max(visibleFromHook, minVisibleCards) : visibleFromHook;
  const [isMobile, setIsMobile] = useState(false);
  const [visibleRows, setVisibleRows] = useState(1);
  const [expandedProducts, setExpandedProducts] = useState<CatalogCardProduct[] | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setVisibleRows(1);
    setExpandedProducts(null);
  }, [initialProducts, sortBy, categorySlug, totalInRow]);

  const rowTotal = totalInRow ?? initialProducts.length;
  const hasFullRow =
    expandedProducts !== null && expandedProducts.length >= rowTotal;
  const sourceProducts = hasFullRow ? expandedProducts : initialProducts;

  const products = useMemo(
    () => sortCatalogProducts(sourceProducts, sortBy),
    [sourceProducts, sortBy]
  );

  useEffect(() => {
    setVisibleRows(1);
  }, [columnsPerRow, products.length]);

  const maxRows = columnsPerRow > 0 ? Math.ceil(rowTotal / columnsPerRow) : 1;
  const shownCount = Math.min(products.length, visibleRows * columnsPerRow);
  const displayed = products.slice(0, shownCount);
  const canExpand = visibleRows < maxRows;
  const canCollapse = visibleRows > 1;
  const showRowControls = maxRows > 1;

  const loadFullRowProducts = useCallback(async (): Promise<CatalogCardProduct[] | null> => {
    if (
      hasFullRow ||
      !categorySlug ||
      categorySlug === OTHER_SLUG ||
      !lang ||
      rowTotal <= initialProducts.length
    ) {
      return null;
    }

    setIsLoadingMore(true);
    try {
      const fetched = await fetchCategoryRowProducts({
        categorySlug,
        lang,
        sort: sortBy !== 'default' ? sortBy : undefined,
        search: filterParams?.search,
        colors: filterParams?.colors,
        sizes: filterParams?.sizes,
        brand: filterParams?.brand,
        minPrice: filterParams?.minPrice,
        maxPrice: filterParams?.maxPrice,
      });
      const sorted = sortCatalogProducts(fetched, sortBy);
      setExpandedProducts(sorted);
      return sorted;
    } catch {
      return null;
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    categorySlug,
    filterParams?.brand,
    filterParams?.colors,
    filterParams?.maxPrice,
    filterParams?.minPrice,
    filterParams?.search,
    filterParams?.sizes,
    hasFullRow,
    initialProducts.length,
    lang,
    rowTotal,
    sortBy,
  ]);

  const handleExpand = async () => {
    const nextVisibleRows = Math.min(maxRows, visibleRows + 1);
    const neededCount = nextVisibleRows * columnsPerRow;

    if (neededCount > products.length && !hasFullRow) {
      await loadFullRowProducts();
    }

    setVisibleRows(nextVisibleRows);
  };

  const roundNavBtnClass =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff4de] text-[#2F3F3D] shadow-md transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff4de]/80 sm:h-12 sm:w-12 disabled:opacity-60 disabled:pointer-events-none';

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('products.grid.noProducts')}</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-stretch gap-3 sm:gap-4 md:flex-row md:items-center md:gap-6">
      <div
        className="order-2 min-w-0 w-full flex-1 grid gap-x-2 gap-y-16 pb-10 pt-2 sm:gap-x-3 sm:gap-y-20 sm:pb-12 sm:pt-3 md:order-1 md:gap-x-4 md:gap-y-16 md:pb-12 lg:gap-x-5 lg:gap-y-20"
        style={{ gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))` }}
      >
        {displayed.map((product) => (
          <div
            key={product.id}
            className="min-w-0 px-0 pb-2 pt-3 sm:px-2 sm:pb-4 sm:pt-4 md:px-2.5 md:pb-10 md:pt-0"
          >
            <ProductCard
              product={toProductCardShape(product)}
              viewMode="grid-3"
              compactHeight={isMobile}
              largeCompactImage={isMobile}
              compactListing
            />
          </div>
        ))}
      </div>

      {showRowControls ? (
        <div
          className="order-1 flex w-full shrink-0 flex-col items-end justify-center gap-2 pb-1 md:order-2 md:w-auto md:items-center md:pb-0"
          role="group"
          aria-label={t('products.grid.rowExpandGroup')}
        >
          {canCollapse ? (
            <button
              type="button"
              onClick={() => setVisibleRows((r) => Math.max(1, r - 1))}
              className={roundNavBtnClass}
              aria-label={t('products.grid.showFewer')}
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          ) : null}
          {canExpand ? (
            <button
              type="button"
              onClick={() => void handleExpand()}
              disabled={isLoadingMore}
              className={roundNavBtnClass}
              aria-label={t('products.grid.showMore')}
              aria-expanded={visibleRows > 1}
            >
              {isLoadingMore ? (
                <svg className="h-5 w-5 animate-spin sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

'use client';

import {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from '@/lib/i18n-client';
import type { LanguageCode } from '@/lib/language';
import { useVisibleCards } from '../hooks/useVisibleCards';
import {
  sortCatalogCardProducts,
  type CatalogCardProduct,
} from './catalog-card-product';
import { CatalogProductCardClient } from './CatalogProductCardClient';
import { CATALOG_CARD_GRID_CELL_CLASS } from './catalog-card-layout';
import {
  fetchCategoryRowProducts,
  type CategoryRowFetchFilters,
} from './fetch-category-row-products';

export type CategoryRowFilterParams = {
  search?: string;
  colors?: string;
  sizes?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
};

type ProductsCategoryExpandControlsProps = CategoryRowFetchFilters & {
  initialProducts: CatalogCardProduct[];
  totalInRow: number;
  sortBy?: string;
  lang: LanguageCode;
  filterParams?: CategoryRowFilterParams;
  minVisibleCards?: number;
  /** Server-rendered card shells for initial capped products */
  children?: ReactNode;
  /** When products are already fetched client-side (lazy rows) */
  prefetchedProducts?: CatalogCardProduct[];
};

const OTHER_SLUG = '__other__';

export function ProductsCategoryExpandControls({
  initialProducts,
  totalInRow,
  sortBy = 'default',
  lang,
  filterParams,
  minVisibleCards,
  children,
  prefetchedProducts,
  categorySlug,
  search,
  colors,
  sizes,
  brand,
  minPrice,
  maxPrice,
  sort,
}: ProductsCategoryExpandControlsProps) {
  const { t } = useTranslation();
  const visibleFromHook = useVisibleCards();
  const columnsPerRow =
    minVisibleCards != null ? Math.max(visibleFromHook, minVisibleCards) : visibleFromHook;
  const [visibleRows, setVisibleRows] = useState(1);
  const [expandedProducts, setExpandedProducts] = useState<CatalogCardProduct[] | null>(
    prefetchedProducts ?? null
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const serverChildren = Children.toArray(children);
  const hasServerChildren = serverChildren.length > 0;

  useEffect(() => {
    setVisibleRows(1);
    setExpandedProducts(prefetchedProducts ?? null);
  }, [initialProducts, sortBy, categorySlug, totalInRow, prefetchedProducts]);

  const rowTotal = totalInRow ?? initialProducts.length;
  const sourceProducts = expandedProducts ?? initialProducts;
  const products = useMemo(
    () => sortCatalogCardProducts(sourceProducts, sortBy),
    [sourceProducts, sortBy]
  );

  useEffect(() => {
    setVisibleRows(1);
  }, [columnsPerRow, products.length]);

  const maxRows = columnsPerRow > 0 ? Math.ceil(rowTotal / columnsPerRow) : 1;
  const shownCount = Math.min(products.length, visibleRows * columnsPerRow);
  const canExpand = visibleRows < maxRows;
  const canCollapse = visibleRows > 1;
  const showRowControls = maxRows > 1;
  const needsFetch =
    !prefetchedProducts &&
    expandedProducts === null &&
    rowTotal > initialProducts.length;

  const loadFullRowProducts = useCallback(async (): Promise<CatalogCardProduct[] | null> => {
    if (
      prefetchedProducts ||
      expandedProducts !== null ||
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
        sort: sortBy !== 'default' ? sortBy : sort,
        search: filterParams?.search ?? search,
        colors: filterParams?.colors ?? colors,
        sizes: filterParams?.sizes ?? sizes,
        brand: filterParams?.brand ?? brand,
        minPrice: filterParams?.minPrice ?? minPrice,
        maxPrice: filterParams?.maxPrice ?? maxPrice,
      });
      const sorted = sortCatalogCardProducts(fetched, sortBy);
      setExpandedProducts(sorted);
      return sorted;
    } catch {
      return null;
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    brand,
    categorySlug,
    colors,
    expandedProducts,
    filterParams?.brand,
    filterParams?.colors,
    filterParams?.maxPrice,
    filterParams?.minPrice,
    filterParams?.search,
    filterParams?.sizes,
    initialProducts.length,
    lang,
    maxPrice,
    minPrice,
    prefetchedProducts,
    rowTotal,
    search,
    sizes,
    sort,
    sortBy,
  ]);

  const handleExpand = async () => {
    const nextVisibleRows = Math.min(maxRows, visibleRows + 1);
    const neededCount = nextVisibleRows * columnsPerRow;

    if (neededCount > products.length && needsFetch) {
      await loadFullRowProducts();
    }

    setVisibleRows(nextVisibleRows);
  };

  const roundNavBtnClass =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff4de] text-[#2F3F3D] shadow-md transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff4de]/80 sm:h-12 sm:w-12 disabled:opacity-60 disabled:pointer-events-none';

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-gray-500">{t('products.grid.noProducts')}</p>
      </div>
    );
  }

  const displayedCards = Array.from({ length: shownCount }, (_, index) => {
    const product = products[index];
    if (!product) return null;

    const useServerChild = hasServerChildren && index < serverChildren.length;
    return (
      <div key={product.id} className={CATALOG_CARD_GRID_CELL_CLASS}>
        {useServerChild ? (
          serverChildren[index]
        ) : (
          <CatalogProductCardClient product={product} />
        )}
      </div>
    );
  });

  return (
    <div className="relative flex flex-col items-stretch gap-3 sm:gap-4 md:flex-row md:items-center md:gap-6">
      <div
        className="order-2 grid min-w-0 w-full flex-1 gap-x-2 gap-y-16 pb-10 pt-2 sm:gap-x-3 sm:gap-y-20 sm:pb-12 sm:pt-3 md:order-1 md:gap-x-4 md:gap-y-16 md:pb-12 lg:gap-x-5 lg:gap-y-20"
        style={{ gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))` }}
      >
        {displayedCards}
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
              onClick={() => setVisibleRows((rows) => Math.max(1, rows - 1))}
              className={roundNavBtnClass}
              aria-label={t('products.grid.showFewer')}
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
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
                <svg
                  className="h-5 w-5 animate-spin sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

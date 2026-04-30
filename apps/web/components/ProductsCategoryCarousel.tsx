'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from './ProductCard';
import { useVisibleCards } from './hooks/useVisibleCards';
import { useTranslation } from '../lib/i18n-client';

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
  brand: { id: string; name: string } | null;
  category?: string;
}

interface ProductsCategoryCarouselProps {
  products: Product[];
  sortBy?: string;
  /** Mobile: at least this many columns (matches prior carousel min width). */
  minVisibleCards?: number;
}

const MOBILE_BREAKPOINT = 768;

export function ProductsCategoryCarousel({
  products: rawProducts,
  sortBy = 'default',
  minVisibleCards,
}: ProductsCategoryCarouselProps) {
  const { t } = useTranslation();
  const visibleFromHook = useVisibleCards();
  const columnsPerRow =
    minVisibleCards != null ? Math.max(visibleFromHook, minVisibleCards) : visibleFromHook;
  const [isMobile, setIsMobile] = useState(false);
  const [visibleRows, setVisibleRows] = useState(1);

  useEffect(() => {
    const check = () =>
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const products = useMemo(() => {
    const sorted = [...rawProducts];
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
  }, [rawProducts, sortBy]);

  useEffect(() => {
    setVisibleRows(1);
  }, [columnsPerRow, products.length]);

  const maxRows = columnsPerRow > 0 ? Math.ceil(products.length / columnsPerRow) : 1;
  const shownCount = Math.min(products.length, visibleRows * columnsPerRow);
  const displayed = products.slice(0, shownCount);
  const canExpand = visibleRows < maxRows;
  const canCollapse = visibleRows > 1;
  const showRowControls = maxRows > 1;

  const roundNavBtnClass =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff4de] text-[#2F3F3D] shadow-md transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff4de]/80 sm:h-12 sm:w-12';

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('products.grid.noProducts')}</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-row items-center gap-3 sm:gap-4 md:gap-6">
      <div
        className="min-w-0 flex-1 grid gap-x-3 gap-y-12 pt-24 pb-14 sm:gap-x-3.5 sm:gap-y-14 sm:pt-28 sm:pb-16 md:gap-x-4 md:gap-y-16 md:pt-32 md:pb-20 lg:gap-x-5 lg:gap-y-20 lg:pt-36"
        style={{ gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))` }}
      >
        {displayed.map((product) => (
          <div
            key={product.id}
            className="min-w-0 px-1.5 pb-8 sm:px-2 md:px-2.5 md:pb-10"
          >
            <ProductCard
              product={{
                ...product,
                compareAtPrice: product.compareAtPrice ?? undefined,
                labels: undefined,
              }}
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
          className="flex shrink-0 flex-col items-center justify-center gap-2"
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
              onClick={() => setVisibleRows((r) => Math.min(maxRows, r + 1))}
              className={roundNavBtnClass}
              aria-label={t('products.grid.showMore')}
              aria-expanded={visibleRows > 1}
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

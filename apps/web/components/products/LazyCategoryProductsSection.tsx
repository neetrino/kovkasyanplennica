'use client';

import { useEffect, useRef, useState } from 'react';
import { ProductsCategoryCarousel } from '../ProductsCategoryCarousel';
import {
  fetchCategoryRowProducts,
  type CategoryRowFetchFilters,
} from './fetch-category-row-products';
import type { CatalogCardProduct } from './catalog-card-product';

type LazyCategoryProductsSectionProps = CategoryRowFetchFilters & {
  totalInRow: number;
  sortBy?: string;
  minVisibleCards?: number;
};

function CarouselPlaceholder() {
  return (
    <div
      className="grid grid-cols-2 gap-4 pb-10 pt-2 md:grid-cols-3 xl:grid-cols-4"
      aria-hidden
    >
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-[#364744]"
        >
          <div className="aspect-square animate-pulse bg-white/10" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LazyCategoryProductsSection({
  totalInRow,
  sortBy = 'default',
  minVisibleCards,
  categorySlug,
  lang,
  sort,
  search,
  colors,
  sizes,
  brand,
  minPrice,
  maxPrice,
}: LazyCategoryProductsSectionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [products, setProducts] = useState<CatalogCardProduct[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || products !== null) return;

    let cancelled = false;

    fetchCategoryRowProducts({
      categorySlug,
      lang,
      sort,
      search,
      colors,
      sizes,
      brand,
      minPrice,
      maxPrice,
    })
      .then((fetched) => {
        if (cancelled) return;
        setProducts(fetched);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
          setProducts([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    isVisible,
    products,
    categorySlug,
    lang,
    sort,
    search,
    colors,
    sizes,
    brand,
    minPrice,
    maxPrice,
  ]);

  const resolvedTotal = products?.length ?? totalInRow;

  return (
    <div ref={rootRef} className="min-h-[180px]">
      {!isVisible || products === null ? (
        <CarouselPlaceholder />
      ) : loadFailed && products.length === 0 ? (
        <CarouselPlaceholder />
      ) : (
        <ProductsCategoryCarousel
          products={products}
          totalInRow={resolvedTotal}
          categorySlug={categorySlug}
          sortBy={sortBy}
          lang={lang}
          filterParams={{ search, colors, sizes, brand, minPrice, maxPrice }}
          minVisibleCards={minVisibleCards}
        />
      )}
    </div>
  );
}

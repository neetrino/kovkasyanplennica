'use client';

import type { LanguageCode } from '@/lib/language';
import type { CatalogCardProduct } from './products/catalog-card-product';
import {
  ProductsCategoryExpandControls,
  type CategoryRowFilterParams,
} from './products/ProductsCategoryExpandControls';

export type { CategoryRowFilterParams };

interface ProductsCategoryCarouselProps {
  products: CatalogCardProduct[];
  sortBy?: string;
  categorySlug?: string;
  totalInRow?: number;
  lang?: string;
  filterParams?: CategoryRowFilterParams;
  minVisibleCards?: number;
}

/** Client-only category row renderer (lazy below-fold path). Uses catalog client cards, not global ProductCard. */
export function ProductsCategoryCarousel({
  products: initialProducts,
  sortBy = 'default',
  categorySlug = '',
  totalInRow,
  lang = 'ru',
  filterParams,
  minVisibleCards,
}: ProductsCategoryCarouselProps) {
  return (
    <ProductsCategoryExpandControls
      initialProducts={initialProducts}
      prefetchedProducts={initialProducts}
      totalInRow={totalInRow ?? initialProducts.length}
      categorySlug={categorySlug}
      sortBy={sortBy}
      lang={lang as LanguageCode}
      filterParams={filterParams}
      minVisibleCards={minVisibleCards}
    />
  );
}

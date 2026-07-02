'use client';

import dynamic from 'next/dynamic';
import type { ProductsMobileCategoriesDrawerProps } from './ProductsMobileCategoriesDrawer';

const ProductsMobileCategoriesDrawer = dynamic(
  () =>
    import('./ProductsMobileCategoriesDrawer').then(
      (mod) => mod.ProductsMobileCategoriesDrawer
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-12 w-[129px] shrink-0 rounded-full bg-white/10 animate-pulse"
        aria-hidden
      />
    ),
  }
);

export function ProductsMobileCategoriesDrawerLazy(
  props: ProductsMobileCategoriesDrawerProps
) {
  return <ProductsMobileCategoriesDrawer {...props} />;
}

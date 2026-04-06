'use client';

import { useState } from 'react';
import type { MouseEvent } from 'react';
import { useAddToCart } from './hooks/useAddToCart';
import { useCurrency } from './hooks/useCurrency';
import { ProductCardList } from './ProductCard/ProductCardList';
import { ProductCardGrid } from './ProductCard/ProductCardGrid';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  inStock: boolean;
  /** Cheapest variant id from list API — instant add-to-cart without extra product fetch */
  defaultVariantId?: string | null;
  stock?: number;
  brand: {
    id: string;
    name: string;
  } | null;
  labels?: import('./ProductLabels').ProductLabel[];
  compareAtPrice?: number | null;
  originalPrice?: number | null;
  globalDiscount?: number | null;
  discountPercent?: number | null;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  calories?: number;
  category?: string;
}

type ViewMode = 'list' | 'grid-2' | 'grid-3';

interface ProductCardProps {
  product: Product;
  viewMode?: ViewMode;
  /** Մոբայլում քարտի բարձրությունը փոքր (compact) */
  compactHeight?: boolean;
  /** Home page (Menu/Favorites) — ավելի մեծ քարտ, menu-ի նման */
  largeSize?: boolean;
  /** 1024+ էկրաններում ավելի մեծ height (products carousel) */
  largeHeightOnDesktop?: boolean;
  /** Products page mobile — ավելի մեծ կլոր պատկեր compact ռեժիմում */
  largeCompactImage?: boolean;
}

/**
 * Product card component with Cart action
 * Displays product image, title, category, price and add to cart button
 */
export function ProductCard({
  product,
  viewMode = 'grid-3',
  compactHeight = false,
  largeSize = false,
  largeHeightOnDesktop = false,
  largeCompactImage = false,
}: ProductCardProps) {
  const isCompact = viewMode === 'grid-3';
  const currency = useCurrency();
  const { isAddingToCart, addToCart } = useAddToCart({
    productId: product.id,
    productSlug: product.slug,
    inStock: product.inStock,
    defaultVariantId: product.defaultVariantId ?? null,
    listingPrice: product.price,
    title: product.title,
    image: product.image,
    stock: product.stock,
    originalPrice: product.originalPrice ?? product.compareAtPrice ?? null,
  });
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart();
  };

  if (viewMode === 'list') {
    return (
      <ProductCardList
        product={product}
        currency={currency}
        isAddingToCart={isAddingToCart}
        imageError={imageError}
        onImageError={() => setImageError(true)}
        onAddToCart={handleAddToCart}
      />
    );
  }

  return (
    <ProductCardGrid
      product={product}
      currency={currency}
      isAddingToCart={isAddingToCart}
      imageError={imageError}
      isCompact={isCompact}
      compactHeight={compactHeight}
      largeSize={largeSize}
      largeHeightOnDesktop={largeHeightOnDesktop}
      largeCompactImage={largeCompactImage}
      onImageError={() => setImageError(true)}
      onAddToCart={handleAddToCart}
    />
  );
}


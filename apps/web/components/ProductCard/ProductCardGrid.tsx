'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { MouseEvent } from 'react';
import { ProductCardInfo } from './ProductCardInfo';
import { ProductCardActions } from './ProductCardActions';
import type { CurrencyCode } from '../../lib/currency';
import type { ProductLabel } from '../ProductLabels';

interface ProductCardGridProps {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    image: string | null;
    inStock: boolean;
    brand: { id: string; name: string } | null;
    labels?: ProductLabel[];
    compareAtPrice?: number | null;
    originalPrice?: number | null;
    discountPercent?: number | null;
    colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  };
  currency: CurrencyCode;
  isInWishlist: boolean;
  isInCompare: boolean;
  isAddingToCart: boolean;
  imageError: boolean;
  isCompact?: boolean;
  compactHeight?: boolean;
  largeSize?: boolean;
  /** 1024+ էկրաններում ավելի մեծ height (products carousel) */
  largeHeightOnDesktop?: boolean;
  onImageError: () => void;
  onWishlistToggle: (e: MouseEvent) => void;
  onCompareToggle: (e: MouseEvent) => void;
  onAddToCart: (e: MouseEvent) => void;
}

/**
 * Grid view layout for ProductCard
 */
export function ProductCardGrid({
  product,
  currency,
  isInWishlist,
  isInCompare,
  isAddingToCart,
  imageError,
  isCompact = false,
  compactHeight = false,
  largeSize = false,
  largeHeightOnDesktop = false,
  onImageError,
  onWishlistToggle,
  onCompareToggle,
  onAddToCart,
}: ProductCardGridProps) {
  return (
    <div
      className={`relative bg-white rounded-[35px] shadow-[15px_15px_15px_0px_rgba(0,0,0,0.08)] overflow-visible group flex flex-col h-full w-full ${
        compactHeight
          ? largeHeightOnDesktop
            ? 'min-h-[180px] lg:min-h-[280px]'
            : 'min-h-[180px]'
          : largeSize
            ? 'min-h-[320px]'
            : 'min-h-[240px]'
      }`}
    >
      {/* Product Image - Circular plate at top, half outside card, half inside */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[50%] aspect-square z-10 ${
          compactHeight
            ? largeHeightOnDesktop
              ? 'w-[45%] lg:w-[52%]'
              : 'w-[45%]'
            : largeSize
              ? 'w-[58%]'
              : 'w-[50%]'
        }`}
      >
        <Link
          href="/coming-soon"
          className="relative w-full h-full rounded-full overflow-hidden bg-transparent shadow-lg block"
        >
          {product.image && !imageError ? (
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-cover rounded-full"
              sizes="223px"
              unoptimized
              onError={onImageError}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </Link>
      </div>
      
      {/* Action Buttons - Show on Hover */}
      <div className="absolute top-[8%] right-3 z-20">
        <ProductCardActions
          isInWishlist={isInWishlist}
          isInCompare={isInCompare}
          isAddingToCart={isAddingToCart}
          inStock={product.inStock}
          isCompact={isCompact}
          onWishlistToggle={onWishlistToggle}
          onCompareToggle={onCompareToggle}
          onAddToCart={onAddToCart}
          showOnHover={true}
        />
      </div>

      {/* Product Info - relative z-20 so title, price and cart stay above the product image */}
      <div
        className={`relative z-20 flex-1 flex flex-col px-[6.17%] ${
          compactHeight
            ? largeHeightOnDesktop
              ? 'pt-[14%] pb-[4%] lg:pt-[18%] lg:pb-[8%]'
              : 'pt-[14%] pb-[4%]'
            : largeSize
              ? 'pt-[20%] pb-[10%]'
              : 'pt-[18%] pb-[8%]'
        }`}
      >
        <ProductCardInfo
          slug={product.slug}
          title={product.title}
          brandName={product.brand?.name}
          price={product.price}
          originalPrice={product.originalPrice}
          compareAtPrice={product.compareAtPrice}
          discountPercent={product.discountPercent}
          currency={currency}
          colors={product.colors}
          calories={(product as { calories?: number }).calories}
          category={product.category}
          isCompact={isCompact || compactHeight}
          compactHeight={compactHeight}
          largeSize={largeSize}
          largeHeightOnDesktop={largeHeightOnDesktop}
          inStock={product.inStock}
          isAddingToCart={isAddingToCart}
          onAddToCart={onAddToCart}
        />
      </div>
    </div>
  );
}

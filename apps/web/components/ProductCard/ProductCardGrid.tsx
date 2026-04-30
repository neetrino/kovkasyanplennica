'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCardInfo } from './ProductCardInfo';
import type { CurrencyCode } from '../../lib/currency';
import type { ProductLabel } from '../ProductLabels';
import { prefetchProductByIntent } from '@/lib/product-intent-prefetch';

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
    category?: string;
    description?: string | null;
  };
  currency: CurrencyCode;
  isAddingToCart: boolean;
  imageError: boolean;
  isCompact?: boolean;
  compactHeight?: boolean;
  largeSize?: boolean;
  /** 1024+ էկրաններում ավելի մեծ height (products carousel) */
  largeHeightOnDesktop?: boolean;
  /** Products page mobile — մեծ կլոր պատկեր */
  largeCompactImage?: boolean;
  onImageError: () => void;
  onAddToCart: (e: MouseEvent) => void;
}

/**
 * Grid view layout for ProductCard
 */
export function ProductCardGrid({
  product,
  currency,
  isAddingToCart,
  imageError,
  isCompact = false,
  compactHeight = false,
  largeSize = false,
  largeHeightOnDesktop = false,
  largeCompactImage = false,
  onImageError,
  onAddToCart,
}: ProductCardGridProps) {
  const router = useRouter();
  const normalizedSlug = product.slug.trim();
  const productHref = normalizedSlug ? `/products/${encodeURIComponent(normalizedSlug)}` : '/products';
  const imageSizesAttr = largeCompactImage && compactHeight ? 'min(60vw, 280px)' : '223px';
  const handleProductIntent = useCallback(() => {
    prefetchProductByIntent(router, product.slug);
  }, [router, product.slug]);

  return (
    <div
      className={`relative bg-white rounded-[35px] shadow-[15px_15px_15px_0px_rgba(0,0,0,0.08)] overflow-visible group flex flex-col h-full w-full ${
        compactHeight
          ? largeHeightOnDesktop
            ? 'min-h-[180px] lg:min-h-[280px]'
            : largeCompactImage
              ? 'min-h-[172px]'
              : 'min-h-[180px]'
          : largeSize
            ? 'min-h-[320px]'
            : 'min-h-[240px]'
      }`}
    >
      <Link
        href={productHref}
        prefetch
        onMouseEnter={handleProductIntent}
        onTouchStart={handleProductIntent}
        onFocus={handleProductIntent}
        className="absolute inset-0 z-[1] rounded-[35px] outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        aria-label={`${product.title} — view product`}
      />
      <div className="relative z-[2] flex flex-col h-full w-full pointer-events-none">
        {/* Product Image - Circular plate at top, half outside card, half inside */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[50%] aspect-square z-10 origin-center transition-transform duration-700 ease-in-out lg:group-hover:scale-[1.5] lg:group-hover:z-20 ${
            compactHeight
              ? largeHeightOnDesktop
                ? 'w-[45%] lg:w-[52%]'
                : largeCompactImage
                  ? 'w-[58%]'
                  : 'w-[45%]'
              : largeSize
                ? 'w-[58%]'
                : 'w-[50%]'
          }`}
        >
          <div className="relative w-full h-full bg-transparent block">
            {product.image && !imageError ? (
              <Image
                src={product.image}
                alt=""
                fill
                className="object-contain transition-transform duration-700 ease-in-out lg:group-hover:rotate-[30deg]"
                sizes={imageSizesAttr}
                unoptimized
                onError={onImageError}
                aria-hidden
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center" aria-hidden>
                <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Product Info - relative z-20 so title, price and cart stay above the product image */}
        <div
          className={`relative z-20 flex-1 flex flex-col px-[6.17%] ${
            compactHeight
              ? largeHeightOnDesktop
                ? 'pt-[14%] pb-[4%] lg:pt-[18%] lg:pb-[8%]'
                : largeCompactImage
                  ? 'pt-[20%] pb-[4%]'
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
            description={product.description}
            category={product.category}
            isCompact={isCompact || compactHeight}
            compactHeight={compactHeight}
            largeSize={largeSize}
            largeHeightOnDesktop={largeHeightOnDesktop}
            largeCompactImage={largeCompactImage}
            inStock={product.inStock}
            isAddingToCart={isAddingToCart}
            onAddToCart={onAddToCart}
            omitProductTitleLink
          />
        </div>
      </div>
    </div>
  );
}

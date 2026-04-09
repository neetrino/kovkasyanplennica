'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { MouseEvent } from 'react';
import { formatPrice } from '../../lib/currency';
import { useTranslation } from '../../lib/i18n-client';
import type { CurrencyCode } from '../../lib/currency';

interface ProductCardInfoProps {
  slug: string;
  title: string;
  brandName?: string | null;
  price: number;
  originalPrice?: number | null;
  compareAtPrice?: number | null;
  discountPercent?: number | null;
  currency: CurrencyCode;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  description?: string | null;
  category?: string;
  isCompact?: boolean;
  compactHeight?: boolean;
  largeSize?: boolean;
  /** 1024+ — price/cart block ավելի ցածր */
  largeHeightOnDesktop?: boolean;
  /** Products page mobile — ավելի ցածր քարտ */
  largeCompactImage?: boolean;
  inStock?: boolean;
  isAddingToCart?: boolean;
  onAddToCart?: (e: MouseEvent) => void;
}

/**
 * Component for displaying product information (title, brand, price, colors)
 * Figma design implementation
 */
export function ProductCardInfo({
  slug,
  title,
  brandName,
  price,
  originalPrice,
  compareAtPrice,
  discountPercent,
  currency,
  colors,
  description,
  category,
  isCompact = false,
  compactHeight = false,
  largeSize = false,
  largeHeightOnDesktop = false,
  largeCompactImage = false,
  inStock = true,
  isAddingToCart = false,
  onAddToCart,
}: ProductCardInfoProps) {
  const { t } = useTranslation();
  const categoryValue = category || brandName || t('common.defaults.category');

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(e);
    }
  };

  return (
    <div
      className={`w-full h-full flex flex-col ${
        compactHeight ? (largeCompactImage ? 'mt-5' : 'mt-6') : 'mt-12'
      }`}
    >
      <Link href="/coming-soon" className="block">
        {/* Product Title - Centered, Bold */}
        <h3
          className={`text-center font-bold text-black ${
            compactHeight ? 'text-[14px] mb-1 min-h-[34px] leading-[17px]' : 'text-[20px] mb-2 min-h-[56px] leading-[28px]'
          }`}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </h3>
      </Link>

      {/* Description - Centered, Grey, Semibold */}
      {description && description.trim() && (
        <p className={`text-center font-semibold text-[#acacac] leading-normal ${compactHeight ? 'text-[12px] mb-1' : 'text-[16px] mb-3'}`}>
          {description}
        </p>
      )}

      {/* Divider Line */}
      <div className={`w-full mx-auto border-t border-[rgba(172,172,172,0.2)] ${compactHeight ? 'mb-1' : 'mb-3'}`} />

      {/* Category - fixed row regardless of title length */}
      <div className={`flex items-center justify-between gap-2 ${compactHeight ? 'mb-1' : 'mb-3'}`}>
        <span className={`font-medium text-[#5c5c5c] leading-normal ${compactHeight ? 'text-[12px]' : 'text-[16px]'}`}>
          {t('common.navigation.categories')}
        </span>
        <p
          className={`text-right font-medium text-[#acacac] leading-normal truncate ${compactHeight ? 'text-[12px]' : 'text-[16px]'}`}
          title={categoryValue}
        >
          {categoryValue}
        </p>
      </div>

      {/* Price Section - Figma design: Цена (left) | Cart Button (center) | Price (right) */}
      <div
        className={`relative mt-auto flex items-center justify-between ${
          compactHeight
            ? largeCompactImage
              ? 'pt-2 pb-2'
              : 'pt-3 pb-3'
            : 'pt-8 pb-[25px]'
        } ${largeHeightOnDesktop ? 'lg:mt-6 lg:pt-8 lg:pb-6' : ''}`}
      >
        {/* Price Label - Left, Grey, Medium */}
        <span className={`font-medium text-[#5c5c5c] leading-normal whitespace-pre-wrap ${compactHeight ? 'text-[12px]' : 'text-[16px]'}`}>
          {t('common.price')}
        </span>
        
        {/* Cart Button - Center, Green circular button, half outside card bottom */}
        {onAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={!inStock || isAddingToCart}
            className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-[#87CB6F] flex items-center justify-center transition-all duration-200 hover:bg-[#7ab85f] disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md z-30 ${
              largeCompactImage
                ? 'bottom-0 translate-y-1/2 w-[52px] h-[52px]'
                : compactHeight
                  ? 'bottom-[-8px] translate-y-1/2 w-10 h-10'
                  : 'bottom-[-8px] translate-y-1/2 w-[58px] h-[58px]'
            }`}
            title={inStock ? t('common.buttons.addToCart') : t('common.stock.outOfStock')}
            aria-label={inStock ? t('common.ariaLabels.addToCart') : t('common.ariaLabels.outOfStock')}
          >
            {isAddingToCart ? (
              <svg
                className={`animate-spin text-white ${largeCompactImage ? 'h-7 w-7' : 'h-6 w-6'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Image
                src="/assets/product-card/cart-icon-white.svg"
                alt="Cart"
                width={largeCompactImage ? 28 : 24}
                height={largeCompactImage ? 28 : 24}
                className="object-contain"
              />
            )}
          </button>
        )}
        
        {/* Price Value - Right, Bold, aligned with price label */}
        <div className="flex items-center gap-2 ml-auto">
          <span className={`font-black text-black leading-normal whitespace-pre-wrap ${compactHeight ? 'text-sm' : 'text-lg'}`}>
            {formatPrice(price || 0, currency)}
          </span>
          {discountPercent && discountPercent > 0 ? (
            <span className="text-sm font-semibold text-blue-600">
              -{discountPercent}%
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}









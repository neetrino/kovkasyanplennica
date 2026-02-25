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
  calories?: number;
  category?: string;
  isCompact?: boolean;
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
  calories,
  category,
  isCompact = false,
  inStock = true,
  isAddingToCart = false,
  onAddToCart,
}: ProductCardInfoProps) {
  const { t } = useTranslation();

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(e);
    }
  };

  return (
    <div className="w-full mt-12">
      <Link href="/coming-soon" className="block">
        {/* Product Title - Centered, Bold, 20px */}
        <h3 className="text-center text-[20px] font-bold text-black mb-2 leading-normal">
          {title}
        </h3>
      </Link>

      {/* Calories - Centered, Grey, 16px, Semibold */}
      {calories && (
        <p className="text-center text-[16px] font-semibold text-[#acacac] mb-3 leading-normal">
          {calories} {t('common.calories')}
        </p>
      )}

      {/* Divider Line */}
      <div className="w-full mx-auto border-t border-[rgba(172,172,172,0.2)] mb-3" />

      {/* Category - Left aligned, Grey, 16px, Medium */}
      <div className="mb-3">
        <p className="text-left text-[16px] font-medium text-[#acacac] leading-normal">
          {category || brandName || t('common.defaults.category')}
        </p>
      </div>

      {/* Price Section - Figma design: Цена (left) | Cart Button (center) | Price (right) */}
      <div className="relative flex items-center justify-between pt-8 pb-[25px]">
        {/* Price Label - Left, Grey, 16px, Medium */}
        <span className="text-[16px] font-medium text-[#5c5c5c] leading-normal whitespace-pre-wrap">
          {t('common.price')}
        </span>
        
        {/* Cart Button - Center, Green circular button, 58x58px, half outside card bottom */}
        {onAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={!inStock || isAddingToCart}
            className="absolute left-1/2 -translate-x-1/2 bottom-[-20px] translate-y-1/2 w-[58px] h-[58px] rounded-full bg-[#87CB6F] flex items-center justify-center transition-all duration-200 hover:bg-[#7ab85f] disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md z-10"
            title={inStock ? t('common.buttons.addToCart') : t('common.stock.outOfStock')}
            aria-label={inStock ? t('common.ariaLabels.addToCart') : t('common.ariaLabels.outOfStock')}
          >
            {isAddingToCart ? (
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Image
                src="/assets/product-card/cart-icon-white.svg"
                alt="Cart"
                width={24}
                height={24}
                className="object-contain"
              />
            )}
          </button>
        )}
        
        {/* Price Value - Right, Bold, smaller size, aligned with price label */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-lg font-black text-black leading-normal whitespace-pre-wrap">
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









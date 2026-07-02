'use client';

import type { MouseEvent } from 'react';
import Image from 'next/image';
import { toR2Url } from '@/lib/r2-assets';
import { formatPrice } from '@/lib/currency';
import { useTranslation } from '@/lib/i18n-client';
import { useCurrency } from '../hooks/useCurrency';
import { useAddToCart } from '../hooks/useAddToCart';

export type ProductCardCatalogIslandsProps = {
  productId: string;
  slug: string;
  title: string;
  image?: string | null;
  price: number;
  compareAtPrice?: number | null;
  defaultVariantId?: string | null;
  stock?: number | null;
  inStock: boolean;
  discountPercent?: number | null;
};

export function ProductCardCatalogIslands({
  productId,
  slug,
  title,
  image,
  price,
  compareAtPrice,
  defaultVariantId,
  stock,
  inStock,
  discountPercent,
}: ProductCardCatalogIslandsProps) {
  const { t } = useTranslation();
  const currency = useCurrency();
  const { isAddingToCart, addToCart } = useAddToCart({
    productId,
    productSlug: slug,
    inStock,
    defaultVariantId: defaultVariantId ?? null,
    listingPrice: price,
    title,
    image: image ?? null,
    stock: stock ?? undefined,
    originalPrice: compareAtPrice ?? null,
  });

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={!inStock || isAddingToCart}
        className="pointer-events-auto absolute bottom-0 left-1/2 z-30 flex h-[46px] w-[46px] -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-[#87CB6F] shadow-md transition-all duration-200 hover:bg-[#7ab85f] disabled:cursor-not-allowed disabled:bg-gray-300 md:bottom-[-8px] md:h-[52px] md:w-[52px]"
        title={inStock ? t('common.buttons.addToCart') : t('common.stock.outOfStock')}
        aria-label={inStock ? t('common.ariaLabels.addToCart') : t('common.ariaLabels.outOfStock')}
      >
        {isAddingToCart ? (
          <svg
            className="h-6 w-6 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <Image
            src={toR2Url('/assets/product-card/cart-icon-white.svg')}
            alt=""
            width={24}
            height={24}
            className="object-contain"
            aria-hidden
          />
        )}
      </button>
      <div className="ml-auto flex items-center gap-2">
        <span
          suppressHydrationWarning
          className="whitespace-pre-wrap text-sm font-black leading-normal text-black md:text-base"
        >
          {formatPrice(price || 0, currency)}
        </span>
        {discountPercent && discountPercent > 0 ? (
          <span className="text-sm font-semibold text-blue-600">-{discountPercent}%</span>
        ) : null}
      </div>
    </>
  );
}

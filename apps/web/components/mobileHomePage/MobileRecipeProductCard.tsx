'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MouseEvent } from 'react';
import { useAddToCart } from '../hooks/useAddToCart';
import { useCurrency } from '../hooks/useCurrency';
import { useTranslation } from '../../lib/i18n-client';
import { formatPrice } from '../../lib/currency';
export type MobileRecipeProductCardProps = {
  id: string;
  slug: string;
  title: string;
  imageSrc: string | null;
  price: number;
  defaultVariantId?: string | null;
  inStock: boolean;
  stock?: number;
  originalPrice?: number | null;
  compareAtPrice?: number | null;
};

export function MobileRecipeProductCard({
  id,
  slug,
  title,
  imageSrc,
  price,
  defaultVariantId,
  inStock,
  stock,
  originalPrice,
  compareAtPrice,
}: MobileRecipeProductCardProps) {
  const { t } = useTranslation();
  const currency = useCurrency();
  const { isAddingToCart, addToCart } = useAddToCart({
    productId: id,
    productSlug: slug,
    inStock,
    defaultVariantId: defaultVariantId ?? null,
    listingPrice: price,
    title,
    image: imageSrc,
    stock,
    originalPrice: originalPrice ?? compareAtPrice ?? null,
  });

  const href = `/products/${slug}`;

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void addToCart();
  };

  return (
    <article className="w-[200px] shrink-0 rounded-2xl bg-white p-4 shadow-[0_2px_16px_rgba(6,51,54,0.1)]">
      <Link href={href} className="block text-inherit no-underline">
        <div className="relative mb-4 flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl bg-[#f1f5f5]">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-contain object-center"
              sizes="200px"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#eef1f3]">
              <span className="text-[12px] text-[#97a2b0]">{title.slice(0, 1)}</span>
            </div>
          )}
        </div>
        <h3 className="mb-2 text-[16px] font-bold leading-[1.35] text-[#0a2533]">{title}</h3>
      </Link>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[15px] font-bold leading-[1.35] text-[#0a2533]">
          {formatPrice(price, currency)}
        </span>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock || isAddingToCart}
          className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#87CB6F] shadow-md transition-colors hover:bg-[#7ab85f] disabled:cursor-not-allowed disabled:bg-gray-300"
          title={inStock ? t('common.buttons.addToCart') : t('common.stock.outOfStock')}
          aria-label={inStock ? t('common.ariaLabels.addToCart') : t('common.ariaLabels.outOfStock')}
        >
          {isAddingToCart ? (
            <svg
              className="h-5 w-5 animate-spin text-white"
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
              src="/assets/product-card/cart-icon-white.svg"
              alt=""
              width={20}
              height={20}
              className="object-contain"
              aria-hidden
            />
          )}
        </button>
      </div>
    </article>
  );
}

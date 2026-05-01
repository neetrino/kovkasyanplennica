'use client';

import { useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { formatPrice, type CurrencyCode } from '@/lib/currency';
import { t, getProductText } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/language';
import {
  getGuestStorageQtyForVariant,
  mergeGuestCartLine,
} from '@/lib/guest-cart/mergeGuestCartLine';
import { logger } from '@/lib/utils/logger';
import { ProductAttributesSelector } from './ProductAttributesSelector';
import type { Product, ProductVariant, AttributeGroupValue } from './types';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves image URL for guest-cart snapshot (aligned with hydrateGuestCart display).
 */
function resolveSnapshotImage(product: Product, variant: ProductVariant | null): string | null {
  if (variant?.imageUrl?.trim()) {
    return variant.imageUrl.trim();
  }
  const first = product.media?.[0];
  if (typeof first === 'string') return first || null;
  if (first && typeof first === 'object' && 'url' in first) {
    return (first as { url?: string }).url ?? null;
  }
  return null;
}

interface ProductInfoAndActionsProps {
  product: Product;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
  currency: string;
  language: LanguageCode;
  averageRating: number;
  quantity: number;
  maxQuantity: number;
  isOutOfStock: boolean;
  isVariationRequired: boolean;
  hasUnavailableAttributes: boolean;
  unavailableAttributes: Map<string, boolean>;
  canAddToCart: boolean;
  isLoggedIn: boolean;
  currentVariant: ProductVariant | null;
  attributeGroups: Map<string, AttributeGroupValue[]>;
  selectedColor: string | null;
  selectedSize: string | null;
  selectedAttributeValues: Map<string, string>;
  colorGroups: Array<{ color: string; stock: number; variants: ProductVariant[] }>;
  sizeGroups: Array<{ size: string; stock: number; variants: ProductVariant[] }>;
  onQuantityAdjust: (delta: number) => void;
  onResetQuantity: () => void;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
  onAttributeValueSelect: (attrKey: string, value: string) => void;
  getOptionValue: (options: ProductVariant['options'] | undefined, key: string) => string | null;
  getRequiredAttributesMessage: () => string;
}

export function ProductInfoAndActions({
  product,
  price,
  originalPrice,
  compareAtPrice,
  discountPercent,
  currency,
  language,
  averageRating: _averageRating,
  quantity,
  maxQuantity,
  isOutOfStock,
  isVariationRequired,
  hasUnavailableAttributes,
  unavailableAttributes,
  canAddToCart,
  isLoggedIn: _isLoggedIn,
  currentVariant,
  attributeGroups,
  selectedColor,
  selectedSize,
  selectedAttributeValues,
  colorGroups,
  sizeGroups,
  onQuantityAdjust,
  onResetQuantity,
  onColorSelect,
  onSizeSelect,
  onAttributeValueSelect,
  getOptionValue,
  getRequiredAttributesMessage,
}: ProductInfoAndActionsProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartNotice, setCartNotice] = useState<string | null>(null);

  const bannerMessage = cartNotice;

  const title = getProductText(language, product.id, 'title') || product.title;
  const portionLine =
    getProductText(language, product.id, 'subtitle').trim() ||
    (typeof product.subtitle === 'string' ? product.subtitle.trim() : '');

  const shortForIngredients = getProductText(language, product.id, 'shortDescription').trim();
  const longRaw = getProductText(language, product.id, 'longDescription') || product.description || '';
  const ingredientsLine =
    shortForIngredients ||
    (longRaw ? stripHtml(longRaw).slice(0, 220) + (stripHtml(longRaw).length > 220 ? '…' : '') : '');

  const handleAddToCart = useCallback(async () => {
    if (!canAddToCart || !currentVariant) return;

    const slug = product.slug?.trim();
    if (!slug || slug.includes(' ')) {
      alert(t(language, 'common.alerts.invalidProduct'));
      return;
    }

    const stock = currentVariant.stock;
    const titleForCart = getProductText(language, product.id, 'title') || product.title;
    const imageUrl = resolveSnapshotImage(product, currentVariant);
    const linePrice = price;
    const lineOriginal = originalPrice ?? compareAtPrice ?? null;

    const inCartQty = getGuestStorageQtyForVariant(product.id, currentVariant.id);
    const nextTotal = inCartQty + quantity;
    if (nextTotal > stock) {
      alert(t(language, 'common.alerts.noMoreStockAvailable'));
      return;
    }

    const linePayload = {
      productId: product.id,
      variantId: currentVariant.id,
      productSlug: slug,
      addQuantity: quantity,
      title: titleForCart,
      image: imageUrl,
      price: linePrice,
      originalPrice: lineOriginal,
      sku: currentVariant.sku,
      stock,
    };

    setIsAddingToCart(true);
    try {
      mergeGuestCartLine(linePayload);
      window.dispatchEvent(new Event('cart-updated'));
      setCartNotice(`${t(language, 'product.addedToCart')} ${quantity} ${t(language, 'product.pcs')}`);
    } catch (e: unknown) {
      logger.error('Add to cart failed', { error: e, productId: product.id });
      setCartNotice(t(language, 'product.errorAddingToCart'));
    } finally {
      setIsAddingToCart(false);
      setTimeout(() => setCartNotice(null), 2000);
    }
  }, [
    canAddToCart,
    compareAtPrice,
    currentVariant,
    language,
    originalPrice,
    price,
    product.id,
    product.slug,
    quantity,
  ]);

  const qtyForLine = Math.max(quantity, 1);
  const lineSubtotal = price * qtyForLine;

  return (
    <div className="font-roboto flex h-full min-h-0 flex-col text-[#ffe5c2]">
      <div className="min-h-0 flex-1 space-y-0">
        {product.brand ? (
          <p className="mb-2 text-sm font-medium text-[#ffe5c2]/70">{product.brand.name}</p>
        ) : null}

        <h1 className="w-full text-[clamp(2rem,4.2vw,3.75rem)] font-bold leading-[1.07] tracking-tight text-[#ffe5c2]">
          {title}
        </h1>

        {portionLine ? (
          <p className="mt-1 w-full text-[22px] font-bold leading-snug text-[#ffe5c2]/[0.68] sm:text-[26px] lg:text-[28px]">
            {portionLine}
          </p>
        ) : null}

        {ingredientsLine ? (
          <p className="mt-2 line-clamp-3 w-full text-base font-light italic leading-[25px] text-[#ffe5c2]">
            {ingredientsLine}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-3">
            <p className="text-[34px] font-bold leading-none text-[#ffe5c2] sm:text-[38px] lg:text-[40px]">
              {formatPrice(price, currency as CurrencyCode)}
            </p>
            {discountPercent && discountPercent > 0 ? (
              <span className="text-base font-semibold text-white/90">-{discountPercent}%</span>
            ) : null}
          </div>
          {(originalPrice || (compareAtPrice && compareAtPrice > price)) && (
            <p className="text-lg text-[#acacac] line-through decoration-[#acacac]/80">
              {formatPrice(originalPrice || compareAtPrice || 0, currency as CurrencyCode)}
            </p>
          )}
        </div>

        <div className="mt-8 [&_label]:text-[#ffe5c2]/90 [&_span]:text-[#c8c8c8]">
          <ProductAttributesSelector
            product={product}
            attributeGroups={attributeGroups}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            selectedAttributeValues={selectedAttributeValues}
            unavailableAttributes={unavailableAttributes}
            colorGroups={colorGroups}
            sizeGroups={sizeGroups}
            language={language}
            quantity={quantity}
            maxQuantity={maxQuantity}
            isOutOfStock={isOutOfStock}
            isVariationRequired={isVariationRequired}
            hasUnavailableAttributes={hasUnavailableAttributes}
            canAddToCart={canAddToCart}
            isAddingToCart={isAddingToCart}
            onColorSelect={onColorSelect}
            onSizeSelect={onSizeSelect}
            onAttributeValueSelect={onAttributeValueSelect}
            onQuantityAdjust={onQuantityAdjust}
            onAddToCart={handleAddToCart}
            getOptionValue={getOptionValue}
            getRequiredAttributesMessage={getRequiredAttributesMessage}
          />
        </div>
      </div>

      <div className="mt-8 shrink-0 lg:mt-auto">
        {isVariationRequired && (
          <div className="mb-3 rounded-2xl border border-[#ffe5c2]/25 bg-[#ffe5c2]/10 p-3">
            <p className="text-sm font-medium text-[#ffe5c2]">{getRequiredAttributesMessage()}</p>
          </div>
        )}
        {hasUnavailableAttributes && !isVariationRequired && (
          <div className="mb-3 rounded-2xl border border-red-400/40 bg-red-950/30 p-3">
            <p className="text-sm font-medium text-red-200">
              {Array.from(unavailableAttributes.entries())
                .map(([attrKey]) => {
                  const productAttr = product?.productAttributes?.find(
                    (pa: { attribute?: { key?: string; name?: string } }) => pa.attribute?.key === attrKey,
                  );
                  const attributeName =
                    productAttr?.attribute?.name || attrKey.charAt(0).toUpperCase() + attrKey.slice(1);
                  return attrKey === 'color'
                    ? t(language, 'product.color')
                    : attrKey === 'size'
                      ? t(language, 'product.size')
                      : attributeName;
                })
                .join(', ')}{' '}
              {t(language, 'product.outOfStock')}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-[22px] pt-2">
          <div className="relative h-14 w-[161px] shrink-0 rounded-[80px] border-2 border-[#ffe5c2] bg-[rgba(255,229,194,0.12)]">
            <button
              type="button"
              onClick={() => onQuantityAdjust(-1)}
              disabled={quantity <= 1 || isOutOfStock || isVariationRequired}
              className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-2xl font-bold text-[#ffe5c2] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label={t(language, 'product.decreaseQuantity')}
            >
              −
            </button>
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[27px] font-bold leading-none text-[#ffe5c2]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityAdjust(1)}
              disabled={quantity >= maxQuantity || isOutOfStock || isVariationRequired}
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-2xl font-bold text-[#ffe5c2] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label={t(language, 'product.increaseQuantity')}
            >
              +
            </button>
          </div>

          <p className="text-[30px] font-bold leading-none text-[#ffe5c2] sm:text-[33px] lg:text-[35px]">
            {formatPrice(lineSubtotal, currency as CurrencyCode)}
          </p>

          <button
            type="button"
            disabled={!canAddToCart || isAddingToCart}
            className="h-14 min-w-[200px] shrink-0 rounded-[48px] bg-[#ffe5c2] px-6 text-base font-bold text-[#2f3f3d] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-white/50"
            onClick={() => void handleAddToCart()}
          >
            {isAddingToCart
              ? t(language, 'product.adding')
              : isOutOfStock
                ? t(language, 'product.outOfStock')
                : isVariationRequired
                  ? getRequiredAttributesMessage()
                  : hasUnavailableAttributes
                    ? t(language, 'product.outOfStock')
                    : t(language, 'product.addToCart')}
          </button>

          <button
            type="button"
            onClick={onResetQuantity}
            disabled={quantity <= 1 || isOutOfStock || isVariationRequired}
            className="flex size-14 shrink-0 items-center justify-center rounded-full border border-[#ffe5c2]/30 bg-[rgba(255,229,194,0.08)] text-[#ffe5c2] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={t(language, 'product.resetQuantityToOne')}
          >
            <Trash2 className="size-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {bannerMessage ? (
        <div className="mt-4 rounded-xl border border-[#ffe5c2]/20 bg-black/40 p-4 text-sm text-[#ffe5c2] shadow-lg backdrop-blur-sm">
          {bannerMessage}
        </div>
      ) : null}
    </div>
  );
}

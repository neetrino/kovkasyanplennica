'use client';

import { useState, useCallback } from 'react';
import { formatPrice, type CurrencyCode } from '@/lib/currency';
import { t, getProductText } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/language';
import {
  getGuestStorageQtyForVariant,
  mergeGuestCartLine,
} from '@/lib/guest-cart/mergeGuestCartLine';
import { logger } from '@/lib/utils/logger';
import { ProductAttributesSelector } from './ProductAttributesSelector';
import type { Product, ProductVariant } from './types';

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
  attributeGroups: Map<string, any[]>;
  selectedColor: string | null;
  selectedSize: string | null;
  selectedAttributeValues: Map<string, string>;
  colorGroups: Array<{ color: string; stock: number; variants: ProductVariant[] }>;
  sizeGroups: Array<{ size: string; stock: number; variants: ProductVariant[] }>;
  onQuantityAdjust: (delta: number) => void;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
  onAttributeValueSelect: (attrKey: string, value: string) => void;
  getOptionValue: (options: any[] | undefined, key: string) => string | null;
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
  averageRating,
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
  onColorSelect,
  onSizeSelect,
  onAttributeValueSelect,
  getOptionValue,
  getRequiredAttributesMessage,
}: ProductInfoAndActionsProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartNotice, setCartNotice] = useState<string | null>(null);

  const bannerMessage = cartNotice;

  const shortDescriptionLine =
    getProductText(language, product.id, 'shortDescription').trim() ||
    (typeof product.subtitle === 'string' ? product.subtitle.trim() : '');

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {product.brand && <p className="text-sm text-gray-500 mb-2">{product.brand.name}</p>}
        <h1 className="text-4xl font-bold text-[#FFE5C2] mb-4">
          {getProductText(language, product.id, 'title') || product.title}
        </h1>
        <div className="mb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-[#FFE5C2]">{formatPrice(price, currency as CurrencyCode)}</p>
              {discountPercent && discountPercent > 0 && (
                <span className="text-lg font-semibold text-blue-600">-{discountPercent}%</span>
              )}
            </div>
            {(originalPrice || (compareAtPrice && compareAtPrice > price)) && (
              <p className="text-xl text-gray-500 line-through decoration-gray-400 mt-1">
                {formatPrice(originalPrice || compareAtPrice || 0, currency as CurrencyCode)}
              </p>
            )}
          </div>
        </div>
        {shortDescriptionLine ? (
          <p className="text-base font-medium text-[#FFE5C2] mb-4 -mt-2">{shortDescriptionLine}</p>
        ) : null}
        <div
          className="text-gray-600 mb-8 prose prose-sm"
          dangerouslySetInnerHTML={{ __html: getProductText(language, product.id, 'longDescription') || product.description || '' }}
        />

        <div className="mb-8">
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

        <div className="mt-8">
          <div className="flex items-center">
            <div
              className="flex items-center gap-1"
              role="img"
              aria-label={
                averageRating > 0
                  ? `${averageRating.toFixed(1)} / 5`
                  : '0 / 5'
              }
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        {isVariationRequired && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">{getRequiredAttributesMessage()}</p>
          </div>
        )}
        {hasUnavailableAttributes && !isVariationRequired && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              {Array.from(unavailableAttributes.entries())
                .map(([attrKey]) => {
                  const productAttr = product?.productAttributes?.find((pa: any) => pa.attribute?.key === attrKey);
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
        <div className="flex items-center gap-3 pt-4 border-t border-[#FFE5C2]/60">
          <div className="flex items-center border border-[#FFE5C2] rounded-xl overflow-hidden bg-[#FFE5C2]/35">
            <button
              type="button"
              onClick={() => onQuantityAdjust(-1)}
              disabled={quantity <= 1}
              className="w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <div className="w-12 text-center font-bold">{quantity}</div>
            <button
              type="button"
              onClick={() => onQuantityAdjust(1)}
              disabled={quantity >= maxQuantity}
              className="w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          <button
            type="button"
            disabled={!canAddToCart || isAddingToCart}
            className="flex-1 h-12 bg-[#FFE5C2] text-gray-900 rounded-xl uppercase font-bold border border-[#e8cfa5] shadow-sm hover:bg-[#f5dcb0] transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
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
        </div>
      </div>
      {bannerMessage && (
        <div className="mt-4 p-4 bg-gray-900 text-white rounded-md shadow-lg">{bannerMessage}</div>
      )}
    </div>
  );
}

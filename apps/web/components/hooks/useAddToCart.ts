'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';
import {
  getGuestStorageQtyForVariant,
  mergeGuestCartLine,
} from '@/lib/guest-cart/mergeGuestCartLine';
import { logger } from '@/lib/utils/logger';

interface ProductDetails {
  id: string;
  slug: string;
  translations?: Array<{ title: string; locale: string }>;
  media?: Array<{ url?: string; src?: string } | string>;
  variants?: Array<{
    id: string;
    sku: string;
    price: number;
    stock: number;
    available: boolean;
    compareAtPrice?: number | null;
  }>;
}

interface UseAddToCartProps {
  productId: string;
  productSlug: string;
  inStock: boolean;
  /** From product list API — avoids GET /products/:slug before add */
  defaultVariantId?: string | null;
  listingPrice?: number;
  title?: string;
  image?: string | null;
  stock?: number;
  sku?: string | null;
  originalPrice?: number | null;
}

function canUseLocalSnapshot(props: UseAddToCartProps): props is UseAddToCartProps & {
  defaultVariantId: string;
  listingPrice: number;
  title: string;
} {
  return Boolean(
    props.defaultVariantId &&
      typeof props.listingPrice === 'number' &&
      !Number.isNaN(props.listingPrice) &&
      props.title !== undefined &&
      String(props.title).length > 0,
  );
}

/**
 * Hook for adding products to cart (միայն localStorage — նույնը բոլորի համար)
 */
export function useAddToCart(props: UseAddToCartProps) {
  const { productId, productSlug, inStock } = props;
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const addToCart = async () => {
    if (!inStock) {
      return;
    }

    if (!productSlug || productSlug.trim() === '' || productSlug.includes(' ')) {
      logger.error('Invalid product slug for add to cart', { productSlug });
      alert(t('common.alerts.invalidProduct'));
      return;
    }

    const slug = productSlug.trim();

    if (canUseLocalSnapshot(props)) {
      const variantId = props.defaultVariantId;
      const inCart = getGuestStorageQtyForVariant(productId, variantId);
      if (props.stock !== undefined && inCart + 1 > props.stock) {
        alert(t('common.alerts.noMoreStockAvailable'));
        return;
      }

      mergeGuestCartLine({
        productId,
        variantId,
        productSlug: slug,
        addQuantity: 1,
        title: props.title,
        image: props.image ?? null,
        price: props.listingPrice,
        originalPrice: props.originalPrice ?? null,
        sku: props.sku ?? '',
        ...(props.stock !== undefined ? { stock: props.stock } : {}),
      });
      window.dispatchEvent(new Event('cart-updated'));
      return;
    }

    setIsAddingToCart(true);
    try {
      const encodedSlug = encodeURIComponent(slug);
      const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${encodedSlug}`);

      if (!productDetails.variants || productDetails.variants.length === 0) {
        alert(t('common.alerts.noVariantsAvailable'));
        return;
      }

      const variantId = productDetails.variants[0].id;
      const variant = productDetails.variants[0];
      const inCartQty = getGuestStorageQtyForVariant(productId, variantId);
      if (inCartQty + 1 > variant.stock) {
        alert(t('common.alerts.noMoreStockAvailable'));
        return;
      }

      const translation = productDetails.translations?.[0];
      const title = translation?.title || productDetails.slug;
      const imageUrl = productDetails.media?.[0]
        ? typeof productDetails.media[0] === 'string'
          ? productDetails.media[0]
          : productDetails.media[0].url || productDetails.media[0].src
        : null;

      mergeGuestCartLine({
        productId,
        variantId,
        productSlug: productDetails.slug || slug,
        addQuantity: 1,
        title,
        image: imageUrl ?? null,
        price: variant.price,
        originalPrice: variant.compareAtPrice ?? null,
        sku: variant.sku,
        stock: variant.stock,
      });
      window.dispatchEvent(new Event('cart-updated'));
    } catch (error: unknown) {
      logger.error('Error adding to cart', { error, productId });
      const err = error as {
        message?: string;
        status?: number;
        statusCode?: number;
        response?: { data?: { detail?: string; title?: string } };
      };

      if (err?.message?.includes('does not exist') || err?.message?.includes('404') || err?.status === 404 || err?.statusCode === 404) {
        alert(t('common.alerts.productNotFound'));
        return;
      }

      if (
        err.response?.data?.detail?.includes('No more stock available') ||
        err.response?.data?.detail?.includes('exceeds available stock') ||
        err.response?.data?.title === 'Insufficient stock'
      ) {
        alert(t('common.alerts.noMoreStockAvailable'));
        return;
      }

      if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err?.status === 401 || err?.statusCode === 401) {
        if (!isLoggedIn) {
          router.push(`/login?redirect=/products`);
        } else {
          alert(t('common.alerts.failedToAddToCart'));
        }
        return;
      }

      if (!isLoggedIn) {
        router.push(`/login?redirect=/products`);
      } else {
        alert(t('common.alerts.failedToAddToCart'));
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  return { isAddingToCart, addToCart };
}

import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/utils/logger';
import type { Cart, CartItem } from '@/app/(main)/cart/types';
import { CART_KEY } from '@/app/(main)/cart/constants';
import type { StoredGuestCartLine } from './storedGuestCartLine.types';

interface ProductData {
  id: string;
  slug: string;
  translations?: Array<{ title: string; locale: string }>;
  media?: Array<{ url?: string; src?: string } | string>;
  variants?: Array<{
    _id: string;
    id: string;
    sku: string;
    price: number;
    originalPrice?: number | null;
    stock?: number;
  }>;
}

function isLineDisplayReady(line: StoredGuestCartLine): boolean {
  return Boolean(
    line.productSlug &&
      line.variantId &&
      line.title !== undefined &&
      String(line.title).length > 0 &&
      typeof line.price === 'number' &&
      !Number.isNaN(line.price),
  );
}

function cartItemFromSnapshot(line: StoredGuestCartLine, index: number): CartItem {
  return {
    id: `${line.productId}-${line.variantId}-${index}`,
    variant: {
      id: line.variantId,
      sku: line.sku ?? '',
      stock: line.stock,
      product: {
        id: line.productId,
        title: line.title!,
        slug: line.productSlug!,
        image: line.image ?? null,
      },
    },
    quantity: line.quantity,
    price: line.price!,
    originalPrice: line.originalPrice ?? null,
    total: line.price! * line.quantity,
  };
}

function buildCart(validItems: CartItem[]): Cart {
  const subtotal = validItems.reduce((sum, item) => sum + item.total, 0);
  const itemsCount = validItems.reduce((sum, item) => sum + item.quantity, 0);
  return {
    id: 'guest-cart',
    items: validItems,
    totals: {
      subtotal,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: subtotal,
      currency: 'RUB',
    },
    itemsCount,
  };
}

async function hydrateLineFromApi(
  item: StoredGuestCartLine,
  index: number,
  t: (key: string) => string,
): Promise<{ item: CartItem | null; shouldRemove: boolean; enriched?: StoredGuestCartLine }> {
  try {
    if (!item.productSlug) {
      return { item: null, shouldRemove: true };
    }

    const productData = await apiClient.get<ProductData>(`/api/v1/products/${item.productSlug}`);

    const variant =
      productData.variants?.find((v) => (v._id?.toString() || v.id) === item.variantId) ||
      productData.variants?.[0];

    if (!variant) {
      return { item: null, shouldRemove: true };
    }

    const translation = productData.translations?.[0];
    const imageUrl = productData.media?.[0]
      ? typeof productData.media[0] === 'string'
        ? productData.media[0]
        : productData.media[0].url || productData.media[0].src
      : null;

    const enriched: StoredGuestCartLine = {
      ...item,
      title: translation?.title || item.title,
      image: imageUrl ?? item.image ?? null,
      price: variant.price,
      originalPrice: variant.originalPrice ?? item.originalPrice ?? null,
      sku: variant.sku || item.sku,
      stock: variant.stock !== undefined ? variant.stock : item.stock,
    };

    return {
      item: {
        id: `${item.productId}-${item.variantId}-${index}`,
        variant: {
          id: variant._id?.toString() || variant.id,
          sku: variant.sku || '',
          stock: variant.stock,
          product: {
            id: productData.id,
            title: translation?.title || t('common.messages.product'),
            slug: productData.slug,
            image: imageUrl,
          },
        },
        quantity: item.quantity,
        price: variant.price,
        originalPrice: variant.originalPrice ?? null,
        total: variant.price * item.quantity,
      },
      shouldRemove: false,
      enriched,
    };
  } catch (error: unknown) {
    const err = error as { status?: number; statusCode?: number };
    if (err?.status === 404 || err?.statusCode === 404) {
      return { item: null, shouldRemove: true };
    }
    logger.error(`Error fetching product ${item.productId} for guest cart`, { error });
    return { item: null, shouldRemove: false };
  }
}

/**
 * Builds guest cart for UI: uses localStorage snapshots when complete; otherwise fetches product by slug.
 * Persists enriched lines back to localStorage so the next open is instant.
 */
export async function hydrateGuestCartFromStorage(
  t: (key: string) => string,
): Promise<Cart | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = localStorage.getItem(CART_KEY);
  let guestCart: StoredGuestCartLine[] = [];
  try {
    const parsed = stored ? JSON.parse(stored) : [];
    guestCart = Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }

  if (guestCart.length === 0) {
    return null;
  }

  const results = await Promise.all(
    guestCart.map(async (line, index) => {
      if (isLineDisplayReady(line)) {
        return {
          item: cartItemFromSnapshot(line, index),
          shouldRemove: false,
        };
      }
      return hydrateLineFromApi(line, index, t);
    }),
  );

  const itemsToRemove = results
    .map((r, index) => (r.shouldRemove ? index : -1))
    .filter((index) => index !== -1);

  const enrichedLines = guestCart.map((line, i) => results[i].enriched ?? line);

  if (itemsToRemove.length > 0) {
    const storageLines = enrichedLines.filter((_, index) => !itemsToRemove.includes(index));
    localStorage.setItem(CART_KEY, JSON.stringify(storageLines));
  } else if (results.some((r) => r.enriched !== undefined)) {
    localStorage.setItem(CART_KEY, JSON.stringify(enrichedLines));
  }

  const validItems = results
    .map((r) => r.item)
    .filter((item): item is CartItem => item !== null);

  if (validItems.length === 0) {
    return null;
  }

  return buildCart(validItems);
}

import { CART_KEY } from '@/app/(main)/cart/constants';
import type { StoredGuestCartLine } from './storedGuestCartLine.types';

export function getGuestStorageQtyForVariant(productId: string, variantId: string): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const lines: StoredGuestCartLine[] = Array.isArray(parsed) ? parsed : [];
    const line = lines.find((i) => i.productId === productId && i.variantId === variantId);
    return line?.quantity ?? 0;
  } catch {
    return 0;
  }
}

export function snapshotGuestCartRaw(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(CART_KEY);
}

export function restoreGuestCartRaw(snapshot: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (snapshot === null) {
    localStorage.removeItem(CART_KEY);
  } else {
    localStorage.setItem(CART_KEY, snapshot);
  }
}

/**
 * Merges a line into `shop_cart_guest` (same shape as `useAddToCart` / PDP).
 */
export function mergeGuestCartLine(params: {
  productId: string;
  variantId: string;
  productSlug: string;
  addQuantity: number;
  title: string;
  image: string | null;
  price: number;
  originalPrice: number | null;
  sku: string;
  stock?: number;
}): void {
  const raw = localStorage.getItem(CART_KEY);
  let lines: StoredGuestCartLine[] = [];
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    lines = Array.isArray(parsed) ? parsed : [];
  } catch {
    lines = [];
  }

  const idx = lines.findIndex((i) => i.productId === params.productId && i.variantId === params.variantId);
  const existing = idx >= 0 ? lines[idx]! : null;
  const inCartQty = existing?.quantity ?? 0;
  const nextTotal = inCartQty + params.addQuantity;

  if (existing) {
    existing.quantity = nextTotal;
    existing.productSlug = params.productSlug;
    existing.title = params.title;
    existing.image = params.image;
    existing.price = params.price;
    existing.originalPrice = params.originalPrice;
    existing.sku = params.sku;
    if (params.stock !== undefined) {
      existing.stock = params.stock;
    }
  } else {
    lines.push({
      productId: params.productId,
      productSlug: params.productSlug,
      variantId: params.variantId,
      quantity: params.addQuantity,
      title: params.title,
      image: params.image,
      price: params.price,
      originalPrice: params.originalPrice,
      sku: params.sku,
      ...(params.stock !== undefined ? { stock: params.stock } : {}),
    });
  }

  localStorage.setItem(CART_KEY, JSON.stringify(lines));
}

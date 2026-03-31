import { CART_KEY } from '@/app/(main)/cart/constants';
import type { StoredGuestCartLine } from './storedGuestCartLine.types';

/**
 * Removes stored guest lines for a product/variant (e.g. after logged-in POST sync).
 */
export function removeGuestCartVariantFromStorage(productId: string, variantId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const raw = localStorage.getItem(CART_KEY);
    const lines: StoredGuestCartLine[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(lines) || lines.length === 0) {
      return;
    }
    const next = lines.filter((l) => !(l.productId === productId && l.variantId === variantId));
    if (next.length !== lines.length) {
      localStorage.setItem(CART_KEY, JSON.stringify(next));
    }
  } catch {
    /* ignore */
  }
}

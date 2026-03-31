import { logger } from '@/lib/utils/logger';
import { hydrateGuestCartFromStorage } from '@/lib/guest-cart/hydrateGuestCart';
import type { Cart } from './types';

/**
 * Fetch guest cart (localStorage snapshots first; API only for legacy lines without snapshot).
 */
export async function fetchGuestCart(
  t: (key: string) => string,
): Promise<Cart | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return hydrateGuestCartFromStorage(t);
  } catch (error: unknown) {
    logger.error('Error loading guest cart', { error });
    return null;
  }
}

/**
 * Cart for everyone: նույն `hydrateGuestCartFromStorage` ուղին (առանց GET /api/v1/cart)։
 */
export async function fetchCart(
  _isLoggedIn: boolean,
  t: (key: string) => string,
): Promise<Cart | null> {
  return fetchGuestCart(t);
}

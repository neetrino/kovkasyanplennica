import { hydrateGuestCartFromStorage } from '@/lib/guest-cart/hydrateGuestCart';
import { CART_KEY } from '@/app/(main)/cart/constants';
import type { Cart } from './types';

export async function fetchCartForGuest(t: (key: string) => string): Promise<Cart | null> {
  return hydrateGuestCartFromStorage(t);
}

export function clearGuestCart(): void {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event('cart-updated'));
}

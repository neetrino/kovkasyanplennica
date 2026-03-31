import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { fetchCart as fetchUnifiedCart } from '@/app/(main)/cart/cart-fetcher';
import type { Cart } from '../types';

export function useCart(isLoggedIn: boolean) {
  const { t } = useTranslation();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUnifiedCart(isLoggedIn, t);
      setCart(data);
    } catch {
      setError(t('checkout.errors.failedToLoadCart'));
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, t]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return { cart, loading, error, setError, fetchCart };
}


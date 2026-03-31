'use client';

import { useState, useEffect, useRef } from 'react';
import { getStoredCurrency } from '@/lib/currency';
import { useTranslation } from '@/lib/i18n-client';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Cart } from './types';
import { fetchCart } from './cart-fetcher';
import { handleRemoveItem, handleUpdateQuantity } from './cart-handlers';
import { CartTable, OrderSummary } from './cart-components';
import { EmptyCart } from './empty-cart';
import { LoadingState } from './loading-state';

export default function CartPage() {
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const isLocalUpdateRef = useRef(false);

  useEffect(() => {
    loadCart();

    const handleCurrencyUpdate = () => setCurrency(getStoredCurrency());

    const handleCartUpdate = () => {
      if (isLocalUpdateRef.current) {
        isLocalUpdateRef.current = false;
        return;
      }
      loadCart();
    };

    const handleAuthUpdate = () => loadCart();

    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('auth-updated', handleAuthUpdate);

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('auth-updated', handleAuthUpdate);
    };
  }, [isLoggedIn, t]);

  async function loadCart() {
    try {
      setLoading(true);
      const cartData = await fetchCart(isLoggedIn, t);
      setCart(cartData);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }

  async function onRemoveItem(itemId: string) {
    if (!cart) return;
    isLocalUpdateRef.current = true;
    await handleRemoveItem(itemId, cart, setCart, loadCart);
  }

  async function onUpdateQuantity(itemId: string, quantity: number) {
    isLocalUpdateRef.current = true;
    await handleUpdateQuantity(itemId, quantity, cart, setCart, setUpdatingItems, loadCart, t);
  }

  if (loading) return <LoadingState />;
  if (!cart || cart.items.length === 0) return <EmptyCart t={t} />;

  return (
    <div className="w-full bg-[#2F3F3D] relative min-h-screen">

      {/* Decorative overlays */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[600px] lg:w-[700px] aspect-square max-h-[700px] pointer-events-none z-0 opacity-40"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>
      <div
        className="absolute bottom-0 right-0 w-[300px] md:w-[500px] aspect-square max-h-[500px] pointer-events-none z-[1] opacity-30 translate-x-1/4 translate-y-1/4"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

        {/* Page title */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7CB342] mb-2">
            {t('common.messages.shopping')}
          </p>
          <h1 className="text-[#fff4de] text-4xl md:text-5xl lg:text-6xl font-light italic">
            {t('common.cart.title')}
          </h1>
          <div className="w-16 h-[2px] bg-[#7CB342] mt-4" />
        </div>

        {/* Cart count badge */}
        <p className="text-[#fff4de]/50 text-sm mb-8">
          {cart.itemsCount} {cart.itemsCount === 1 ? t('common.cart.item') : t('common.cart.items')}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <CartTable
            cart={cart}
            currency={currency}
            updatingItems={updatingItems}
            onRemove={onRemoveItem}
            onUpdateQuantity={onUpdateQuantity}
            t={t}
          />
          <OrderSummary cart={cart} currency={currency} t={t} />
        </div>

      </div>
    </div>
  );
}

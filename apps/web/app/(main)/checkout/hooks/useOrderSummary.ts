import { useMemo } from 'react';
import type { Cart } from '../types';

interface UseOrderSummaryProps {
  cart: Cart | null;
  shippingMethod: 'pickup' | 'delivery';
  deliveryPrice: number | null;
}

export function useOrderSummary({
  cart,
  shippingMethod,
  deliveryPrice,
}: UseOrderSummaryProps) {
  const orderSummary = useMemo(() => {
    if (!cart || cart.items.length === 0) {
      return {
        subtotalDisplay: 0,
        taxDisplay: 0,
        shippingDisplay: 0,
        totalDisplay: 0,
      };
    }

    const subtotalDisplay = cart.totals.subtotal;
    const taxDisplay = cart.totals.tax;
    const shippingDisplay = shippingMethod === 'delivery' && deliveryPrice !== null ? deliveryPrice : 0;
    const totalDisplay = cart.totals.total + shippingDisplay;

    return {
      subtotalDisplay,
      taxDisplay,
      shippingDisplay,
      totalDisplay,
    };
  }, [cart, shippingMethod, deliveryPrice]);

  return { orderSummary };
}

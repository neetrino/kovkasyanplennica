import { useMemo } from 'react';
import { amountUsdToRub, amountAmdToRub, convertPrice } from '@/lib/currency';
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
        subtotalRub: 0,
        taxRub: 0,
        shippingRub: 0,
        totalRub: 0,
        subtotalDisplay: 0,
        taxDisplay: 0,
        shippingDisplay: 0,
        totalDisplay: 0,
      };
    }

    const subtotalRub = amountUsdToRub(cart.totals.subtotal);
    const taxRub = amountUsdToRub(cart.totals.tax);
    const shippingAmd = shippingMethod === 'delivery' && deliveryPrice !== null ? deliveryPrice : 0;
    const shippingRub = amountAmdToRub(shippingAmd);

    const totalAmd =
      convertPrice(cart.totals.subtotal, 'USD', 'AMD') +
      convertPrice(cart.totals.tax, 'USD', 'AMD') +
      shippingAmd;
    const totalRub = amountAmdToRub(totalAmd);

    return {
      subtotalRub,
      taxRub,
      shippingRub,
      totalRub,
      subtotalDisplay: subtotalRub,
      taxDisplay: taxRub,
      shippingDisplay: shippingRub,
      totalDisplay: totalRub,
    };
  }, [cart, shippingMethod, deliveryPrice]);

  return { orderSummary };
}

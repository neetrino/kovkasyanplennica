'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n-client';
import { formatPriceInCurrency, convertPrice } from '@/lib/currency';
import type { Order } from '../types';

interface OrderSummaryProps {
  order: Order;
  currency: 'USD' | 'AMD' | 'EUR' | 'RUB' | 'GEL';
  calculatedShipping: number | null;
  loadingShipping: boolean;
}

export function OrderSummary({ order, currency, calculatedShipping, loadingShipping }: OrderSummaryProps) {
  const { t } = useTranslation();

  const toDisplay = (amountUSD: number): number => {
    const amd = convertPrice(amountUSD, 'USD', 'AMD');
    return currency === 'AMD' ? amd : convertPrice(amd, 'AMD', currency);
  };

  const subtotalDisplay = toDisplay(order.totals.subtotal);
  const discountDisplay = order.totals.discount > 0 ? toDisplay(order.totals.discount) : null;
  const taxDisplay = toDisplay(order.totals.tax);

  const shippingAMD = calculatedShipping !== null ? calculatedShipping : order.totals.shipping;
  const shippingDisplayValue = currency === 'AMD' ? shippingAMD : convertPrice(shippingAMD, 'AMD', currency);

  const shippingLabel =
    order.shippingMethod === 'pickup'
      ? t('checkout.shipping.freePickup')
      : loadingShipping
        ? t('checkout.shipping.loading')
        : `${formatPriceInCurrency(shippingDisplayValue, currency)}${order.shippingAddress?.city ? ` (${order.shippingAddress.city})` : ''}`;

  const totalAMD =
    convertPrice(order.totals.subtotal, 'USD', 'AMD') -
    convertPrice(order.totals.discount, 'USD', 'AMD') +
    shippingAMD +
    convertPrice(order.totals.tax, 'USD', 'AMD');
  const totalDisplay = currency === 'AMD' ? totalAMD : convertPrice(totalAMD, 'AMD', currency);

  return (
    <div className="lg:col-span-1">
      <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl overflow-hidden lg:sticky lg:top-24">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#3d504e] bg-[#3d504e]/60">
          <svg className="w-5 h-5 text-[#7CB342]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-[#fff4de] font-light italic text-lg">{t('orders.orderSummary.title')}</h2>
        </div>

        <div className="p-6">
          {order.totals ? (
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-[#fff4de]/55 text-sm">{t('orders.orderSummary.subtotal')}</span>
                <span className="text-[#fff4de] text-sm">{formatPriceInCurrency(subtotalDisplay, currency)}</span>
              </div>

              {discountDisplay !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-[#fff4de]/55 text-sm">{t('orders.orderSummary.discount')}</span>
                  <span className="text-[#7CB342] text-sm">− {formatPriceInCurrency(discountDisplay, currency)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-[#fff4de]/55 text-sm">{t('orders.orderSummary.shipping')}</span>
                <span className={`text-sm ${order.shippingMethod === 'pickup' ? 'text-[#7CB342]' : 'text-[#fff4de]'}`}>
                  {shippingLabel}
                </span>
              </div>

              {taxDisplay > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[#fff4de]/55 text-sm">{t('orders.orderSummary.tax')}</span>
                  <span className="text-[#fff4de] text-sm">{formatPriceInCurrency(taxDisplay, currency)}</span>
                </div>
              )}

              <div className="border-t border-[#3d504e] pt-3 mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#fff4de] font-semibold">{t('orders.orderSummary.total')}</span>
                  <span className="text-[#7CB342] text-xl font-semibold">
                    {formatPriceInCurrency(totalDisplay, currency)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[#fff4de]/40 text-sm mb-6">{t('orders.orderSummary.loadingTotals')}</p>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            <Link
              href="/products"
              className="flex items-center justify-center w-full py-3.5 px-6 bg-[#7CB342] hover:bg-[#6aa535] text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#7CB342]/20 hover:-translate-y-0.5 text-sm uppercase tracking-widest"
            >
              {t('orders.buttons.continueShopping')}
            </Link>
            <Link
              href="/cart"
              className="flex items-center justify-center w-full py-3 px-6 bg-transparent border border-[#3d504e] hover:border-[#fff4de]/30 text-[#fff4de]/60 hover:text-[#fff4de] font-medium rounded-xl transition-all duration-200 text-sm"
            >
              {t('orders.buttons.viewCart')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

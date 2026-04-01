'use client';

import Image from 'next/image';
import { useTranslation } from '@/lib/i18n-client';
import { formatPriceInCurrency, amountUsdToRub, SHOP_DISPLAY_CURRENCY } from '@/lib/currency';

interface Cart {
  id: string;
  items: Array<{
    id: string;
    variant: {
      id: string;
      sku: string;
      product: { id: string; title: string; slug: string; image?: string | null };
    };
    quantity: number;
    price: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
  itemsCount: number;
}

interface OrderSummaryProps {
  cart: Cart | null;
  orderSummary: {
    subtotalDisplay: number;
    taxDisplay: number;
    shippingDisplay: number;
    totalDisplay: number;
  };
  shippingMethod: 'pickup' | 'delivery';
  shippingCity: string | undefined;
  loadingDeliveryPrice: boolean;
  deliveryPrice: number | null;
  error: string | null;
  isSubmitting: boolean;
  onPlaceOrder: (e?: React.FormEvent) => void;
}

export function OrderSummary({
  cart,
  orderSummary,
  shippingMethod,
  shippingCity,
  loadingDeliveryPrice,
  deliveryPrice,
  error,
  isSubmitting,
  onPlaceOrder,
}: OrderSummaryProps) {
  const { t } = useTranslation();

  const shippingLabel = shippingMethod === 'pickup'
    ? t('checkout.shipping.freePickup')
    : loadingDeliveryPrice
      ? t('checkout.shipping.loading')
      : deliveryPrice !== null
        ? `${formatPriceInCurrency(orderSummary.shippingDisplay, SHOP_DISPLAY_CURRENCY)}${shippingCity ? ` (${shippingCity})` : ''}`
        : t('checkout.shipping.enterCity');

  return (
    <div className="lg:col-span-1">
      <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl overflow-hidden lg:sticky lg:top-24">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#3d504e] bg-[#3d504e]/60">
          <svg className="w-5 h-5 text-[#7CB342]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-[#fff4de] font-light italic text-lg">{t('checkout.orderSummary')}</h2>
        </div>

        <div className="p-6">

          {/* Cart items mini-list */}
          {cart && cart.items.length > 0 && (
            <div className="space-y-3 mb-5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2F3F3D] border border-[#3d504e] flex-shrink-0 overflow-hidden relative">
                    {item.variant.product.image ? (
                      <Image
                        src={item.variant.product.image}
                        alt={item.variant.product.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#fff4de]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#fff4de] text-xs font-medium truncate">{item.variant.product.title}</p>
                    <p className="text-[#fff4de]/40 text-xs">×{item.quantity}</p>
                  </div>
                  <span className="text-[#7CB342] text-xs font-semibold flex-shrink-0">
                    {formatPriceInCurrency(amountUsdToRub(item.total), SHOP_DISPLAY_CURRENCY)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-[#3d504e] pt-4 space-y-3 mb-5">

            <div className="flex justify-between items-center">
              <span className="text-[#fff4de]/55 text-sm">{t('checkout.summary.subtotal')}</span>
              <span className="text-[#fff4de] text-sm">
                {formatPriceInCurrency(orderSummary.subtotalDisplay, SHOP_DISPLAY_CURRENCY)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#fff4de]/55 text-sm">{t('checkout.summary.shipping')}</span>
              <span className={`text-sm ${shippingMethod === 'pickup' || deliveryPrice === 0 ? 'text-[#7CB342]' : 'text-[#fff4de]'}`}>
                {shippingLabel}
              </span>
            </div>

            {orderSummary.taxDisplay > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[#fff4de]/55 text-sm">{t('checkout.summary.tax')}</span>
                <span className="text-[#fff4de] text-sm">
                  {formatPriceInCurrency(orderSummary.taxDisplay, SHOP_DISPLAY_CURRENCY)}
                </span>
              </div>
            )}

            <div className="border-t border-[#3d504e] pt-3 mt-1">
              <div className="flex justify-between items-center">
                <span className="text-[#fff4de] font-semibold">{t('checkout.summary.total')}</span>
                <span className="text-[#7CB342] text-xl font-semibold">
                  {formatPriceInCurrency(orderSummary.totalDisplay, SHOP_DISPLAY_CURRENCY)}
                </span>
              </div>
            </div>

          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-400/10 border border-red-400/30 rounded-xl">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Place Order button */}
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={onPlaceOrder}
            className="w-full py-3.5 px-6 bg-[#7CB342] hover:bg-[#6aa535] text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#7CB342]/20 hover:-translate-y-0.5 active:translate-y-0 text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('checkout.buttons.processing')}
              </>
            ) : (
              t('checkout.buttons.placeOrder')
            )}
          </button>

          {/* Secure note */}
          <div className="flex items-center justify-center gap-2 mt-4 text-[#fff4de]/30">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs">{t('common.cart.secureCheckout')}</span>
          </div>

        </div>
      </div>
    </div>
  );
}

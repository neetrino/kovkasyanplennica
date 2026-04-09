'use client';

import { useTranslation } from '@/lib/i18n-client';
import { Card } from '@shop/ui';
import type { CurrencyCode } from '@/lib/currency';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsTotalsProps {
  orderDetails: OrderDetails;
  currency: string;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderDetailsTotals({
  orderDetails,
  currency: _currency,
  formatCurrency,
}: OrderDetailsTotalsProps) {
  const { t } = useTranslation();

  if (!orderDetails.totals) {
    return null;
  }

  const totalsCurrency = (orderDetails.totals.currency || orderDetails.currency || 'RUB') as CurrencyCode;

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('orders.orderSummary.title')}</h3>
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-700">
          <span>{t('orders.orderSummary.subtotal')}</span>
          <span>{formatCurrency(orderDetails.totals.subtotal, totalsCurrency, totalsCurrency)}</span>
        </div>
        {orderDetails.totals.discount > 0 && (
          <div className="flex justify-between text-sm text-gray-700">
            <span>{t('orders.orderSummary.discount')}</span>
            <span>-{formatCurrency(orderDetails.totals.discount, totalsCurrency, totalsCurrency)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-700">
          <span>{t('orders.orderSummary.shipping')}</span>
          <span>
            {orderDetails.shippingMethod === 'pickup'
              ? t('checkout.shipping.freePickup')
              : formatCurrency(orderDetails.totals.shipping, totalsCurrency, totalsCurrency) + (orderDetails.shippingAddress?.city ? ` (${orderDetails.shippingAddress.city})` : '')}
          </span>
        </div>
        <div className="flex justify-between text-sm text-gray-700">
          <span>{t('orders.orderSummary.tax')}</span>
          <span>{formatCurrency(orderDetails.totals.tax, totalsCurrency, totalsCurrency)}</span>
        </div>
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between text-base font-bold text-gray-900">
            <span>{t('orders.orderSummary.total')}</span>
            <span>{formatCurrency(orderDetails.totals.total, totalsCurrency, totalsCurrency)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}


'use client';

import { useTranslation } from '@/lib/i18n-client';
import { Card } from '@shop/ui';
import { CurrencyCode } from '@/lib/currency';
import {
  adminDetailBodyClass,
  adminDetailMutedClass,
  adminDetailSectionTitleClass,
  dashboardCardPadding,
} from '../../components/dashboardUi';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsAddressesProps {
  orderDetails: OrderDetails;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderDetailsAddresses({ orderDetails, formatCurrency }: OrderDetailsAddressesProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card variant="admin" className={dashboardCardPadding}>
        <h3 className={adminDetailSectionTitleClass}>{t('admin.orders.orderDetails.shippingAddress')}</h3>
        {orderDetails.shippingMethod === 'pickup' ? (
          <div className={adminDetailBodyClass}>
            <div>
              <span className="font-medium text-admin-brand">{t('admin.orders.orderDetails.shippingMethod')}</span>{' '}
              {t('admin.orders.orderDetails.pickup')}
            </div>
          </div>
        ) : orderDetails.shippingMethod === 'delivery' && orderDetails.shippingAddress ? (
          <div className={adminDetailBodyClass}>
            <div className="mb-2">
              <span className="font-medium text-admin-brand">{t('admin.orders.orderDetails.shippingMethod')}</span>{' '}
              {t('checkout.shipping.delivery')}
            </div>
            {(orderDetails.shippingAddress.address || orderDetails.shippingAddress.addressLine1) && (
              <div>
                <span className="font-medium text-admin-brand">{t('checkout.form.address')}:</span>{' '}
                {orderDetails.shippingAddress.address || orderDetails.shippingAddress.addressLine1}
                {orderDetails.shippingAddress.addressLine2 && `, ${orderDetails.shippingAddress.addressLine2}`}
              </div>
            )}
            {orderDetails.shippingAddress.city && (
              <div>
                <span className="font-medium text-admin-brand">{t('checkout.form.city')}:</span>{' '}
                {orderDetails.shippingAddress.city}
              </div>
            )}
            {orderDetails.shippingAddress.postalCode && (
              <div>
                <span className="font-medium text-admin-brand">{t('checkout.form.postalCode')}:</span>{' '}
                {orderDetails.shippingAddress.postalCode}
              </div>
            )}
            {(orderDetails.shippingAddress.phone || orderDetails.shippingAddress.shippingPhone) && (
              <div className="mt-2">
                <span className="font-medium text-admin-brand">{t('checkout.form.phoneNumber')}:</span>{' '}
                {orderDetails.shippingAddress.phone || orderDetails.shippingAddress.shippingPhone}
              </div>
            )}
          </div>
        ) : (
          <div className={adminDetailMutedClass}>
            <p>{t('admin.orders.orderDetails.noShippingAddress')}</p>
            {orderDetails.shippingMethod && (
              <p>
                {t('admin.orders.orderDetails.shippingMethod')}{' '}
                {orderDetails.shippingMethod === 'pickup'
                  ? t('admin.orders.orderDetails.pickup')
                  : orderDetails.shippingMethod === 'delivery'
                  ? t('checkout.shipping.delivery')
                  : orderDetails.shippingMethod}
              </p>
            )}
          </div>
        )}
      </Card>
      <Card variant="admin" className={dashboardCardPadding}>
        <h3 className={adminDetailSectionTitleClass}>{t('admin.orders.orderDetails.paymentInfo')}</h3>
        {orderDetails.payment ? (
          <div className={adminDetailBodyClass}>
            {orderDetails.payment.method && <div>{t('admin.orders.orderDetails.method')} {orderDetails.payment.method}</div>}
            <div>
              {t('admin.orders.orderDetails.amount')}{' '}
              {formatCurrency(orderDetails.payment.amount, orderDetails.payment.currency || 'AMD', 'AMD')}
            </div>
            <div>{t('admin.orders.orderDetails.status')} {orderDetails.payment.status}</div>
            {orderDetails.payment.cardBrand && orderDetails.payment.cardLast4 && (
              <div>
                {t('admin.orders.orderDetails.card')} {orderDetails.payment.cardBrand} ••••{orderDetails.payment.cardLast4}
              </div>
            )}
          </div>
        ) : (
          <div className={adminDetailMutedClass}>{t('admin.orders.orderDetails.noPaymentInfo')}</div>
        )}
      </Card>
    </div>
  );
}



'use client';

import { useTranslation } from '@/lib/i18n-client';
import { Card } from '@shop/ui';
import type { CurrencyCode } from '@/lib/currency';
import { adminDetailBodyClass, adminDetailSectionTitleClass, dashboardCardPadding } from '../../components/dashboardUi';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsSummaryProps {
  orderDetails: OrderDetails;
  currency: string;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderDetailsSummary({
  orderDetails,
  currency: _currency,
  formatCurrency,
}: OrderDetailsSummaryProps) {
  const { t } = useTranslation();

  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h3 className={adminDetailSectionTitleClass}>{t('admin.orders.orderDetails.summary')}</h3>
          <div className={adminDetailBodyClass}>
            <div>
              <span className="font-medium text-admin-brand">{t('admin.orders.orderDetails.orderNumber')}</span>{' '}
              {orderDetails.number}
            </div>
            <div>
              <span className="font-medium text-admin-brand">{t('admin.orders.orderDetails.total')}</span>{' '}
              {orderDetails.totals
                ? formatCurrency(
                    orderDetails.totals.total,
                    (orderDetails.totals.currency || orderDetails.currency || 'RUB') as CurrencyCode,
                    (orderDetails.totals.currency || orderDetails.currency || 'RUB') as CurrencyCode,
                  )
                : formatCurrency(
                    orderDetails.total,
                    (orderDetails.currency || 'RUB') as CurrencyCode,
                    (orderDetails.currency || 'RUB') as CurrencyCode,
                  )}
            </div>
            <div>
              <span className="font-medium text-admin-brand">{t('admin.orders.orderDetails.status')}</span>{' '}
              {orderDetails.status}
            </div>
            <div>
              <span className="font-medium text-admin-brand">{t('admin.orders.orderDetails.payment')}</span>{' '}
              {orderDetails.paymentStatus}
            </div>
          </div>
        </div>
        <div>
          <h3 className={adminDetailSectionTitleClass}>{t('admin.orders.orderDetails.customer')}</h3>
          <div className={adminDetailBodyClass}>
            <div>
              {(orderDetails.customer?.firstName || '') +
                (orderDetails.customer?.lastName ? ' ' + orderDetails.customer.lastName : '') ||
                t('admin.orders.unknownCustomer')}
            </div>
            {orderDetails.customerPhone && <div>{orderDetails.customerPhone}</div>}
            {orderDetails.customerEmail && <div>{orderDetails.customerEmail}</div>}
          </div>
        </div>
      </div>
    </Card>
  );
}


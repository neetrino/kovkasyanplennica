'use client';

import { useTranslation } from '@/lib/i18n-client';
import { CurrencyCode } from '@/lib/currency';
import {
  adminModalBackdropClass,
  adminModalHeaderClass,
  adminModalPanelClass,
  adminModalTitleClass,
  adminGhostIconButtonClass,
  dashboardEmptyText,
} from '../../components/dashboardUi';
import { OrderDetailsSummary } from './OrderDetailsSummary';
import { OrderDetailsAddresses } from './OrderDetailsAddresses';
import { OrderDetailsTotals } from './OrderDetailsTotals';
import { OrderDetailsItems } from './OrderDetailsItems';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsModalProps {
  orderDetails: OrderDetails | null;
  loading: boolean;
  currency: string;
  onClose: () => void;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderDetailsModal({
  orderDetails,
  loading,
  currency,
  onClose,
  formatCurrency,
}: OrderDetailsModalProps) {
  const { t } = useTranslation();

  if (!orderDetails) {
    return null;
  }

  return (
    <div className={adminModalBackdropClass} onClick={onClose} role="presentation">
      <div className={adminModalPanelClass} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={adminModalHeaderClass}>
          <h2 className={adminModalTitleClass}>
            {t('admin.orders.orderDetails.title')} #{orderDetails.number}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 ${adminGhostIconButtonClass}`}
            aria-label={t('admin.common.close')}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
              <p className={dashboardEmptyText}>{t('admin.orders.orderDetails.loadingOrderDetails')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <OrderDetailsSummary
                orderDetails={orderDetails}
                currency={currency}
                formatCurrency={formatCurrency}
              />
              <OrderDetailsAddresses
                orderDetails={orderDetails}
                formatCurrency={formatCurrency}
              />
              <OrderDetailsTotals
                orderDetails={orderDetails}
                currency={currency}
                formatCurrency={formatCurrency}
              />
              <OrderDetailsItems
                orderDetails={orderDetails}
                formatCurrency={formatCurrency}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


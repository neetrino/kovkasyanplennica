'use client';

import { useTranslation } from '@/lib/i18n-client';
import { CurrencyCode } from '@/lib/currency';
import {
  adminInlineSelectClass,
  adminTableRowHoverClass,
  dashboardRowMeta,
  dashboardRowPrimary,
  dashboardRowPrimaryMedium,
} from '../../components/dashboardUi';
import { getStatusColor, getPaymentStatusColor } from '../utils/orderUtils';
import type { Order } from '../useOrders';

interface OrderRowProps {
  order: Order;
  selected: boolean;
  updatingStatus: boolean;
  updatingPaymentStatus: boolean;
  onToggleSelect: () => void;
  onViewDetails: () => void;
  onStatusChange: (newStatus: string) => void;
  onPaymentStatusChange: (newPaymentStatus: string) => void;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderRow({
  order,
  selected,
  updatingStatus,
  updatingPaymentStatus,
  onToggleSelect,
  onViewDetails,
  onStatusChange,
  onPaymentStatusChange,
  formatCurrency,
}: OrderRowProps) {
  const { t } = useTranslation();

  const calculateTotalWithoutShipping = () => {
    const totalWithoutShipping = order.total - (order.shippingAmount || 0);
    return formatCurrency(totalWithoutShipping, order.currency, (order.currency || 'RUB') as CurrencyCode);
  };

  return (
    <tr className={adminTableRowHoverClass}>
      <td className="px-4 py-4">
        <input
          type="checkbox"
          aria-label={t('admin.orders.selectOrder').replace('{number}', order.number)}
          checked={selected}
          onChange={onToggleSelect}
          className="rounded border-admin-brand-2/35 text-admin-brand focus:ring-admin-brand/30"
        />
      </td>
      <td className="cursor-pointer whitespace-nowrap px-6 py-4" onClick={onViewDetails}>
        <div className={dashboardRowPrimaryMedium}>{order.number}</div>
      </td>
      <td className="cursor-pointer whitespace-nowrap px-6 py-4" onClick={onViewDetails}>
        <div className={dashboardRowPrimaryMedium}>
          {[order.customerFirstName, order.customerLastName].filter(Boolean).join(' ') || t('admin.orders.unknownCustomer')}
        </div>
        {order.customerPhone && <div className="text-sm text-admin-muted">{order.customerPhone}</div>}
        <div className={`mt-1 text-xs font-medium text-admin-brand/70 underline-offset-2 hover:text-admin-brand hover:underline`}>
          {t('admin.orders.viewOrderDetails')}
        </div>
      </td>
      <td className={`whitespace-nowrap px-6 py-4 ${dashboardRowPrimary}`}>{calculateTotalWithoutShipping()}</td>
      <td className={`whitespace-nowrap px-6 py-4 text-sm ${dashboardRowMeta}`}>{order.itemsCount}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {updatingStatus ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
              <span className={dashboardRowMeta}>{t('admin.orders.updating')}</span>
            </div>
          ) : (
            <select
              value={order.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className={`${adminInlineSelectClass} ${getStatusColor(order.status)}`}
            >
              <option value="pending">{t('admin.orders.pending')}</option>
              <option value="processing">{t('admin.orders.processing')}</option>
              <option value="completed">{t('admin.orders.completed')}</option>
              <option value="cancelled">{t('admin.orders.cancelled')}</option>
            </select>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {updatingPaymentStatus ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
              <span className={dashboardRowMeta}>{t('admin.orders.updating')}</span>
            </div>
          ) : (
            <select
              value={order.paymentStatus}
              onChange={(e) => onPaymentStatusChange(e.target.value)}
              className={`${adminInlineSelectClass} ${getPaymentStatusColor(order.paymentStatus)}`}
            >
              <option value="paid">{t('admin.orders.paid')}</option>
              <option value="pending">{t('admin.orders.pendingPayment')}</option>
              <option value="failed">{t('admin.orders.failed')}</option>
            </select>
          )}
        </div>
      </td>
      <td className={`whitespace-nowrap px-6 py-4 text-sm ${dashboardRowMeta}`}>
        {new Date(order.createdAt).toLocaleDateString()}
      </td>
    </tr>
  );
}


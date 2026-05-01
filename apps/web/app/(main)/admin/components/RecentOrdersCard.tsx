'use client';

import { Card } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-client';
import { formatCurrency, formatDate } from '../utils/dashboardUtils';
import {
  dashboardBadgeNeutral,
  dashboardBadgePaid,
  dashboardBadgePending,
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardGhostLink,
  dashboardInsetRow,
  dashboardRowMeta,
  dashboardRowPrimary,
  dashboardRowPrimaryMedium,
  dashboardSectionHeaderRow,
  dashboardSectionTitle,
} from './dashboardUi';

interface RecentOrder {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
  itemsCount: number;
  createdAt: string;
}

interface RecentOrdersCardProps {
  recentOrders: RecentOrder[];
  recentOrdersLoading: boolean;
}

export function RecentOrdersCard({ recentOrders, recentOrdersLoading }: RecentOrdersCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <div className={dashboardSectionHeaderRow}>
        <h2 className={dashboardSectionTitle}>{t('admin.dashboard.recentOrders')}</h2>
        <button
          type="button"
          onClick={() => router.push('/admin/orders')}
          className={dashboardGhostLink}
        >
          {t('admin.dashboard.viewAll')}
        </button>
      </div>
      <div className="space-y-3">
        {recentOrdersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 rounded-lg bg-admin-surface" />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className={`py-14 text-center ${dashboardEmptyText}`}>
            <p>{t('admin.dashboard.noRecentOrders')}</p>
          </div>
        ) : (
          recentOrders.map((order) => (
            <div
              key={order.id}
              className={`cursor-pointer ${dashboardInsetRow}`}
              onClick={() => router.push(`/admin/orders?search=${order.number}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className={dashboardRowPrimaryMedium}>#{order.number}</p>
                    <span
                      className={
                        order.paymentStatus === 'paid'
                          ? dashboardBadgePaid
                          : order.paymentStatus === 'pending'
                            ? dashboardBadgePending
                            : dashboardBadgeNeutral
                      }
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                  <p className={dashboardRowMeta}>
                    {order.customerEmail || order.customerPhone || t('admin.dashboard.guest')}
                  </p>
                  <p className={`mt-1 ${dashboardRowMeta}`}>
                    {order.itemsCount === 1
                      ? t('admin.dashboard.items').replace('{count}', order.itemsCount.toString())
                      : t('admin.dashboard.itemsPlural').replace('{count}', order.itemsCount.toString())}{' '}
                    • {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={dashboardRowPrimary}>
                    {formatCurrency(order.total, order.currency)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

'use client';

import { Card } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-client';
import { formatCurrency } from '../utils/dashboardUtils';
import {
  iconCircleClass,
  metricLabelClass,
  metricValueClass,
  statCardInteractive,
  dashboardCardPadding,
} from './dashboardUi';

interface Stats {
  users: { total: number };
  products: { total: number; lowStock: number };
  orders: { total: number; recent: number; pending: number };
  revenue: { total: number; currency: string };
}

interface StatsGridProps {
  stats: Stats | null;
  statsLoading: boolean;
}

export function StatsGrid({ stats, statsLoading }: StatsGridProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
      <Card
        variant="admin"
        className={`${statCardInteractive} ${dashboardCardPadding}`}
        onClick={() => router.push('/admin/users')}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className={metricLabelClass}>{t('admin.dashboard.totalUsers')}</p>
            {statsLoading ? (
              <div className="mt-2 h-9 w-20 animate-pulse rounded-md bg-admin-surface" />
            ) : (
              <p className={metricValueClass}>{stats?.users.total ?? 0}</p>
            )}
          </div>
          <div className={iconCircleClass}>
            <svg className="h-6 w-6 text-admin-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
        </div>
      </Card>

      <Card
        variant="admin"
        className={`${statCardInteractive} ${dashboardCardPadding}`}
        onClick={() => router.push('/admin/products')}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className={metricLabelClass}>{t('admin.dashboard.totalProducts')}</p>
            {statsLoading ? (
              <div className="mt-2 h-9 w-20 animate-pulse rounded-md bg-admin-surface" />
            ) : (
              <p className={metricValueClass}>{stats?.products.total ?? 0}</p>
            )}
          </div>
          <div className={iconCircleClass}>
            <svg className="h-6 w-6 text-admin-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        </div>
      </Card>

      <Card
        variant="admin"
        className={`${statCardInteractive} ${dashboardCardPadding}`}
        onClick={() => router.push('/admin/orders')}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className={metricLabelClass}>{t('admin.dashboard.totalOrders')}</p>
            {statsLoading ? (
              <div className="mt-2 h-9 w-20 animate-pulse rounded-md bg-admin-surface" />
            ) : (
              <p className={metricValueClass}>{stats?.orders.total ?? 0}</p>
            )}
          </div>
          <div className={iconCircleClass}>
            <svg className="h-6 w-6 text-admin-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
        </div>
      </Card>

      <Card
        variant="admin"
        className={`${statCardInteractive} ${dashboardCardPadding}`}
        onClick={() => router.push('/admin/orders?filter=paid')}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className={metricLabelClass}>{t('admin.dashboard.revenue')}</p>
            {statsLoading ? (
              <div className="mt-2 h-9 w-28 animate-pulse rounded-md bg-admin-surface" />
            ) : (
              <p className={`${metricValueClass} text-2xl sm:text-3xl`}>
                {stats ? formatCurrency(stats.revenue.total, stats.revenue.currency) : '0 USD'}
              </p>
            )}
          </div>
          <div className={iconCircleClass}>
            <svg className="h-6 w-6 text-admin-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </Card>
    </div>
  );
}

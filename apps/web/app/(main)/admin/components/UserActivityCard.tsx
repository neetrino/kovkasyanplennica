'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import { formatCurrency, formatDate } from '../utils/dashboardUtils';
import {
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardInsetRow,
  dashboardRowMeta,
  dashboardRowPrimary,
  dashboardRowSecondary,
  dashboardSectionTitle,
  dashboardSubsectionLabel,
  dashboardTitleBlock,
} from './dashboardUi';

interface UserActivity {
  recentRegistrations: Array<{
    id: string;
    email?: string;
    phone?: string;
    name: string;
    registeredAt: string;
    lastLoginAt?: string;
  }>;
  activeUsers: Array<{
    id: string;
    email?: string;
    phone?: string;
    name: string;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: string;
    lastLoginAt?: string;
  }>;
}

interface UserActivityCardProps {
  userActivity: UserActivity | null;
  userActivityLoading: boolean;
}

export function UserActivityCard({ userActivity, userActivityLoading }: UserActivityCardProps) {
  const { t } = useTranslation();

  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <div className={dashboardTitleBlock}>
        <h2 className={dashboardSectionTitle}>{t('admin.dashboard.userActivity')}</h2>
      </div>
      {userActivityLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 rounded-lg bg-admin-surface" />
            </div>
          ))}
        </div>
      ) : userActivity ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          <div>
            <h3 className={dashboardSubsectionLabel}>{t('admin.dashboard.recentRegistrations')}</h3>
            <div className="space-y-3">
              {userActivity.recentRegistrations.length === 0 ? (
                <p className={dashboardEmptyText}>{t('admin.dashboard.noRecentRegistrations')}</p>
              ) : (
                userActivity.recentRegistrations.slice(0, 5).map((user) => (
                  <div key={user.id} className={dashboardInsetRow}>
                    <div>
                      <p className={dashboardRowPrimary}>{user.name}</p>
                      <p className={dashboardRowSecondary}>{user.email || user.phone || 'N/A'}</p>
                      <p className={`mt-1 ${dashboardRowMeta}`}>{formatDate(user.registeredAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className={dashboardSubsectionLabel}>{t('admin.dashboard.mostActiveUsers')}</h3>
            <div className="space-y-3">
              {userActivity.activeUsers.length === 0 ? (
                <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-admin-brand-2/25 bg-admin-surface/50 px-4 py-10">
                  <p className={`text-center ${dashboardEmptyText}`}>{t('admin.dashboard.noActiveUsers')}</p>
                </div>
              ) : (
                userActivity.activeUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className={dashboardInsetRow}>
                    <div>
                      <p className={dashboardRowPrimary}>{user.name}</p>
                      <p className={dashboardRowSecondary}>{user.email || user.phone || 'N/A'}</p>
                      <p className={`mt-1 ${dashboardRowMeta}`}>
                        {t('admin.dashboard.ordersCount').replace('{count}', user.orderCount.toString())} •{' '}
                        {formatCurrency(user.totalSpent, 'USD')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className={dashboardEmptyText}>{t('admin.dashboard.noUserActivityData')}</p>
      )}
    </Card>
  );
}

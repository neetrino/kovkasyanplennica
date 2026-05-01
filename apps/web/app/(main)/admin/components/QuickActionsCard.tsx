'use client';

import { Card, Button } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-client';
import {
  dashboardCardPadding,
  dashboardQuickActionButton,
  dashboardQuickIconWrap,
  dashboardQuickSubtitle,
  dashboardQuickTitle,
  dashboardSectionTitle,
} from './dashboardUi';

export function QuickActionsCard() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <div className="mb-4 border-b border-admin-brand-2/18 pb-3">
        <h2 className={dashboardSectionTitle}>{t('admin.dashboard.quickActions')}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/products/add')}
          className={dashboardQuickActionButton}
        >
          <div className="flex items-center gap-3">
            <div className={dashboardQuickIconWrap}>
              <svg className="h-5 w-5 text-admin-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-left">
              <p className={dashboardQuickTitle}>{t('admin.dashboard.addProduct')}</p>
              <p className={dashboardQuickSubtitle}>{t('admin.dashboard.createNewProduct')}</p>
            </div>
          </div>
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/orders')}
          className={dashboardQuickActionButton}
        >
          <div className="flex items-center gap-3">
            <div className={dashboardQuickIconWrap}>
              <svg className="h-5 w-5 text-admin-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className={dashboardQuickTitle}>{t('admin.dashboard.manageOrders')}</p>
              <p className={dashboardQuickSubtitle}>{t('admin.dashboard.viewAllOrders')}</p>
            </div>
          </div>
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/users')}
          className={dashboardQuickActionButton}
        >
          <div className="flex items-center gap-3">
            <div className={dashboardQuickIconWrap}>
              <svg className="h-5 w-5 text-admin-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className={dashboardQuickTitle}>{t('admin.dashboard.manageUsers')}</p>
              <p className={dashboardQuickSubtitle}>{t('admin.dashboard.viewAllUsers')}</p>
            </div>
          </div>
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/settings')}
          className={dashboardQuickActionButton}
        >
          <div className="flex items-center gap-3">
            <div className={dashboardQuickIconWrap}>
              <svg className="h-5 w-5 text-admin-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className={dashboardQuickTitle}>{t('admin.dashboard.settings')}</p>
              <p className={dashboardQuickSubtitle}>{t('admin.dashboard.configureSystem')}</p>
            </div>
          </div>
        </Button>
      </div>
    </Card>
  );
}

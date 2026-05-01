'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import {
  adminSectionIconWrapClass,
  dashboardCardPadding,
  dashboardInsetRow,
  dashboardEmptyText,
  dashboardRankChip,
  dashboardRowMeta,
  dashboardRowPrimaryMedium,
  dashboardSectionTitle,
} from '../../components/dashboardUi';
import { formatCurrency } from '../utils';
import type { AnalyticsData } from '../types';

interface TopCategoriesProps {
  categories: AnalyticsData['topCategories'];
}

export function TopCategories({ categories }: TopCategoriesProps) {
  const { t } = useTranslation();

  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className={dashboardSectionTitle}>{t('admin.analytics.topCategories')}</h2>
        <div className={adminSectionIconWrapClass}>
          <svg className="h-5 w-5 text-admin-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
        </div>
      </div>
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="py-8 text-center">
            <p className={dashboardEmptyText}>{t('admin.analytics.noCategoryDataAvailable')}</p>
          </div>
        ) : (
          categories.map((category, index) => (
            <div
              key={category.categoryId}
              className={`group flex items-center justify-between gap-4 ${dashboardInsetRow} hover:shadow-[0_4px_18px_-6px_rgba(47,63,61,0.12)]`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="shrink-0">
                  <div className={dashboardRankChip}>{index + 1}</div>
                </div>
                <div className="min-w-0">
                  <p className={`mb-1 ${dashboardRowPrimaryMedium}`}>{category.categoryName}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-admin-brand/60">
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      {t('admin.analytics.items').replace('{count}', category.totalQuantity.toString())}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      {t('admin.analytics.orders').replace('{count}', category.orderCount.toString())}
                    </span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-base font-bold tracking-tight text-admin-brand">{formatCurrency(category.totalRevenue)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

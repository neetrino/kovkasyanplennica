'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import {
  adminSectionIconWrapClass,
  adminSectionSubtitleClass,
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardRowMeta,
  dashboardRowPrimary,
} from '../../components/dashboardUi';
import { LineChart } from '../LineChart';
import { formatCurrency, formatDateShort } from '../utils';
import type { AnalyticsData } from '../types';

interface OrdersByDayChartProps {
  ordersByDay: AnalyticsData['ordersByDay'];
}

export function OrdersByDayChart({ ordersByDay }: OrdersByDayChartProps) {
  const { t } = useTranslation();

  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-admin-brand">{t('admin.analytics.ordersByDay')}</h2>
          <p className={`mt-1 text-sm ${adminSectionSubtitleClass}`}>{t('admin.analytics.dailyOrderTrends')}</p>
        </div>
        <div className={adminSectionIconWrapClass}>
          <svg className="h-6 w-6 text-admin-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
      </div>

      {ordersByDay.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-admin-surface ring-1 ring-inset ring-admin-brand-2/12">
            <svg className="h-7 w-7 text-admin-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className={`font-medium ${dashboardEmptyText}`}>{t('admin.analytics.noDataAvailable')}</p>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-admin-brand-2/15 bg-admin-surface/35 p-4 sm:p-6">
            <LineChart data={ordersByDay} />
          </div>

          <div className="space-y-3">
            {ordersByDay.map((day) => {
              const maxCount = Math.max(...ordersByDay.map((d) => d.count), 1);
              const percentage = (day.count / maxCount) * 100;

              return (
                <div
                  key={day._id}
                  className="group flex items-center gap-4 rounded-xl border border-admin-brand-2/18 bg-white p-4 transition-[box-shadow,border-color] duration-200 hover:border-admin-brand-2/35 hover:shadow-[0_4px_18px_-6px_rgba(47,63,61,0.12)]"
                >
                  <div className={`w-28 shrink-0 sm:w-32 ${dashboardRowPrimary}`}>
                    {formatDateShort(day._id)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="relative h-8 overflow-hidden rounded-full bg-admin-brand-2/15 ring-1 ring-inset ring-admin-brand-2/10 sm:h-9">
                          <div
                            className="flex h-full min-w-0 items-center justify-between rounded-full bg-gradient-to-r from-admin-brand to-admin-brand-2 px-3 transition-all duration-500 group-hover:brightness-[1.03]"
                            style={{ width: `${Math.max(percentage, 8)}%` }}
                          >
                            <span className="truncate text-xs font-bold text-admin-flesh">
                              {t('admin.analytics.ordersLabel').replace('{count}', day.count.toString())}
                            </span>
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-admin-flesh/80" />
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-left sm:w-36 sm:text-right">
                        <p className="text-sm font-bold text-admin-brand">{formatCurrency(day.revenue)}</p>
                        <p className={`mt-0.5 ${dashboardRowMeta}`}>{t('admin.analytics.revenue')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

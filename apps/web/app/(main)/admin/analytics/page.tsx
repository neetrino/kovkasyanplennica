'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import {
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardMainClass,
  adminSectionSubtitleClass,
} from '../components/dashboardUi';
import { useAnalytics } from './hooks/useAnalytics';
import { PeriodSelector } from './components/PeriodSelector';
import { StatsCards } from './components/StatsCards';
import { TopProducts } from './components/TopProducts';
import { TopCategories } from './components/TopCategories';
import { OrdersByDayChart } from './components/OrdersByDayChart';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<string>('week');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { analytics, totalUsers, loading } = useAnalytics({
    period,
    startDate,
    endDate,
    isLoggedIn: isLoggedIn ?? false,
    isAdmin: isAdmin ?? false,
  });

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
          <p className="text-sm text-admin-brand/55">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <div className={dashboardMainClass}>
      <section className="rounded-xl border border-admin-brand-2/18 bg-white p-5 shadow-[0_1px_2px_rgba(47,63,61,0.05),0_8px_24px_-8px_rgba(47,63,61,0.1)] sm:p-6">
        <h1 className="text-xl font-semibold tracking-tight text-admin-brand">{t('admin.analytics.title')}</h1>
        <p className={`mt-1 max-w-2xl ${adminSectionSubtitleClass}`}>{t('admin.analytics.subtitle')}</p>
      </section>

      <PeriodSelector
        period={period}
        startDate={startDate}
        endDate={endDate}
        analytics={analytics}
        onPeriodChange={setPeriod}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
          <p className={dashboardEmptyText}>{t('admin.analytics.loadingAnalytics')}</p>
        </div>
      ) : analytics ? (
        <>
          <StatsCards analytics={analytics} totalUsers={totalUsers} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopProducts products={analytics.topProducts} />
            <TopCategories categories={analytics.topCategories} />
          </div>

          <OrdersByDayChart ordersByDay={analytics.ordersByDay} />
        </>
      ) : (
        <Card variant="admin" className={dashboardCardPadding}>
          <p className={`text-center ${dashboardEmptyText}`}>{t('admin.analytics.noAnalyticsData')}</p>
        </Card>
      )}
    </div>
  );
}

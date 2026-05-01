'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import {
  adminFilterLabelClass,
  adminFormControlClass,
  dashboardCardPadding,
  dashboardSectionTitle,
} from '../../components/dashboardUi';
import { formatDate } from '../utils';
import type { AnalyticsData } from '../types';

interface PeriodSelectorProps {
  period: string;
  startDate: string;
  endDate: string;
  analytics: AnalyticsData | null;
  onPeriodChange: (period: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function PeriodSelector({
  period,
  startDate,
  endDate,
  analytics,
  onPeriodChange,
  onStartDateChange,
  onEndDateChange,
}: PeriodSelectorProps) {
  const { t } = useTranslation();

  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className={dashboardSectionTitle}>{t('admin.analytics.timePeriod')}</h2>
        {analytics ? (
          <div className="rounded-lg bg-admin-surface px-3 py-1.5 text-sm text-admin-brand/70 ring-1 ring-inset ring-admin-brand-2/12">
            {formatDate(analytics.dateRange.start)} – {formatDate(analytics.dateRange.end)}
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="analytics-period" className={adminFilterLabelClass}>
            {t('admin.analytics.period')}
          </label>
          <select
            id="analytics-period"
            value={period}
            onChange={(e) => {
              onPeriodChange(e.target.value);
              if (e.target.value !== 'custom') {
                onStartDateChange('');
                onEndDateChange('');
              }
            }}
            className={`${adminFormControlClass} w-full`}
          >
            <option value="day">{t('admin.analytics.today')}</option>
            <option value="week">{t('admin.analytics.last7Days')}</option>
            <option value="month">{t('admin.analytics.last30Days')}</option>
            <option value="year">{t('admin.analytics.lastYear')}</option>
            <option value="custom">{t('admin.analytics.customRange')}</option>
          </select>
        </div>
        {period === 'custom' ? (
          <>
            <div className="min-w-[200px] flex-1">
              <label htmlFor="analytics-start" className={adminFilterLabelClass}>
                {t('admin.analytics.startDate')}
              </label>
              <input
                id="analytics-start"
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className={`${adminFormControlClass} w-full`}
              />
            </div>
            <div className="min-w-[200px] flex-1">
              <label htmlFor="analytics-end" className={adminFilterLabelClass}>
                {t('admin.analytics.endDate')}
              </label>
              <input
                id="analytics-end"
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className={`${adminFormControlClass} w-full`}
              />
            </div>
          </>
        ) : null}
      </div>
    </Card>
  );
}

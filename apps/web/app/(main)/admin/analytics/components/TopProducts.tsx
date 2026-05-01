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

interface TopProductsProps {
  products: AnalyticsData['topProducts'];
}

export function TopProducts({ products }: TopProductsProps) {
  const { t } = useTranslation();

  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className={dashboardSectionTitle}>{t('admin.analytics.topSellingProducts')}</h2>
        <div className={adminSectionIconWrapClass}>
          <svg className="h-5 w-5 text-admin-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>
      <div className="space-y-3">
        {products.length === 0 ? (
          <div className="py-8 text-center">
            <p className={dashboardEmptyText}>{t('admin.analytics.noSalesDataAvailable')}</p>
          </div>
        ) : (
          products.map((product, index) => (
            <div
              key={product.variantId}
              className={`group flex items-center gap-4 ${dashboardInsetRow} hover:shadow-[0_4px_18px_-6px_rgba(47,63,61,0.12)]`}
            >
              <div className="shrink-0">
                <div className={dashboardRankChip}>{index + 1}</div>
              </div>
              {product.image ? (
                <div className="shrink-0">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-14 w-14 rounded-lg border border-admin-brand-2/15 object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className={`mb-1 truncate ${dashboardRowPrimaryMedium}`}>{product.title}</p>
                <p className={`mb-1 ${dashboardRowMeta}`}>
                  {t('admin.analytics.skuLabel')}: {product.sku}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-admin-brand/60">
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {t('admin.analytics.sold').replace('{count}', product.totalQuantity.toString())}
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
                    {t('admin.analytics.orders').replace('{count}', product.orderCount.toString())}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-base font-bold tracking-tight text-admin-brand">{formatCurrency(product.totalRevenue)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

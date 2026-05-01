'use client';

import { Card } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-client';
import { formatCurrency } from '../utils/dashboardUtils';
import {
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardGhostLink,
  dashboardInsetRowCompact,
  dashboardRankChip,
  dashboardRowMeta,
  dashboardRowPrimary,
  dashboardRowPrimaryMedium,
  dashboardSectionHeaderRow,
  dashboardSectionTitle,
} from './dashboardUi';

interface TopProduct {
  variantId: string;
  productId: string;
  title: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  image?: string | null;
}

interface TopProductsCardProps {
  topProducts: TopProduct[];
  topProductsLoading: boolean;
}

export function TopProductsCard({ topProducts, topProductsLoading }: TopProductsCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <div className={dashboardSectionHeaderRow}>
        <h2 className={dashboardSectionTitle}>{t('admin.dashboard.topSellingProducts')}</h2>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className={dashboardGhostLink}
        >
          {t('admin.dashboard.viewAll')}
        </button>
      </div>
      <div className="space-y-3">
        {topProductsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 rounded-lg bg-admin-surface" />
              </div>
            ))}
          </div>
        ) : topProducts.length === 0 ? (
          <div className={`py-14 text-center ${dashboardEmptyText}`}>
            <p>{t('admin.dashboard.noSalesData')}</p>
          </div>
        ) : (
          topProducts.map((product, index) => (
            <div
              key={product.variantId}
              className={`flex cursor-pointer items-center gap-4 ${dashboardInsetRowCompact}`}
              onClick={() => router.push(`/admin/products/${product.productId}`)}
            >
              <div className="flex-shrink-0">
                <div className={dashboardRankChip}>{index + 1}</div>
              </div>
              {product.image ? (
                <div className="flex-shrink-0">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-12 w-12 rounded object-cover"
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className={`truncate ${dashboardRowPrimaryMedium}`}>{product.title}</p>
                <p className={dashboardRowMeta}>SKU: {product.sku}</p>
                <p className={`mt-1 ${dashboardRowMeta}`}>
                  {t('admin.dashboard.sold').replace('{count}', product.totalQuantity.toString())} •{' '}
                  {t('admin.dashboard.orders').replace('{count}', product.orderCount.toString())}
                </p>
              </div>
              <div className="text-right">
                <p className={dashboardRowPrimary}>
                  {formatCurrency(product.totalRevenue, 'RUB')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

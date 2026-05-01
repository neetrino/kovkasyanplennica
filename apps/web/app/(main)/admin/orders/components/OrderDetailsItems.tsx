'use client';

import { useTranslation } from '@/lib/i18n-client';
import { Card } from '@shop/ui';
import { CurrencyCode } from '@/lib/currency';
import {
  adminDetailMutedClass,
  adminDetailSectionTitleClass,
  adminTableHeadCellClass,
  adminTableHeadRowClass,
  dashboardCardPadding,
} from '../../components/dashboardUi';
import { getColorValue } from '../utils/orderUtils';
import type { OrderDetails } from '../useOrders';

const itemsThClass = `${adminTableHeadCellClass} normal-case tracking-normal`;

interface OrderDetailsItemsProps {
  orderDetails: OrderDetails;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderDetailsItems({
  orderDetails,
  formatCurrency,
}: OrderDetailsItemsProps) {
  const { t } = useTranslation();

  const getColorsArray = (colors: unknown): string[] => {
    if (!colors) return [];
    if (Array.isArray(colors)) return colors;
    if (typeof colors === 'string') {
      try {
        const parsed = JSON.parse(colors);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  if (!Array.isArray(orderDetails.items) || orderDetails.items.length === 0) {
    return (
      <Card variant="admin" className={dashboardCardPadding}>
        <h3 className={`${adminDetailSectionTitleClass} mb-3`}>{t('admin.orders.orderDetails.items')}</h3>
        <div className={adminDetailMutedClass}>{t('admin.orders.orderDetails.noItemsFound')}</div>
      </Card>
    );
  }

  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <h3 className={`${adminDetailSectionTitleClass} mb-3`}>{t('admin.orders.orderDetails.items')}</h3>
      <div className="overflow-x-auto rounded-lg border border-admin-brand-2/15">
        <table className="min-w-full text-sm text-admin-brand/90">
          <thead className={adminTableHeadRowClass}>
            <tr>
              <th className={`${itemsThClass} px-3 py-2`}>{t('admin.orders.orderDetails.product')}</th>
              <th className={`${itemsThClass} px-3 py-2`}>{t('admin.orders.orderDetails.sku')}</th>
              <th className={`${itemsThClass} px-3 py-2`}>{t('admin.orders.orderDetails.colorSize')}</th>
              <th className={`${itemsThClass} px-3 py-2 text-right`}>{t('admin.orders.orderDetails.qty')}</th>
              <th className={`${itemsThClass} px-3 py-2 text-right`}>{t('admin.orders.orderDetails.price')}</th>
              <th className={`${itemsThClass} px-3 py-2 text-right`}>{t('admin.orders.orderDetails.totalCol')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-brand-2/12 bg-white">
            {orderDetails.items.map((item) => {
              const allOptions = item.variantOptions || [];
              return (
                <tr key={item.id} className="transition-colors hover:bg-admin-surface/40">
                  <td className="px-3 py-2 font-medium text-admin-brand">{item.productTitle}</td>
                  <td className="px-3 py-2 text-admin-muted">{item.sku}</td>
                  <td className="px-3 py-2">
                    {allOptions.length > 0 ? (
                      <div className="flex flex-wrap gap-2 items-center">
                        {allOptions.map((opt, optIndex) => {
                          if (!opt.attributeKey || !opt.value) return null;
                          const attributeKey = opt.attributeKey.toLowerCase().trim();
                          const isColor = attributeKey === 'color' || attributeKey === 'colour';
                          const displayLabel = opt.label || opt.value;
                          const hasImage = opt.imageUrl && opt.imageUrl.trim() !== '';
                          const colors = getColorsArray(opt.colors);
                          const colorHex = colors.length > 0 ? colors[0] : (isColor ? getColorValue(opt.value) : null);
                          return (
                            <div key={optIndex} className="flex items-center gap-1.5">
                              {hasImage ? (
                                <img
                                  src={opt.imageUrl!}
                                  alt={displayLabel}
                                  className="h-4 w-4 flex-shrink-0 rounded border border-admin-brand-2/25 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : isColor && colorHex ? (
                                <div
                                  className="h-4 w-4 flex-shrink-0 rounded-full border border-admin-brand-2/25"
                                  style={{ backgroundColor: colorHex }}
                                  title={displayLabel}
                                />
                              ) : null}
                              <span className="text-xs capitalize text-admin-brand/80">{displayLabel}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-admin-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-admin-brand/80">{item.quantity}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-admin-brand">
                    {formatCurrency(item.unitPrice, orderDetails.currency || 'AMD', 'USD')}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-admin-brand">
                    {formatCurrency(item.total, orderDetails.currency || 'AMD', 'USD')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}


'use client';

import type { ChangeEvent } from 'react';
import { Card, Button, Input } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import { formatPrice } from '@/lib/currency';
import {
  adminFormControlClass,
  adminModalTitleClass,
  adminSectionSubtitleClass,
  adminSolidButtonClass,
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardInsetRow,
  dashboardRowMeta,
  dashboardRowPrimaryMedium,
} from '../../components/dashboardUi';

interface Product {
  id: string;
  title: string;
  image?: string;
  price?: number;
  discountPercent?: number;
}

interface ProductDiscountsCardProps {
  products: Product[];
  productsLoading: boolean;
  productDiscounts: Record<string, number>;
  setProductDiscounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleProductDiscountSave: (productId: string) => void;
  savingProductId: string | null;
}

export function ProductDiscountsCard({
  products,
  productsLoading,
  productDiscounts,
  setProductDiscounts,
  handleProductDiscountSave,
  savingProductId,
}: ProductDiscountsCardProps) {
  const { t } = useTranslation();

  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <div className="mb-6">
        <h2 className={adminModalTitleClass}>{t('admin.quickSettings.productDiscounts')}</h2>
        <p className={`mt-1 ${adminSectionSubtitleClass}`}>{t('admin.quickSettings.productDiscountsSubtitle')}</p>
      </div>

      {productsLoading ? (
        <div className="py-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
          <p className={dashboardEmptyText}>{t('admin.quickSettings.loadingProducts')}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-10 text-center">
          <p className={dashboardEmptyText}>{t('admin.quickSettings.noProducts')}</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {products.map((product) => {
            const currentDiscount = Number(productDiscounts[product.id] ?? product.discountPercent ?? 0);
            const originalPrice = product.price || 0;
            const discountedPrice = currentDiscount > 0 && originalPrice > 0
              ? Math.round(originalPrice * (1 - currentDiscount / 100))
              : originalPrice;

            return (
              <div
                key={product.id}
                className={`flex flex-wrap items-center gap-4 ${dashboardInsetRow}`}
              >
                {product.image && (
                  <div className="flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="h-16 w-16 rounded-md border border-admin-brand-2/15 object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className={`truncate ${dashboardRowPrimaryMedium}`}>{product.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {currentDiscount > 0 && originalPrice > 0 ? (
                      <>
                        <span className="select-none text-xs font-semibold text-admin-brand">{formatPrice(discountedPrice)}</span>
                        <span className={`select-none text-xs line-through ${dashboardRowMeta}`}>{formatPrice(originalPrice)}</span>
                        <span className="text-xs font-medium text-red-800/90">-{currentDiscount}%</span>
                      </>
                    ) : (
                      <span className={`select-none text-xs ${dashboardRowMeta}`}>
                        {originalPrice > 0 ? formatPrice(originalPrice) : 'N/A'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={productDiscounts[product.id] ?? product.discountPercent ?? 0}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      const discountValue = value === '' ? 0 : parseFloat(value) || 0;
                      console.log(`🔄 [QUICK SETTINGS] Updating discount for product ${product.id}: ${discountValue}%`);
                      setProductDiscounts((prev) => {
                        const updated = {
                          ...prev,
                          [product.id]: discountValue,
                        };
                        console.log(`✅ [QUICK SETTINGS] Updated productDiscounts:`, updated);
                        return updated;
                      });
                    }}
                    className={`${adminFormControlClass} !w-20`}
                    placeholder="0"
                  />
                  <span className="w-6 text-sm font-medium text-admin-brand/70">%</span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleProductDiscountSave(product.id)}
                    disabled={savingProductId === product.id}
                    className={`px-4 ${adminSolidButtonClass}`}
                  >
                    {savingProductId === product.id ? (
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-admin-flesh/40 border-b-admin-flesh" />
                      </div>
                    ) : (
                      t('admin.quickSettings.save')
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}






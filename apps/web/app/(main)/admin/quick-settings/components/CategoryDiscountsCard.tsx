'use client';

import type { ChangeEvent } from 'react';
import { Card, Button, Input } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import {
  adminFormControlClass,
  adminModalTitleClass,
  adminSectionSubtitleClass,
  adminSolidButtonClass,
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardRowMeta,
  dashboardRowPrimaryMedium,
} from '../../components/dashboardUi';

interface AdminCategory {
  id: string;
  title: string;
  parentId: string | null;
}

interface CategoryDiscountsCardProps {
  categories: AdminCategory[];
  categoriesLoading: boolean;
  categoryDiscounts: Record<string, number>;
  updateCategoryDiscountValue: (categoryId: string, value: string) => void;
  clearCategoryDiscount: (categoryId: string) => void;
  handleCategoryDiscountSave: () => void;
  categorySaving: boolean;
}

export function CategoryDiscountsCard({
  categories,
  categoriesLoading,
  categoryDiscounts,
  updateCategoryDiscountValue,
  clearCategoryDiscount,
  handleCategoryDiscountSave,
  categorySaving,
}: CategoryDiscountsCardProps) {
  const { t } = useTranslation();

  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={adminModalTitleClass}>{t('admin.quickSettings.categoryDiscounts')}</h2>
          <p className={`mt-1 ${adminSectionSubtitleClass}`}>{t('admin.quickSettings.categoryDiscountsSubtitle')}</p>
        </div>
        <Button
          variant="primary"
          onClick={handleCategoryDiscountSave}
          disabled={categorySaving || categories.length === 0}
          className={adminSolidButtonClass}
        >
          {categorySaving ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-admin-flesh/40 border-b-admin-flesh" />
              <span>{t('admin.quickSettings.saving')}</span>
            </div>
          ) : (
            t('admin.quickSettings.save')
          )}
        </Button>
      </div>

      {categoriesLoading ? (
        <div className="py-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-admin-surface border-b-admin-brand" />
          <p className={dashboardEmptyText}>{t('admin.quickSettings.loadingCategories')}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-admin-brand-2/25 bg-admin-surface/40 py-8 text-center text-sm text-admin-brand/55">
          {t('admin.quickSettings.noCategories')}
        </div>
      ) : (
        <div className="max-h-[420px] divide-y divide-admin-brand-2/12 overflow-y-auto rounded-lg border border-admin-brand-2/15">
          {categories.map((category) => {
            const currentValue = categoryDiscounts[category.id];
            return (
              <div
                key={category.id}
                className="flex flex-wrap items-center gap-4 bg-white px-4 py-3 transition-colors hover:bg-admin-surface/50"
              >
                <div className="min-w-0 flex-1">
                  <p className={`truncate ${dashboardRowPrimaryMedium}`}>
                    {category.title || t('admin.quickSettings.untitledCategory')}
                  </p>
                  {category.parentId ? (
                    <p className={dashboardRowMeta}>{t('admin.quickSettings.parentCategoryId').replace('{id}', category.parentId)}</p>
                  ) : (
                    <p className={dashboardRowMeta}>{t('admin.quickSettings.rootCategory')}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={currentValue === undefined ? '' : currentValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateCategoryDiscountValue(category.id, e.target.value)}
                    className={`${adminFormControlClass} !w-24`}
                    placeholder="0"
                  />
                  <span className="text-sm font-medium text-admin-brand/70">%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearCategoryDiscount(category.id)}
                    disabled={currentValue === undefined}
                    className="!text-admin-brand/55 hover:!bg-admin-surface disabled:!opacity-40"
                  >
                    {t('admin.quickSettings.clear')}
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






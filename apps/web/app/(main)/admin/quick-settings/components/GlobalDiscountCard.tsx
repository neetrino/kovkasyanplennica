'use client';

import type { ChangeEvent } from 'react';
import { Button, Input } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';
import {
  adminAlertSuccessClass,
  adminFormControlClass,
  adminSectionIconWrapClass,
  adminSectionSubtitleClass,
  adminSolidButtonClass,
  adminPaginationNavButtonClass,
} from '../../components/dashboardUi';

interface GlobalDiscountCardProps {
  globalDiscount: number;
  setGlobalDiscount: (value: number) => void;
  discountLoading: boolean;
  discountSaving: boolean;
  handleDiscountSave: () => void;
}

export function GlobalDiscountCard({
  globalDiscount,
  setGlobalDiscount,
  discountLoading,
  discountSaving,
  handleDiscountSave,
}: GlobalDiscountCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-admin-brand-2/18 bg-white p-4 shadow-[0_1px_2px_rgba(47,63,61,0.05),0_8px_24px_-8px_rgba(47,63,61,0.1)] sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className={adminSectionIconWrapClass}>
          <svg className="h-5 w-5 text-admin-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-admin-brand">{t('admin.quickSettings.globalDiscount')}</h3>
          <p className="text-xs text-admin-brand/55">{t('admin.quickSettings.forAllProducts')}</p>
        </div>
      </div>

      {discountLoading ? (
        <div className="animate-pulse">
          <div className="h-10 rounded-md bg-admin-surface" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={globalDiscount}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setGlobalDiscount(value === '' ? 0 : parseFloat(value) || 0);
              }}
              className={`${adminFormControlClass} min-w-[5rem] flex-1`}
              placeholder="0"
            />
            <span className={`w-8 text-sm font-medium text-admin-brand/70`}>%</span>
            <Button
              variant="primary"
              onClick={handleDiscountSave}
              disabled={discountSaving}
              className={`px-6 ${adminSolidButtonClass}`}
            >
              {discountSaving ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-admin-flesh/40 border-b-admin-flesh" />
                  <span>{t('admin.quickSettings.saving')}</span>
                </div>
              ) : (
                t('admin.quickSettings.save')
              )}
            </Button>
          </div>

          {globalDiscount > 0 ? (
            <div className={adminAlertSuccessClass}>
              <p className="text-sm">
                <strong>{t('admin.quickSettings.active')}</strong>{' '}
                {t('admin.quickSettings.discountApplied').replace('{percent}', globalDiscount.toString())}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-admin-brand-2/15 bg-admin-surface/50 p-3">
              <p className={`text-sm ${adminSectionSubtitleClass}`}>{t('admin.quickSettings.noGlobalDiscount')}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setGlobalDiscount(10)} className={`flex-1 ${adminPaginationNavButtonClass}`}>
              10%
            </Button>
            <Button variant="outline" size="sm" onClick={() => setGlobalDiscount(20)} className={`flex-1 ${adminPaginationNavButtonClass}`}>
              20%
            </Button>
            <Button variant="outline" size="sm" onClick={() => setGlobalDiscount(30)} className={`flex-1 ${adminPaginationNavButtonClass}`}>
              30%
            </Button>
            <Button variant="outline" size="sm" onClick={() => setGlobalDiscount(50)} className={`flex-1 ${adminPaginationNavButtonClass}`}>
              50%
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setGlobalDiscount(0)} className={`px-3 !text-admin-brand/60 hover:!bg-admin-surface`}>
              {t('admin.quickSettings.cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}






'use client';

import { Button } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-client';
import { adminSectionIconWrapClass, adminPaginationNavButtonClass } from '../../components/dashboardUi';

export function QuickInfoCard() {
  const { t } = useTranslation();
  const router = useRouter();

  const bullet = 'mt-0.5 shrink-0 text-admin-brand';

  return (
    <div className="rounded-xl border border-admin-brand-2/18 bg-white p-4 shadow-[0_1px_2px_rgba(47,63,61,0.05),0_8px_24px_-8px_rgba(47,63,61,0.1)] sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className={adminSectionIconWrapClass}>
          <svg className="h-5 w-5 text-admin-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-admin-brand">{t('admin.quickSettings.usefulInformation')}</h3>
          <p className="text-xs text-admin-brand/55">{t('admin.quickSettings.aboutDiscounts')}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm text-admin-brand/70">
        <div className="flex items-start gap-2">
          <span className={bullet}>•</span>
          <p>{t('admin.quickSettings.discountApplies')}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className={bullet}>•</span>
          <p>{t('admin.quickSettings.discountExample')}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className={bullet}>•</span>
          <p>{t('admin.quickSettings.noDiscount')}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className={bullet}>•</span>
          <p>{t('admin.quickSettings.changesApplied')}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-admin-brand-2/15 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/settings')}
          className={`w-full ${adminPaginationNavButtonClass}`}
        >
          {t('admin.quickSettings.moreSettings')}
        </Button>
      </div>
    </div>
  );
}






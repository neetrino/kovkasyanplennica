'use client';

import { Card } from '@shop/ui';
import {
  adminBulkDangerButtonClass,
  adminPaginationNavButtonClass,
  dashboardCardPadding,
  dashboardEmptyText,
  dashboardInsetRow,
  dashboardRowMeta,
  dashboardRowPrimaryMedium,
  adminModalTitleClass,
} from '../../components/dashboardUi';
import type { SpinWheelPrize } from '../spin-wheel-admin.types';
interface ActivePrizesListProps {
  prizes: SpinWheelPrize[];
  onEdit: (prize: SpinWheelPrize) => void;
  onDelete: (prizeId: string) => void;
  onTogglePrizeEnabled: (prizeId: string, enabled: boolean) => void;
  togglingPrizeId: string | null;
  t: (key: string) => string;
}

export function ActivePrizesList({
  prizes,
  onEdit,
  onDelete,
  onTogglePrizeEnabled,
  togglingPrizeId,
  t,
}: ActivePrizesListProps) {
  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <h2 className={`mb-4 ${adminModalTitleClass}`}>{t('admin.spinWheel.activePrizesTitle')}</h2>
      <div className="space-y-3">
        {prizes.length === 0 && <p className={dashboardEmptyText}>{t('admin.spinWheel.noPrizes')}</p>}
        {prizes.map((prize) => {
          const prizeEnabled = prize.enabled !== false;
          const rowBusy = togglingPrizeId === prize.id;
          return (
            <div
              key={prize.id}
              className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${dashboardInsetRow} ${
                prizeEnabled ? '' : 'opacity-[0.72]'
              }`}
            >
              <div>
                <p className={dashboardRowPrimaryMedium}>
                  {prize.productTitle}
                  {prize.products?.length > 1 && (
                    <span className="ml-1 font-normal text-admin-muted">
                      (+{prize.products.length - 1} {t('admin.spinWheel.moreProducts')})
                    </span>
                  )}
                </p>
                <p className={`mt-1 ${dashboardRowMeta}`}>
                  {t('admin.spinWheel.dateRangeLabel')}: {new Date(prize.startDate).toLocaleString()} —{' '}
                  {new Date(prize.endDate).toLocaleString()}
                </p>
                <p className={dashboardRowMeta}>
                  {t('admin.spinWheel.audienceLabel')}:{' '}
                  {prize.audience === 'all' ? t('admin.spinWheel.audienceAll') : t('admin.spinWheel.audienceSelected')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-admin-brand/70">{t('admin.spinWheel.prizeRowToggleLabel')}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={prizeEnabled}
                    aria-busy={rowBusy}
                    disabled={rowBusy}
                    onClick={() => {
                      onTogglePrizeEnabled(prize.id, !prizeEnabled);
                    }}
                    className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border border-admin-brand-2/25 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-brand disabled:cursor-wait disabled:opacity-70 ${
                      prizeEnabled
                        ? 'bg-[#2f3f3d] after:translate-x-5'
                        : 'bg-admin-brand/10 after:translate-x-0'
                    } after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition-transform`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onEdit(prize)}
                  className={`rounded-md px-3 py-1.5 text-sm ${adminPaginationNavButtonClass}`}
                >
                  {t('admin.common.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(prize.id)}
                  className={`rounded-md px-3 py-1.5 text-sm ${adminBulkDangerButtonClass}`}
                >
                  {t('admin.common.delete')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

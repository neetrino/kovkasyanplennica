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
  t: (key: string) => string;
}

export function ActivePrizesList({ prizes, onEdit, onDelete, t }: ActivePrizesListProps) {
  return (
    <Card variant="admin" className={dashboardCardPadding}>
      <h2 className={`mb-4 ${adminModalTitleClass}`}>{t('admin.spinWheel.activePrizesTitle')}</h2>
      <div className="space-y-3">
        {prizes.length === 0 && <p className={dashboardEmptyText}>{t('admin.spinWheel.noPrizes')}</p>}
        {prizes.map((prize) => (
          <div
            key={prize.id}
            className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${dashboardInsetRow}`}
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
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => onEdit(prize)} className={`rounded-md px-3 py-1.5 text-sm ${adminPaginationNavButtonClass}`}>
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
        ))}
      </div>
    </Card>
  );
}

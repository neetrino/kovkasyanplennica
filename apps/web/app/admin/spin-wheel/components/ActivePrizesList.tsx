'use client';

import type { SpinWheelPrize } from '../spin-wheel-admin.types';
interface ActivePrizesListProps {
  prizes: SpinWheelPrize[];
  onEdit: (prize: SpinWheelPrize) => void;
  onDelete: (prizeId: string) => void;
  t: (key: string) => string;
}

export function ActivePrizesList({ prizes, onEdit, onDelete, t }: ActivePrizesListProps) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {t('admin.spinWheel.activePrizesTitle')}
      </h2>
      <div className="space-y-3">
        {prizes.length === 0 && (
          <p className="text-sm text-gray-500">{t('admin.spinWheel.noPrizes')}</p>
        )}
        {prizes.map((prize) => (
          <div
            key={prize.id}
            className="border border-gray-200 rounded-md p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div>
              <p className="font-medium text-gray-900">
                {prize.productTitle}
                {prize.products?.length > 1 && (
                  <span className="text-gray-500 font-normal ml-1">
                    (+{prize.products.length - 1} {t('admin.spinWheel.moreProducts')})
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                {t('admin.spinWheel.dateRangeLabel')}:{' '}
                {new Date(prize.startDate).toLocaleString()} -{' '}
                {new Date(prize.endDate).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {t('admin.spinWheel.audienceLabel')}:{' '}
                {prize.audience === 'all'
                  ? t('admin.spinWheel.audienceAll')
                  : t('admin.spinWheel.audienceSelected')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(prize)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
              >
                {t('admin.common.edit')}
              </button>
              <button
                type="button"
                onClick={() => onDelete(prize.id)}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600"
              >
                {t('admin.common.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

'use client';

import { useTranslation } from '@/lib/i18n-client';
import { formatSeatCountPrimary, getSeatLabelSuffixKey } from './tableSeatLabelFormat';

type TableSeatLabelProps = {
  seats: number;
  byWindow?: boolean;
  /** Վերին շարք — պիտակը սեղանի վրա, ոչ թե ամբողջ tile-ի երկրաչափական կենտրոնում */
  layout?: 'default' | 'topRow';
};

/**
 * Սեղանի կենտրոնում մարդկանց քանակը — Figma node 200:2347 (Inter Bold 14px, #4b564f)։
 */
export function TableSeatLabel({ seats, byWindow, layout = 'default' }: TableSeatLabelProps) {
  const { t } = useTranslation();
  const primary = formatSeatCountPrimary(seats);
  const suffixKey = getSeatLabelSuffixKey(seats);
  const line2 = t(`desktops.seatLabel.suffix.${suffixKey}`);

  /** Սինխրոն `tableSeatLabelFormat.TOP_ROW_SEAT_LABEL_TOP_PERCENT`-ի հետ (Tailwind JIT-ը պահանջում է ստատիկ class) */
  const topClass = layout === 'topRow' ? 'top-[30%]' : 'top-1/2';

  return (
    <div
      className={`pointer-events-none absolute left-1/2 z-[15] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center ${topClass}`}
      aria-hidden
    >
      <div className="font-sans text-[14px] font-bold not-italic leading-[12px] text-[#4b564f]">
        <p className="m-0">{primary}</p>
        <p className="m-0">{line2}</p>
      </div>
      {byWindow ? (
        <p className="m-0 font-sans text-[14px] font-bold not-italic leading-[12px] text-[rgba(75,86,79,0.58)]">
          ({t('desktops.tableCard.byWindow')})
        </p>
      ) : null}
    </div>
  );
}

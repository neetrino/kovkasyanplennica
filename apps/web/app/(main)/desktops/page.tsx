'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-client';
import { TABLES, type TableConfig } from './table-data';
import type { QuickBookingValues } from './DesktopsBookingQuickBar';
import { ReservationModal } from './ReservationModal';
import { ScaledFigmaFloorPlan } from './figmaFloorPlan.scaled';
import { RESERVATION_TIME_SLOTS } from './reservationTimeSlots';

const TABLES_SECTION_DIVIDER_SRC = '/assets/hero/Vector7.svg';

export default function DesktopsPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [selectedTable, setSelectedTable] = useState<TableConfig | null>(null);
  const [quickBooking, setQuickBooking] = useState<QuickBookingValues>({
    date: '',
    time: '',
    guestCount: '2',
  });

  useEffect(() => {
    const d = searchParams.get('date');
    const timeParam = searchParams.get('time');
    const g = searchParams.get('guests');
    if (d == null && timeParam == null && g == null) return;

    setQuickBooking((prev) => {
      const nextDate = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : prev.date;
      let nextTime = prev.time;
      if (timeParam !== null) {
        if (timeParam === '' || RESERVATION_TIME_SLOTS.includes(timeParam)) {
          nextTime = timeParam;
        }
      }
      const nextGuests = g && /^[1-8]$/.test(g) ? g : prev.guestCount;
      return { date: nextDate, time: nextTime, guestCount: nextGuests };
    });
  }, [searchParams]);

  const productFromUrl = useMemo(() => {
    const title = searchParams.get('productTitle');
    const imageUrl = searchParams.get('productImageUrl');
    const profit = searchParams.get('profitCents');
    const profitNum = profit != null ? parseInt(profit, 10) : null;
    return {
      productTitle: title || null,
      productImageUrl: imageUrl || null,
      profitCents: profitNum != null && Number.isFinite(profitNum) ? profitNum : null,
    };
  }, [searchParams]);

  const topTables = TABLES.filter((x) => x.zone === 'top');
  const leftTables = TABLES.filter((x) => x.zone === 'left');
  const centerTable = TABLES.filter((x) => x.zone === 'center');
  const crTables = TABLES.filter((x) => x.zone === 'center-right');
  const winTables = TABLES.filter((x) => x.zone === 'window');
  const botTables = TABLES.filter((x) => x.zone === 'bottom');

  return (
    <div className="relative min-h-screen w-full bg-[#2F3E3E]">
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-0 aspect-square max-h-[420px] w-[260px] -translate-x-1/2 opacity-25 md:max-h-[480px] md:w-[380px]"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="size-full object-contain" />
      </div>
      <div
        className="pointer-events-none absolute bottom-0 right-0 z-[1] aspect-square max-h-[320px] w-[200px] translate-x-1/4 translate-y-1/4 opacity-15 md:max-h-[380px] md:w-[280px]"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="size-full object-contain" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:py-14">
        <div className="relative mb-4 md:mb-6">
          <h1 className="font-sansation text-[clamp(1.75rem,5.5vw+0.5rem,5.8125rem)] font-light italic leading-[clamp(1.5rem,4.5vw+0.25rem,4.875rem)] text-[#FFF4DE] lg:text-[93px] lg:leading-[78px]">
            {t('desktops.page.title')}
          </h1>
          <div
            className="relative mt-3 flex h-[8px] w-[50%] max-w-[300px] justify-start md:mt-4 md:h-[10px] lg:h-[12px]"
            aria-hidden
          >
            <img
              src={TABLES_SECTION_DIVIDER_SRC}
              alt=""
              className="h-full w-full object-contain object-left opacity-90"
            />
          </div>
          <p className="mt-4 max-w-xl whitespace-pre-line text-left text-sm font-normal leading-relaxed text-[#FCE6C9] md:mt-5 md:text-base">
            {t('desktops.page.intro')}
          </p>
        </div>

        <div id="desktops-floor-plan" className="mx-auto max-w-5xl xl:max-w-6xl">
          <ScaledFigmaFloorPlan
            topTables={topTables}
            leftTables={leftTables}
            centerTable={centerTable}
            crTables={crTables}
            winTables={winTables}
            botTables={botTables}
            onSelectTable={setSelectedTable}
          />
        </div>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-[#FCE6C9]/40 md:mt-5 md:text-xs">
          {t('desktops.page.footerNote')}
        </p>
      </div>

      {selectedTable && (
        <ReservationModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          productTitle={productFromUrl.productTitle}
          productImageUrl={productFromUrl.productImageUrl}
          profitCents={productFromUrl.profitCents}
          quickBarPrefill={quickBooking}
        />
      )}
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { bookingQuickBarAssets } from './bookingQuickBar.assets';
import { RESERVATION_TIME_SLOTS } from './reservationTimeSlots';

const QUICK_BAR_MAX_GUESTS = 8;

export type QuickBookingValues = {
  date: string;
  time: string;
  guestCount: string;
};

type DesktopsBookingQuickBarProps = {
  value: QuickBookingValues;
  onChange: (next: QuickBookingValues) => void;
  onReserveClick: () => void;
  minDate: string;
};

function FieldShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[32px] bg-[rgba(245,220,187,0.3)] p-0">
      <div className="relative h-[46px] rounded-[40px] border border-white/10 bg-white/5 md:h-[48px]">
        {children}
      </div>
    </div>
  );
}

export function DesktopsBookingQuickBar({
  value,
  onChange,
  onReserveClick,
  minDate,
}: DesktopsBookingQuickBarProps) {
  const { t } = useTranslation();

  function patch(partial: Partial<QuickBookingValues>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div
      className="mt-6 mb-6 overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.2)] md:mt-8 md:mb-8 md:p-6 lg:rounded-[2.5rem] lg:p-8"
      data-name="booking-quick-bar"
    >
      <p className="mx-auto mb-5 max-w-md text-center text-sm font-normal leading-snug text-white md:mb-6 md:text-base md:leading-6">
        {t('desktops.quickBar.tagline')}
      </p>

      <div className="mx-auto mb-5 flex max-w-3xl flex-col gap-5 md:mb-6 lg:flex-row lg:items-end lg:justify-center lg:gap-6">
        <div className="flex-1 lg:max-w-[180px]">
          <p className="mb-1.5 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#cbc0af] lg:text-left">
            {t('desktops.quickBar.date')}
          </p>
          <FieldShell>
            <img
              src={bookingQuickBarAssets.calendar}
              alt=""
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 md:left-3 md:h-[15px] md:w-[15px]"
              aria-hidden
            />
            <input
              type="date"
              value={value.date}
              min={minDate}
              onChange={(e) => patch({ date: e.target.value })}
              className="h-full w-full cursor-pointer rounded-[40px] border-0 bg-transparent pl-10 pr-9 text-xs text-[#fdfdfd] outline-none [color-scheme:dark] md:pl-11 md:pr-10 md:text-sm"
            />
            <img
              src={bookingQuickBarAssets.chevron}
              alt=""
              className="pointer-events-none absolute right-2.5 top-1/2 size-[18px] -translate-y-1/2 opacity-80 md:right-3 md:size-[21px]"
              aria-hidden
            />
          </FieldShell>
        </div>

        <div className="flex-1 lg:max-w-[200px]">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.1em] text-[#cbc0af] lg:text-left">
            {t('desktops.quickBar.time')}
          </p>
          <FieldShell>
            <img
              src={bookingQuickBarAssets.clock}
              alt=""
              className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2"
              aria-hidden
            />
            <select
              value={value.time}
              onChange={(e) => patch({ time: e.target.value })}
              className="h-full w-full cursor-pointer appearance-none rounded-[48px] border-0 bg-transparent pl-11 pr-10 text-sm text-[#fdfdfd] outline-none"
            >
              <option value="">{t('desktops.modal.timePlaceholder')}</option>
              {RESERVATION_TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            <img
              src={bookingQuickBarAssets.chevron}
              alt=""
              className="pointer-events-none absolute right-2.5 top-1/2 size-[18px] -translate-y-1/2 opacity-80 md:right-3 md:size-[21px]"
              aria-hidden
            />
          </FieldShell>
        </div>

        <div className="flex-1 lg:max-w-[180px]">
          <p className="mb-1.5 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#cbc0af] lg:text-left">
            {t('desktops.quickBar.guests')}
          </p>
          <FieldShell>
            <img
              src={bookingQuickBarAssets.guests}
              alt=""
              className="pointer-events-none absolute left-2.5 top-1/2 h-2.5 w-4 -translate-y-1/2 md:left-3 md:h-3 md:w-[18px]"
              aria-hidden
            />
            <select
              value={value.guestCount}
              onChange={(e) => patch({ guestCount: e.target.value })}
              className="h-full w-full cursor-pointer appearance-none rounded-[40px] border-0 bg-transparent pl-10 pr-9 text-xs text-[#fdfdfd] outline-none md:pl-11 md:pr-10 md:text-sm"
            >
              {Array.from({ length: QUICK_BAR_MAX_GUESTS }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {t('desktops.modal.guestsOption').replace('{n}', String(n))}
                </option>
              ))}
            </select>
            <img
              src={bookingQuickBarAssets.chevron}
              alt=""
              className="pointer-events-none absolute right-2.5 top-1/2 size-[18px] -translate-y-1/2 opacity-80 md:right-3 md:size-[21px]"
              aria-hidden
            />
          </FieldShell>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onReserveClick}
          className="h-11 min-w-[200px] rounded-[40px] bg-[#ffe5c2] px-6 text-sm font-bold text-[#2f3f3d] transition-transform hover:bg-[#ffd9a8] active:scale-[0.98] md:h-12 md:min-w-[219px] md:rounded-[48px] md:px-8 md:text-base"
        >
          {t('desktops.quickBar.cta')}
        </button>
      </div>
    </div>
  );
}
